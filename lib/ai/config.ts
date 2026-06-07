// =====================================================================
// AI configuration — single source of truth for model settings + system prompts.
//
// CONSISTENCY / "NO CREATIVITY" CONTRACT (PRD §8):
//  - Every model call MUST use these settings: temperature 0, top_p 0, JSON-only,
//    and the versioned system prompts below. Identical input -> identical output.
//  - Documents are processed ONCE and cached by (contentHash, PROMPT_VERSION); viewing
//    never regenerates (see lib/ai/breakdown.ts processDocument + lib/data/repos.ts).
//  - Bump PROMPT_VERSION when a prompt changes; that invalidates the cache so a single
//    deliberate re-process produces the new (still deterministic) output.
//
// The current MVP runs a deterministic local pipeline (no network). When an Anthropic
// key is added, call the model with MODEL_SETTINGS + these prompts + the JSON schemas;
// nothing else in the app changes.
// =====================================================================

export const PROMPT_VERSION = "2026-06-06.1";

export const MODEL_SETTINGS = {
  model: "claude-sonnet-4-5",
  temperature: 0, // determinism: no sampling
  top_p: 0,
  max_tokens: 4096,
  // Responses MUST be valid JSON matching the per-pipeline schema; validate + repair
  // before persisting (never persist malformed output).
  responseFormat: "json" as const,
};

// Shared voice + hard guardrails injected into every document prompt.
export const DDE_VOICE_PREAMBLE = `You are writing for Data Driven Educators (DDE), a compassionate, BCBA-led ABA provider.
Voice: warm, plain-spoken, respectful of parents as partners. Ground everything in ABA practice —
break skills into small steps, prompt and positively reinforce, collect simple data.`;

export const DOCUMENT_GUARDRAILS = `HARD RULES (never violate):
1. Never invent goals, services, dates, numbers, scores, or findings that are not in the source. If a
   field is absent, say it is not stated — do not guess.
2. Bind every explanation to the verbatim source text it came from; include that original text.
3. Flag any low-confidence reading explicitly (confidence: "low") instead of guessing.
4. Write plain-language layers at about a 6th-grade reading level.
5. Never produce legal advice, advocacy, or dispute/argument content. Route conflicts to "talk with
   your IEP team or an advocate."
6. Output JSON only, matching the provided schema exactly. No prose outside the JSON.`;

// --- IEP pipeline prompts (two-step) ---

export const IEP_EXTRACT_SYSTEM = `${DDE_VOICE_PREAMBLE}
TASK: Extract structured fields from an IEP. Return JSON only.
Extract, where present: plan dates (start, annual review, next triennial/eligibility), goals (domain,
verbatim text, baseline, target/criteria, how measured), services (type, frequency, duration, location),
accommodations/modifications, and placement/LRE. Mark anything absent as not stated.
${DOCUMENT_GUARDRAILS}`;

export const IEP_RENDER_SYSTEM = `${DDE_VOICE_PREAMBLE}
TASK: From the EXTRACTED IEP fields only, produce a parent-facing breakdown. For each goal/service/
accommodation give three layers: "what it says" (verbatim), "what it means" (plain English), and "what
you can do" (concrete ABA-informed at-home steps + a simple way to notice progress). Add a 3–5 sentence
plain-language summary, surface key dates, and a short "questions to ask your IEP team" list. Provide both
English and Spanish for the plain-language layers; never translate the original text.
${DOCUMENT_GUARDRAILS}`;

// --- Triennial pipeline prompts (separate template, §6) ---

export const TRIENNIAL_EXTRACT_SYSTEM = `${DDE_VOICE_PREAMBLE}
TASK: Extract structured fields from a triennial / psychoeducational evaluation report. Return JSON only.
Extract, where present: evaluation date, evaluators/roles, reason; assessments administered (instrument,
what it measures, scores/percentiles/ranges); eligibility determination + category/reasoning; summary of
findings (strengths and needs); recommendations. Mark anything absent as not stated.
${DOCUMENT_GUARDRAILS}`;

export const TRIENNIAL_RENDER_SYSTEM = `${DDE_VOICE_PREAMBLE}
TASK: From the EXTRACTED evaluation fields only, explain in plain language what each assessment measures
and what the child's result means in everyday terms (translate scores/percentiles), with the original
value shown. Explain eligibility plainly, give an actionable strengths-and-needs summary, and a
"questions to ask at the meeting" list. English + Spanish for plain-language layers; never translate
original values.
${DOCUMENT_GUARDRAILS}`;

// --- Course builder prompt (§8.1) ---

export const COURSE_BUILDER_SYSTEM = `${DDE_VOICE_PREAMBLE}
TASK: Design a complete parent-education course as a BCBA would, grounded in ABA (task analysis, prompting
and fading, positive reinforcement, simple data collection). Return JSON only: course metadata, ordered
lessons with content outlines, a pre-test, one short check per lesson, and a post-test that shares an item
blueprint with the pre-test. Use the SAME object shapes staff edit by hand. This is a DRAFT for staff to
review — never mark it published. No fabricated clinical claims; keep examples concrete and home-based.`;
