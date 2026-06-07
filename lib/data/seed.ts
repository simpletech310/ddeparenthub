import type {
  Assessment,
  Child,
  ClassOffering,
  ContentBlock,
  Course,
  CourseSnapshot,
  Database,
  Document,
  DocumentBreakdown,
  ExtractedGoal,
  Family,
  FamilyStaffAssignment,
  GoalProgress,
  Lesson,
  Partner,
  Question,
  User,
} from "@/lib/types";
import { processDocumentDeterministic } from "@/lib/ai/breakdown";

// Stable, hand-written IDs so cross-references resolve in the seed.
const ADMIN_ID = "user_admin_celia";
const STAFF_ASSIGNED = "user_staff_marcus";
const STAFF_UNASSIGNED = "user_staff_priya";
const MARIA_ID = "user_parent_maria";
const CARLOS_ID = "user_parent_carlos";
const FAMILY_ID = "family_gomez";
const COURSE_ID = "course_comm_home";
const CLASS_ID = "class_comm_summer";
const LEO_ID = "child_leo";
const SOFIA_ID = "child_sofia";

function seedFamilies(): Family[] {
  return [{ id: FAMILY_ID, name: "Gomez Family", retentionMonths: null, consentAcceptedAt: null }];
}

function seedUsers(): User[] {
  return [
    {
      id: ADMIN_ID, role: "admin", email: "celia@dde.example", name: "Celia Pearson",
      title: "BCBA · Founder", preferredLanguage: "en", status: "active", password: "demo", familyId: null,
    },
    {
      id: STAFF_ASSIGNED, role: "staff", email: "marcus@dde.example", name: "Marcus Lee",
      title: "Behavior Technician", preferredLanguage: "en", status: "active", password: "demo", familyId: null,
    },
    {
      id: STAFF_UNASSIGNED, role: "staff", email: "priya@dde.example", name: "Priya Shah",
      title: "BCBA", preferredLanguage: "en", status: "active", password: "demo", familyId: null,
    },
    {
      id: MARIA_ID, role: "parent", email: "maria@example.com", name: "Maria Gomez",
      preferredLanguage: "en", status: "active", password: "demo", familyId: FAMILY_ID,
      insurance: ["Medi-Cal", "Aetna"], focus: ["communication", "social", "outdoor_time"],
      goals: "We'd love Leo to ask for what he wants and enjoy playing near other kids.",
    },
    {
      id: CARLOS_ID, role: "parent", email: "carlos@example.com", name: "Carlos Gomez",
      preferredLanguage: "en", status: "active", password: "demo", familyId: FAMILY_ID,
    },
  ];
}

function seedAssignments(): FamilyStaffAssignment[] {
  // Marcus is assigned to the Gomez family; Priya is NOT (access contrast / pen-test).
  return [
    { id: "fsa_marcus_gomez", familyId: FAMILY_ID, staffId: STAFF_ASSIGNED, assignedAt: new Date().toISOString() },
  ];
}

function seedPartners(): Partner[] {
  return [
    {
      id: "partner_stables", name: "Riverside Stables", category: "Equine therapy & outdoor groups",
      tagline: "Calm, outdoor, animal-centered groups kids look forward to.",
      imageUrl: "/media/partners/equine.svg",
      description: "A working horse farm offering small-group outdoor sessions where children care for animals and practice cooperation.",
      howTheyHelp: "Outdoor, animal-centered group sessions build turn-taking, following directions, and social confidence in a calm setting.",
      services: ["Weekend equine social groups", "1:1 animal-care sessions", "Sensory-friendly barn visits"],
      insuranceAccepted: ["Medi-Cal", "Regional Center", "Private pay"],
      interestTags: ["animals", "horses", "outdoors"],
      needTags: ["social", "group_work", "outdoor_time"],
      contactName: "Jess Romero", phone: "(951) 555-0143", email: "hello@riversidestables.example",
      website: "riversidestables.example", address: "8800 River Rd, Riverside, CA",
      social: { instagram: "riversidestables", facebook: "riversidestables", youtube: "@riversidestables" },
      status: "active",
    },
    {
      id: "partner_social", name: "Sunrise Social Skills Group", category: "Social skills",
      tagline: "Coached peer practice for conversation, sharing, and play.",
      imageUrl: "/media/partners/social.svg",
      description: "Structured small groups for children to practice conversation, sharing, and play.",
      howTheyHelp: "Direct, coached practice of social and communication goals with same-age peers.",
      services: ["Weekly social groups", "Sibling sessions", "Parent coaching"],
      insuranceAccepted: ["Aetna", "Kaiser", "Medi-Cal", "Private pay"],
      interestTags: ["games", "art"],
      needTags: ["social", "group_work", "communication"],
      contactName: "Dana Kim", phone: "(951) 555-0177", email: "info@sunrisesocial.example",
      website: "sunrisesocial.example", address: "210 Magnolia Ave, Riverside, CA",
      social: { instagram: "sunrisesocialgroup", facebook: "sunrisesocialgroup", tiktok: "@sunrisesocial" },
      status: "active",
    },
    {
      id: "partner_speech", name: "Clear Speech Clinic", category: "Speech-language therapy",
      tagline: "Licensed SLPs who coordinate words to practice at home.",
      imageUrl: "/media/partners/speech.svg",
      description: "Licensed speech-language pathologists for expressive and receptive language.",
      howTheyHelp: "Targeted therapy for communication goals; coordinates words to practice at home.",
      services: ["Individual speech therapy", "AAC support", "Language evaluations"],
      insuranceAccepted: ["Blue Shield", "Cigna", "Kaiser", "Private pay"],
      interestTags: [],
      needTags: ["communication"],
      contactName: "Pat Nguyen", phone: "(951) 555-0190", email: "front@clearspeech.example",
      website: "clearspeech.example", address: "55 Market St, Riverside, CA", status: "active",
    },
    {
      id: "partner_sensory", name: "Sensory Play Gym", category: "Sensory & motor",
      tagline: "A sensory-friendly gym for regulation and movement.",
      imageUrl: "/media/partners/sensory.svg",
      description: "An indoor gym with sensory-friendly equipment and movement classes.",
      howTheyHelp: "Supports self-regulation and motor goals through play.",
      services: ["Open sensory play", "Movement classes", "Quiet hours"],
      insuranceAccepted: ["Medi-Cal", "Private pay"],
      interestTags: ["movement"],
      needTags: ["sensory", "motor", "self_regulation"],
      contactName: "Sam Ortiz", phone: "(951) 555-0122", email: "play@sensorygym.example",
      website: "sensorygym.example", address: "412 Indiana Ave, Riverside, CA", status: "active",
    },
  ];
}

// ---- Course curriculum (also reused as the class snapshot) ----

function seedCourse(): Course {
  return {
    id: COURSE_ID, ownerStaffId: STAFF_ASSIGNED,
    title: "Building Communication at Home",
    description:
      "An ABA-informed class for parents on encouraging your child's communication using everyday routines, prompting, and positive reinforcement.",
    outcomes:
      "Parents can break a communication skill into small steps, prompt and reinforce it at home, and notice progress.",
    teacherInstructions:
      "Facilitation: keep examples concrete and from the home. Reassure parents that small, consistent practice beats long sessions. Prerequisite: none.",
    isTemplate: true, status: "published", category: "Communication", estimatedDuration: "~45 min",
    tags: ["communication", "aba", "reinforcement", "social", "group_work"],
  };
}

function seedLessons(): Lesson[] {
  return [
    { id: "lesson_1", courseId: COURSE_ID, orderIndex: 0, title: "ABA Basics for Parents", teacherInstructions: "Frame ABA as 'notice, support, reward.' Avoid jargon." },
    { id: "lesson_2", courseId: COURSE_ID, orderIndex: 1, title: "Breaking a Skill into Steps", teacherInstructions: "Walk through task analysis with a familiar example (asking for water)." },
    { id: "lesson_3", courseId: COURSE_ID, orderIndex: 2, title: "Prompting and Reinforcement", teacherInstructions: "Explain prompt fading and catching the child being successful." },
  ];
}

function seedContentBlocks(): ContentBlock[] {
  return [
    { id: "cb_1a", lessonId: "lesson_1", orderIndex: 0, type: "rich_text", payload: { html: "<p>Applied Behavior Analysis (ABA) is a caring, data-driven way to help your child build skills. The core idea is simple: <strong>notice</strong> what your child does, <strong>support</strong> the next small step, and <strong>reward</strong> their effort.</p>" } },
    { id: "cb_1img", lessonId: "lesson_1", orderIndex: 1, type: "image", payload: { url: "/media/placeholder-lesson.svg", alt: "The notice–support–reward loop" } },
    { id: "cb_1b", lessonId: "lesson_1", orderIndex: 2, type: "embedded_question", payload: { prompt: "What is the core loop of ABA described above?", options: ["Notice, support, reward", "Test, grade, repeat", "Wait and see"], answerIndex: 0 } },
    { id: "cb_2a", lessonId: "lesson_2", orderIndex: 0, type: "rich_text", payload: { html: "<p>Big skills feel overwhelming. Breaking them into small steps (a <em>task analysis</em>) makes them teachable. To ask for water: 1) look at the cup, 2) reach toward it, 3) make a sound or sign, 4) say or approximate 'water.'</p>" } },
    { id: "cb_2slides", lessonId: "lesson_2", orderIndex: 1, type: "slideshow", payload: { images: [ { url: "/media/placeholder-lesson.svg", alt: "Step 1: look at the cup" }, { url: "/media/placeholder-lesson.svg", alt: "Step 2: reach toward it" }, { url: "/media/placeholder-lesson.svg", alt: "Step 3: make a sound" } ] } },
    { id: "cb_3a", lessonId: "lesson_3", orderIndex: 0, type: "rich_text", payload: { html: "<p>A <strong>prompt</strong> is a little help (a gesture, a model, a hand-over-hand guide). A <strong>reinforcer</strong> is anything your child loves that you give right after they try. Over time, fade the prompt so your child does more on their own.</p>" } },
  ];
}

function seedAssessments(): Assessment[] {
  return [
    { id: "asmt_pre", courseId: COURSE_ID, kind: "pretest", lessonId: null, title: "Pre-test" },
    { id: "asmt_post", courseId: COURSE_ID, kind: "posttest", lessonId: null, title: "Post-test" },
    { id: "asmt_lc1", courseId: COURSE_ID, kind: "lesson_check", lessonId: "lesson_1", title: "Lesson 1 Check" },
    { id: "asmt_lc2", courseId: COURSE_ID, kind: "lesson_check", lessonId: "lesson_2", title: "Lesson 2 Check" },
    { id: "asmt_lc3", courseId: COURSE_ID, kind: "lesson_check", lessonId: "lesson_3", title: "Lesson 3 Check" },
  ];
}

function seedQuestions(): Question[] {
  return [
    // Pre-test
    { id: "q_pre_1", assessmentId: "asmt_pre", orderIndex: 0, type: "multiple_choice", prompt: "What is the core loop of ABA?", options: ["Notice, support, reward", "Test and grade", "Punish mistakes"], answerKey: [0], scored: true },
    { id: "q_pre_2", assessmentId: "asmt_pre", orderIndex: 1, type: "true_false", prompt: "Breaking a skill into small steps makes it easier to teach.", options: ["True", "False"], answerKey: [0], scored: true },
    { id: "q_pre_3", assessmentId: "asmt_pre", orderIndex: 2, type: "multiple_choice", prompt: "When should you give a reinforcer?", options: ["Right after your child tries", "The next day", "Only if perfect"], answerKey: [0], scored: true },
    // Post-test (same blueprint)
    { id: "q_post_1", assessmentId: "asmt_post", orderIndex: 0, type: "multiple_choice", prompt: "Which best describes the ABA approach?", options: ["Punish mistakes", "Notice, support, reward", "Wait and see"], answerKey: [1], scored: true },
    { id: "q_post_2", assessmentId: "asmt_post", orderIndex: 1, type: "multiple_choice", prompt: "A reinforcer works best when given...", options: ["Immediately after the attempt", "A week later", "Never"], answerKey: [0], scored: true },
    { id: "q_post_3", assessmentId: "asmt_post", orderIndex: 2, type: "true_false", prompt: "A task analysis breaks a skill into smaller steps.", options: ["True", "False"], answerKey: [0], scored: true },
    // Lesson checks — exercise ALL question types + question-level media.
    // Lesson 1: a multiple-choice with an image (quiz media) + a matching question.
    { id: "q_lc1", assessmentId: "asmt_lc1", orderIndex: 0, type: "multiple_choice", prompt: "The ABA loop is best summarized as:", options: ["Notice, support, reward", "Sit and wait"], answerKey: [0], scored: true, media: { type: "image", url: "/media/placeholder-lesson.svg", alt: "The notice–support–reward loop" } },
    { id: "q_lc1b", assessmentId: "asmt_lc1", orderIndex: 1, type: "matching", prompt: "Match each ABA term to its meaning.", options: ["Prompt", "Reinforcer", "Task analysis"], rightOptions: ["A little help to do the next step", "Something your child loves, given right after a try", "Breaking a skill into small steps"], answerKey: [0, 1, 2], scored: true },
    // Lesson 2: ordering (ABA task analysis).
    { id: "q_lc2", assessmentId: "asmt_lc2", orderIndex: 0, type: "ordering", prompt: "Put the steps of teaching 'ask for water' in order (first to last).", options: ["Look at the cup", "Reach toward it", "Make a sound or sign", "Say or approximate 'water'"], answerKey: [0, 1, 2, 3], scored: true },
    // Lesson 3: image_choice.
    { id: "q_lc3", assessmentId: "asmt_lc3", orderIndex: 0, type: "image_choice", prompt: "Which picture shows fading a prompt (less help over time)?", options: ["Less help over time", "More help each day"], optionImages: ["/media/placeholder-lesson.svg", "/media/placeholder-lesson.svg"], answerKey: [0], scored: true },
  ];
}

export function buildCourseSnapshot(): CourseSnapshot {
  return {
    course: seedCourse(),
    lessons: seedLessons(),
    contentBlocks: seedContentBlocks(),
    assessments: seedAssessments(),
    questions: seedQuestions(),
  };
}

// Seed event dates relative to "now" so they always appear upcoming in the demo.
function daysFromNow(n: number, hour = 18): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function seedClasses(): ClassOffering[] {
  return [
    {
      id: CLASS_ID, courseId: COURSE_ID, courseSnapshot: buildCourseSnapshot(), staffId: STAFF_ASSIGNED,
      title: "Building Communication at Home — Telehealth",
      description: "A live, ABA-informed parent session on encouraging communication, with the self-paced course included. Join from anywhere.",
      coverImage: "/media/events/telehealth.svg",
      startsAt: daysFromNow(3, 18), schedule: "One live session, ~45 min",
      capacity: 12, enrollmentStatus: "open",
      deliveryMode: "telehealth",
      meetingLink: "https://zoom.us/j/95512340000?pwd=dde-demo",
    },
    {
      id: "class_comm_inperson", courseId: COURSE_ID, courseSnapshot: buildCourseSnapshot(), staffId: STAFF_ASSIGNED,
      title: "Communication at Home — In-Person Workshop",
      description: "An in-person workshop at the DDE center with hands-on practice and the self-paced course included.",
      coverImage: "/media/events/inperson.svg",
      startsAt: daysFromNow(10, 17), schedule: "One workshop, ~60 min",
      capacity: 8, enrollmentStatus: "open",
      deliveryMode: "in_person",
      address: "11748 Magnolia Ave Suite B, Riverside, CA",
    },
  ];
}

function seedChildren(): Child[] {
  return [
    {
      id: LEO_ID, familyId: FAMILY_ID, displayName: "Leo", dob: "2019-04-12",
      interestTags: ["animals", "horses", "outdoors", "water", "movement"],
      needTags: ["communication", "social", "group_work", "outdoor_time", "sensory"],
      communicationStyle: "emerging",
      aspirations: "Asking for things with words and playing alongside other kids.",
      temperament: "Energetic and affectionate; calmer outdoors and around animals.",
      strengths: "Great visual memory; loves being helpful with chores.",
      notes: "Gets overwhelmed in loud indoor spaces.",
    },
    {
      id: SOFIA_ID, familyId: FAMILY_ID, displayName: "Sofia", dob: "2021-09-03",
      interestTags: ["music", "art"], needTags: [],
      communicationStyle: "verbal", aspirations: "",
      temperament: "Curious and gentle.", strengths: "Loves drawing.", notes: "",
    },
  ];
}

// Seed a ready IEP for Leo so the family file, tracking, recommendations, and pen-test have data.
function seedDocuments(): {
  documents: Document[];
  breakdowns: DocumentBreakdown[];
  goals: ExtractedGoal[];
} {
  const doc: Document = {
    id: "doc_leo_iep", childId: LEO_ID, familyId: FAMILY_ID, createdByParentId: MARIA_ID,
    docType: "iep", fileName: "Leo-IEP-2026.pdf",
    storagePath: `${FAMILY_ID}/${LEO_ID}/Leo-IEP-2026.pdf`, status: "ready",
    retentionUntil: null, createdAt: new Date().toISOString(),
  };
  const result = processDocumentDeterministic({ fileName: doc.fileName, docType: doc.docType });
  const breakdown: DocumentBreakdown = {
    id: "bd_leo_iep", documentId: doc.id, familyId: FAMILY_ID, summary: result.payload.summary.en,
    payload: result.payload, language: "en", contentHash: result.contentHash, promptVersion: result.promptVersion,
  };
  const goals: ExtractedGoal[] = result.goalDrafts.map((g, i) => ({
    ...g, id: `eg_leo_${i + 1}`, documentId: doc.id, familyId: FAMILY_ID, childId: LEO_ID,
    source: "iep" as const,
  }));
  // One manually-added goal to show per-child goal management alongside IEP goals.
  goals.push({
    id: "eg_leo_manual", documentId: null, familyId: FAMILY_ID, childId: LEO_ID, source: "manual",
    domain: "Self-help", verbatimText: "",
    baseline: "Needs full help at the sink today.", target: "Wash hands with one reminder",
    measure: "Daily before meals", confidence: "high",
  });
  return { documents: [doc], breakdowns: [breakdown], goals };
}

// Seed a few home observations (with one photo) so Track shows a real trend out of the box.
function seedGoalProgress(): GoalProgress[] {
  const d = (n: number) => {
    const x = new Date();
    x.setDate(x.getDate() - n);
    return x.toISOString();
  };
  return [
    { id: "gp_1", extractedGoalId: "eg_leo_1", familyId: FAMILY_ID, observedByParentId: MARIA_ID, observedAt: d(8), note: "Used a single sound for 'ball' with full help.", simpleRating: 2 },
    { id: "gp_2", extractedGoalId: "eg_leo_1", familyId: FAMILY_ID, observedByParentId: CARLOS_ID, observedAt: d(4), note: "Said 'ball' with a gesture prompt at the park.", simpleRating: 3 },
    { id: "gp_3", extractedGoalId: "eg_leo_1", familyId: FAMILY_ID, observedByParentId: MARIA_ID, observedAt: d(1), note: "'Want ball' with just one reminder at snack time!", simpleRating: 4, mediaUrl: "/media/child-sample.svg", mediaType: "image" },
    { id: "gp_4", extractedGoalId: "eg_leo_2", familyId: FAMILY_ID, observedByParentId: MARIA_ID, observedAt: d(3), note: "Took 2 turns rolling the ball before losing interest.", simpleRating: 3 },
  ];
}

export function buildSeed(): Database {
  const docs = seedDocuments();
  return {
    users: seedUsers(),
    families: seedFamilies(),
    familyStaffAssignments: seedAssignments(),
    partners: seedPartners(),
    courses: [seedCourse()],
    lessons: seedLessons(),
    contentBlocks: seedContentBlocks(),
    assessments: seedAssessments(),
    questions: seedQuestions(),
    classes: seedClasses(),
    enrollments: [],
    attempts: [],
    lessonProgress: [],
    children: seedChildren(),
    documents: docs.documents,
    documentBreakdowns: docs.breakdowns,
    extractedGoals: docs.goals,
    goalProgress: seedGoalProgress(),
  };
}
