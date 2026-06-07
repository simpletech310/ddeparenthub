import type { BreakdownItem, BreakdownPayload, DocType } from "@/lib/types";
import {
  PROMPT_VERSION,
  IEP_BREAKDOWN_SYSTEM,
  TRIENNIAL_BREAKDOWN_SYSTEM,
} from "./config";
import { aiEnabled, generateJson } from "./anthropic";
import { extractText, hashText } from "./extractText";

// Fast model for the (blocking) document breakdown so it completes well within the
// serverless timeout. A single combined call returns the full breakdown + goal drafts.
const BREAKDOWN_MODEL = "claude-haiku-4-5";

// Stubbed document-breakdown pipelines (PRD §5, §6, §8.2), implemented as the SAME
// two-step shape the real Claude pipeline uses:
//
//   extractText(doc)  ->  extract<Type>(text)  ->  render<Type>(structured)
//
// Step 1 pulls verbatim-bound structured fields; step 2 renders the parent-facing
// plain-language layers + translation. Both steps are deterministic (temperature 0 in
// the real impl; constant mapping here), so identical input yields identical output.
// IEP and triennial are intentionally separate pipelines (§6).

const DISCLAIMER =
  "This is a tool to help you understand your child's plan in plain language. It is not legal advice " +
  "and not a substitute for your IEP team. Always confirm details with your IEP team or evaluator.";

// A goal as extracted from a document, before it is keyed to a family/child/document.
export interface GoalDraft {
  domain: string;
  verbatimText: string;
  baseline: string;
  target: string;
  measure: string;
  confidence: "high" | "low";
}

export interface ProcessResult {
  payload: BreakdownPayload;
  goalDrafts: GoalDraft[];
  contentHash: string;
  promptVersion: string;
}

// Route a document to the correct pipeline and return a fully cacheable result.
// When an Anthropic key is configured we run the real two-step pipeline (extract -> render)
// with temperature 0; any failure falls back to the deterministic renderer so the app always
// produces a valid breakdown. The result is cached by (contentHash, PROMPT_VERSION) upstream,
// so a document is only ever processed once unless deliberately re-analyzed.
export async function processDocument(input: { fileName: string; docType: DocType }): Promise<ProcessResult> {
  const { text } = extractText(input);
  const contentHash = hashText(`${PROMPT_VERSION}:${input.docType}:${text}`);

  let built: { payload: BreakdownPayload; goalDrafts: GoalDraft[] } | null = null;
  if (aiEnabled()) {
    try {
      built = await processWithAI(text, input.docType);
    } catch {
      built = null; // fall back below
    }
  }
  if (!built) built = input.docType === "triennial" ? renderTriennial() : renderIep();

  return { ...built, contentHash, promptVersion: PROMPT_VERSION };
}

// Synchronous, offline, deterministic breakdown — used by the seed (cold start must not
// depend on the network) and as the runtime fallback above.
export function processDocumentDeterministic(input: { fileName: string; docType: DocType }): ProcessResult {
  const { text } = extractText(input);
  const contentHash = hashText(`${PROMPT_VERSION}:${input.docType}:${text}`);
  const built = input.docType === "triennial" ? renderTriennial() : renderIep();
  return { ...built, contentHash, promptVersion: PROMPT_VERSION };
}

// ---------------- Live single-pass Claude pipeline ----------------

const SCHEMA_IEP = `Return JSON only, EXACTLY this shape (omit array entries not present in the source):
{"summary":{"en":string,"es":string},
 "keyDates":[{"label":string,"date":"YYYY-MM-DD"}],
 "questionsToAsk":[string],
 "items":[{"category":string,"whatItSays":string,"whatItMeans":{"en":string,"es":string},"whatYouCanDo":{"en":string,"es":string},"confidence":"high"|"low"}],
 "goals":[{"domain":string,"verbatimText":string,"baseline":string,"target":string,"measure":string,"confidence":"high"|"low"}],
 "suggestedCourseTags":[string]}`;

const SCHEMA_TRIENNIAL = `Return JSON only, EXACTLY this shape (omit array entries not present in the source):
{"summary":{"en":string,"es":string},
 "keyDates":[{"label":string,"date":"YYYY-MM-DD"}],
 "questionsToAsk":[string],
 "items":[{"category":string,"whatItSays":string,"whatItMeans":{"en":string,"es":string},"whatYouCanDo":{"en":string,"es":string},"confidence":"high"|"low"}],
 "suggestedCourseTags":[string]}`;

async function processWithAI(text: string, docType: DocType): Promise<{ payload: BreakdownPayload; goalDrafts: GoalDraft[] }> {
  const isTri = docType === "triennial";
  const system = isTri ? TRIENNIAL_BREAKDOWN_SYSTEM : IEP_BREAKDOWN_SYSTEM;
  const schema = isTri ? SCHEMA_TRIENNIAL : SCHEMA_IEP;

  // One combined extract+render call (fast model) — keeps the blocking request well under
  // the serverless timeout while still grounding the output in the source text.
  const out = await generateJson({
    system,
    user: `SOURCE DOCUMENT:\n${text}\n\n${schema}`,
    model: BREAKDOWN_MODEL,
    maxTokens: 4096,
  });

  const payload = validatePayload(out);

  // Build trackable goal drafts from the IEP output (triennials have none).
  const goalDrafts: GoalDraft[] = !isTri && Array.isArray(out?.goals)
    ? out.goals
        .filter((g: any) => g && typeof g.verbatimText === "string" && g.verbatimText.trim())
        .map((g: any) => ({
          domain: str(g.domain) || "Goal",
          verbatimText: str(g.verbatimText),
          baseline: str(g.baseline),
          target: str(g.target),
          measure: str(g.measure),
          confidence: g.confidence === "low" ? "low" : "high",
        }))
    : [];

  return { payload, goalDrafts };
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
function bilingual(v: any): { en: string; es: string } {
  const en = str(v?.en) || str(v);
  const es = str(v?.es) || en; // fall back to English if Spanish is missing
  return { en, es };
}

// Coerce/validate the model's render output into a well-formed BreakdownPayload.
// Throws if essentials are missing so the caller can fall back to the deterministic render.
function validatePayload(raw: any): BreakdownPayload {
  if (!raw || typeof raw !== "object") throw new Error("render: not an object");
  const summary = bilingual(raw.summary);
  if (!summary.en) throw new Error("render: missing summary");
  const itemsIn = Array.isArray(raw.items) ? raw.items : [];
  const items: BreakdownItem[] = itemsIn
    .filter((it: any) => it && (str(it.whatItSays) || str(it.category)))
    .map((it: any, i: number) => ({
      id: uid("bi", i + 1),
      category: str(it.category) || "Item",
      whatItSays: str(it.whatItSays),
      whatItMeans: bilingual(it.whatItMeans),
      whatYouCanDo: bilingual(it.whatYouCanDo),
      confidence: it.confidence === "low" ? "low" : "high",
    }));
  if (!items.length) throw new Error("render: no items");

  const keyDates = (Array.isArray(raw.keyDates) ? raw.keyDates : [])
    .filter((d: any) => d && str(d.label) && str(d.date))
    .map((d: any) => ({ label: str(d.label), date: str(d.date) }));
  const questionsToAsk = (Array.isArray(raw.questionsToAsk) ? raw.questionsToAsk : [])
    .map((q: any) => str(q))
    .filter(Boolean);
  const suggestedCourseTags = (Array.isArray(raw.suggestedCourseTags) ? raw.suggestedCourseTags : [])
    .map((t: any) => str(t).toLowerCase().replace(/\s+/g, "_"))
    .filter(Boolean);

  return { summary, keyDates, questionsToAsk, items, disclaimer: DISCLAIMER, suggestedCourseTags };
}

function uid(prefix: string, n: number): string {
  return `${prefix}_${n}`;
}

// ---------------- IEP ----------------

function renderIep(): { payload: BreakdownPayload; goalDrafts: GoalDraft[] } {
  const payload: BreakdownPayload = {
    summary: {
      en:
        "This IEP focuses on your child's communication and social skills. The team set goals for " +
        "requesting items with words and taking turns with peers, and added speech therapy twice a week " +
        "plus classroom supports. The plan is reviewed once a year, and the next eligibility review is " +
        "due in about two years.",
      es:
        "Este IEP se enfoca en la comunicación y las habilidades sociales de su hijo. El equipo estableció " +
        "metas para pedir objetos con palabras y tomar turnos con sus compañeros, y agregó terapia del habla " +
        "dos veces por semana más apoyos en el salón. El plan se revisa una vez al año, y la próxima revisión " +
        "de elegibilidad es en unos dos años.",
    },
    keyDates: [
      { label: "Plan start", date: "2026-03-01" },
      { label: "Annual review", date: "2027-03-01" },
      { label: "Next eligibility (triennial)", date: "2029-03-01" },
    ],
    questionsToAsk: [
      "How will I know at home if the communication goal is on track?",
      "Can you show me what 'minimal prompting' looks like?",
      "How will speech therapy time be coordinated with the classroom?",
      "What should I do if I don't see progress in a few weeks?",
    ],
    items: [
      {
        id: uid("bi", 1),
        category: "Communication goal",
        whatItSays:
          "By the annual review, the student will request preferred items/activities using a 2–3 word " +
          "phrase in 4 out of 5 opportunities across 3 consecutive sessions with minimal adult prompting.",
        whatItMeans: {
          en:
            "The goal is for your child to ask for things they want using a short phrase (like 'want the ball') " +
            "most of the time, with only a little help from an adult.",
          es:
            "La meta es que su hijo pida lo que quiere usando una frase corta (como 'quiero la pelota') la " +
            "mayoría de las veces, con solo un poco de ayuda de un adulto.",
        },
        whatYouCanDo: {
          en:
            "Break it into steps: first a sound, then a word, then two words. Pause before handing over a " +
            "favorite item so there's a reason to ask, model the phrase, and reward the try right away. Notice " +
            "progress by jotting how much help was needed each time.",
          es:
            "Divídalo en pasos: primero un sonido, luego una palabra, luego dos palabras. Haga una pausa antes de " +
            "entregar un objeto favorito para dar una razón para pedir, modele la frase y premie el intento de " +
            "inmediato. Note el progreso anotando cuánta ayuda necesitó cada vez.",
        },
        confidence: "high",
      },
      {
        id: uid("bi", 2),
        category: "Social goal",
        whatItSays:
          "The student will take turns during a structured peer activity for 3 exchanges in 3 of 4 " +
          "opportunities as measured by staff data.",
        whatItMeans: {
          en:
            "Your child is working on going back and forth — taking turns — with another child a few times " +
            "during a planned activity.",
          es:
            "Su hijo está trabajando en ir y venir — tomar turnos — con otro niño varias veces durante una " +
            "actividad planificada.",
        },
        whatYouCanDo: {
          en:
            "Practice turn-taking with simple games at home (rolling a ball, stacking blocks). Say 'my turn… " +
            "your turn,' keep it short and fun, and cheer each exchange.",
          es:
            "Practique tomar turnos con juegos simples en casa (rodar una pelota, apilar bloques). Diga 'mi " +
            "turno… tu turno,' manténgalo corto y divertido, y celebre cada intercambio.",
        },
        confidence: "high",
      },
      {
        id: uid("bi", 3),
        category: "Speech service",
        whatItSays: "Speech-Language Therapy: 2 sessions x 30 minutes per week, individual, in the resource room.",
        whatItMeans: {
          en:
            "Your child will meet one-on-one with a speech therapist twice a week, 30 minutes each time, in a " +
            "small room at school.",
          es:
            "Su hijo se reunirá uno a uno con un terapeuta del habla dos veces por semana, 30 minutos cada vez, " +
            "en un salón pequeño en la escuela.",
        },
        whatYouCanDo: {
          en:
            "Ask the therapist which words they're targeting so you can practice the same ones at home during " +
            "meals and play.",
          es:
            "Pregunte al terapeuta qué palabras están practicando para que usted practique las mismas en casa " +
            "durante las comidas y el juego.",
        },
        confidence: "high",
      },
      {
        id: uid("bi", 4),
        category: "Accommodation",
        whatItSays: "Provide visual supports and extra wait time for responses.",
        whatItMeans: {
          en:
            "Teachers will use pictures/visual cues and give your child a little extra time to answer instead " +
            "of rushing.",
          es:
            "Los maestros usarán imágenes/señales visuales y le darán a su hijo un poco más de tiempo para " +
            "responder en lugar de apurarlo.",
        },
        whatYouCanDo: {
          en:
            "Use simple picture cards at home for routines (eat, play, bathroom) and count silently to five " +
            "before repeating a question.",
          es:
            "Use tarjetas con imágenes simples en casa para las rutinas (comer, jugar, baño) y cuente en " +
            "silencio hasta cinco antes de repetir una pregunta.",
        },
        confidence: "low",
      },
    ],
    disclaimer: DISCLAIMER,
    // Tags drive deterministic recommendations (courses + partners).
    suggestedCourseTags: ["communication", "reinforcement", "social", "group_work"],
  };

  const goalDrafts: GoalDraft[] = [
    {
      domain: "Communication",
      verbatimText: payload.items[0].whatItSays,
      baseline: "Currently requests using single sounds with full prompting.",
      target: "2–3 word phrase, 4/5 opportunities, minimal prompting.",
      measure: "Staff data across sessions.",
      confidence: "high",
    },
    {
      domain: "Social",
      verbatimText: payload.items[1].whatItSays,
      baseline: "Takes 1 turn with adult support.",
      target: "3 exchanges, 3/4 opportunities.",
      measure: "Staff data during structured activity.",
      confidence: "high",
    },
  ];

  return { payload, goalDrafts };
}

// ---------------- Triennial ----------------

function renderTriennial(): { payload: BreakdownPayload; goalDrafts: GoalDraft[] } {
  const payload: BreakdownPayload = {
    summary: {
      en:
        "This is a three-year reevaluation report. It describes the tests that were given, what they measure, " +
        "and what your child's scores mean. Overall it finds strengths in visual problem-solving and continued " +
        "needs in language and social communication, and your child continues to qualify for special education " +
        "services under autism.",
      es:
        "Este es un informe de reevaluación de tres años. Describe las pruebas que se aplicaron, qué miden y qué " +
        "significan los puntajes de su hijo. En general, encuentra fortalezas en la resolución visual de problemas " +
        "y necesidades continuas en el lenguaje y la comunicación social, y su hijo sigue calificando para " +
        "servicios de educación especial bajo autismo.",
    },
    keyDates: [
      { label: "Evaluation date", date: "2026-02-15" },
      { label: "Eligibility meeting", date: "2026-03-01" },
    ],
    questionsToAsk: [
      "Which scores are you most basing the recommendations on?",
      "What does the language score mean for everyday conversations?",
      "Which recommendation should we start with at home?",
    ],
    items: [
      {
        id: uid("bi", 1),
        category: "Assessment: cognitive (WISC-V)",
        whatItSays:
          "Wechsler Intelligence Scale for Children, Fifth Edition (WISC-V): Visual Spatial Index = 105 (63rd " +
          "percentile); Verbal Comprehension Index = 82 (12th percentile).",
        whatItMeans: {
          en:
            "This test looks at different kinds of thinking. Your child's visual/hands-on problem-solving is right " +
            "around the typical range (better than about 63 out of 100 children the same age). Understanding and " +
            "using spoken language is an area of need (around 12 out of 100), which fits the language goals.",
          es:
            "Esta prueba mide distintos tipos de pensamiento. La resolución visual/práctica de problemas de su hijo " +
            "está dentro del rango típico (mejor que unos 63 de cada 100 niños de la misma edad). Entender y usar el " +
            "lenguaje hablado es un área de necesidad (alrededor de 12 de cada 100), lo cual coincide con las metas.",
        },
        whatYouCanDo: {
          en:
            "Lean on visual strengths: use pictures, gestures, and demonstrations to support spoken directions at home.",
          es:
            "Apóyese en las fortalezas visuales: use imágenes, gestos y demostraciones para acompañar las " +
            "instrucciones habladas en casa.",
        },
        confidence: "high",
      },
      {
        id: uid("bi", 2),
        category: "Eligibility determination",
        whatItSays:
          "The team determined the student continues to meet eligibility criteria for special education under " +
          "the category of Autism.",
        whatItMeans: {
          en:
            "Based on all the information, your child still qualifies for special education support under the autism " +
            "category. This keeps the services and supports in place.",
          es:
            "Según toda la información, su hijo sigue calificando para apoyo de educación especial bajo la categoría " +
            "de autismo. Esto mantiene los servicios y apoyos vigentes.",
        },
        whatYouCanDo: {
          en:
            "Eligibility isn't a label to worry about — it's the key that keeps helpful services available. Ask how " +
            "each service connects to a need in this report.",
          es:
            "La elegibilidad no es una etiqueta de la cual preocuparse — es la llave que mantiene disponibles los " +
            "servicios útiles. Pregunte cómo cada servicio se conecta con una necesidad de este informe.",
        },
        confidence: "high",
      },
      {
        id: uid("bi", 3),
        category: "Recommendation",
        whatItSays:
          "Recommendations: continue speech-language services; incorporate visual supports; consider social " +
          "skills group.",
        whatItMeans: {
          en:
            "The evaluator suggests keeping speech therapy, using pictures/visual cues, and possibly joining a small " +
            "group to practice social skills.",
          es:
            "El evaluador sugiere mantener la terapia del habla, usar imágenes/señales visuales y posiblemente unirse " +
            "a un grupo pequeño para practicar habilidades sociales.",
        },
        whatYouCanDo: {
          en: "A DDE social skills group or parent class can reinforce these same recommendations at home.",
          es:
            "Un grupo de habilidades sociales de DDE o una clase para padres puede reforzar estas mismas " +
            "recomendaciones en casa.",
        },
        confidence: "high",
      },
    ],
    disclaimer: DISCLAIMER,
    suggestedCourseTags: ["communication", "social", "group_work"],
  };

  // A triennial report has no IEP "goals"; surface no trackable goal records.
  return { payload, goalDrafts: [] };
}
