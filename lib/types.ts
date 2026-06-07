// Shared domain types — DDE Parent Hub v2 (family-scoped).
//
// v2 access model (supersedes v1 "parent-only"): clinical/family data is keyed by
// `familyId`. A family has multiple parents and children. Staff are assigned to
// families and see the full family file; admin sees everything. Enforcement lives in
// lib/auth/access.ts + lib/data/repos.ts (simulated RLS) and supabase/schema.sql.

export type Role = "admin" | "staff" | "parent";

export interface User {
  id: string;
  role: Role;
  email: string;
  name: string;
  preferredLanguage: "en" | "es";
  status: "active" | "deactivated";
  // Demo-only: plaintext password for the local prototype. Real build uses Supabase Auth.
  password: string;
  // Parents belong to exactly one family. Staff/admin have no familyId.
  familyId?: string | null;
  // Staff title shown in the UI (e.g. "BCBA", "Behavior Technician").
  title?: string;
  // Profile photo (small data URL, resized client-side). Optional.
  avatarUrl?: string;
  // Parent profile — feeds recommendations (insurance match, family goals).
  insurance?: string[]; // matches partner.insuranceAccepted
  focus?: string[]; // what the family wants to achieve (need tags)
  goals?: string; // freeform "what you want to achieve"
}

// ---------- Family & access ----------

export interface Family {
  id: string;
  name: string;
  // Consent + retention are family-level in v2 (§7.3 / §7.5).
  retentionMonths?: number | null;
  consentAcceptedAt?: string | null;
}

export interface FamilyStaffAssignment {
  id: string;
  familyId: string;
  staffId: string;
  assignedAt: string;
}

// ---------- LMS: Course authoring ----------

export type ContentBlockType =
  | "video"
  | "image"
  | "slideshow"
  | "rich_text"
  | "embedded_question";

export interface ContentBlock {
  id: string;
  lessonId: string;
  orderIndex: number;
  type: ContentBlockType;
  // Shape depends on type:
  //  video: { url: string; caption?: string }
  //  image: { url: string; alt?: string }
  //  slideshow: { images: { url: string; alt?: string }[] }
  //  rich_text: { html: string }
  //  embedded_question: { prompt: string; options: string[]; answerIndex: number }
  payload: Record<string, unknown>;
}

export interface Lesson {
  id: string;
  courseId: string;
  orderIndex: number;
  title: string;
  teacherInstructions: string;
}

export type QuestionType =
  | "multiple_choice"
  | "multi_select"
  | "true_false"
  | "short_text"
  | "likert"
  | "ordering" // arrange steps into the correct sequence (great for ABA task analysis)
  | "matching" // match each left term to its right term
  | "image_choice"; // multiple choice where options are images

export interface QuestionMedia {
  type: "image" | "video";
  url: string;
  alt?: string;
}

export interface Question {
  id: string;
  assessmentId: string;
  orderIndex: number;
  type: QuestionType;
  prompt: string;
  // For multiple_choice/multi_select/true_false: text options.
  // For image_choice: option labels (paired with optionImages).
  // For ordering: the items to arrange (presented shuffled; answerKey is the correct order).
  // For matching: the LEFT-side terms (rightOptions holds the right side).
  options: string[];
  // Image URLs for image_choice options (same length as options).
  optionImages?: string[];
  // Right-hand terms for matching questions.
  rightOptions?: string[];
  // answerKey semantics by type:
  //  multiple_choice/true_false/image_choice: number[] (correct index/indices)
  //  multi_select: number[] (set of correct indices)
  //  ordering: number[] (correct order as indices into `options`)
  //  matching: number[] where answerKey[i] = index into rightOptions matching options[i]
  //  short_text: string[] (keywords); likert: null (unscored)
  answerKey: number[] | string[] | null;
  scored: boolean;
  // Optional media shown alongside the prompt.
  media?: QuestionMedia;
}

export type AssessmentKind = "pretest" | "posttest" | "lesson_check";

export interface Assessment {
  id: string;
  courseId: string;
  kind: AssessmentKind;
  lessonId: string | null; // set for lesson_check
  title: string;
}

export type CourseStatus = "draft" | "published";

export interface Course {
  id: string;
  ownerStaffId: string;
  title: string;
  description: string;
  outcomes: string;
  teacherInstructions: string;
  isTemplate: boolean;
  category: string;
  status: CourseStatus;
  estimatedDuration: string;
  coverImage?: string;
  // Tags used to map IEP goal domains / child interests -> relevant courses (the loop).
  tags: string[];
}

// A fully-expanded course (curriculum graph), used for the player and snapshots.
export interface CourseSnapshot {
  course: Course;
  lessons: Lesson[];
  contentBlocks: ContentBlock[];
  assessments: Assessment[];
  questions: Question[];
}

// ---------- LMS: Classes & enrollment ----------

export type EnrollmentStatus = "enrolled" | "in_progress" | "completed";
export type ClassEnrollmentStatus = "open" | "closed";
export type DeliveryMode = "in_person" | "telehealth";
export type AttendanceStatus = "pending" | "present" | "absent";

// A scheduled event/class (cohort) of a course. Carries the live-session details.
export interface ClassOffering {
  id: string;
  courseId: string;
  // Snapshot of the curriculum at launch so later template edits don't mutate a running class.
  courseSnapshot: CourseSnapshot;
  staffId: string;
  title: string;
  description: string;
  coverImage?: string;
  startsAt: string; // ISO datetime of the event (used for "next event" ordering)
  schedule: string; // human-friendly recurrence/label
  capacity: number;
  enrollmentStatus: ClassEnrollmentStatus;
  // Delivery: in-person (address) or telehealth (staff pastes a meeting link).
  deliveryMode: DeliveryMode;
  address?: string;
  meetingLink?: string;
}

export interface Enrollment {
  id: string;
  classId: string;
  parentId: string;
  status: EnrollmentStatus;
  createdAt: string;
  // Attendance / check-in — staff marks each RSVP'd parent present/absent for the session.
  attendance: AttendanceStatus;
  checkedInAt?: string;
  checkedInByStaffId?: string;
}

export interface Attempt {
  id: string;
  enrollmentId: string;
  assessmentId: string;
  score: number;
  maxScore: number;
  submittedAt: string;
}

export type LessonProgressStatus = "not_started" | "in_progress" | "complete";

export interface LessonProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  status: LessonProgressStatus;
  lastBlockIndex: number;
}

// ---------- Children & child profiles (family-scoped) ----------

export interface Child {
  id: string;
  familyId: string;
  displayName: string;
  dob?: string;
  // Profile photo (small data URL, resized client-side). Optional.
  avatarUrl?: string;
  // Profile — drives deterministic resource recommendations.
  interestTags: string[]; // e.g. ["animals","horses","outdoors","music"]
  needTags: string[]; // supports that help, e.g. ["communication","social","sensory"]
  // Surface-level, sensitive context to help match resources.
  communicationStyle?: string; // see COMMUNICATION_OPTIONS
  aspirations?: string; // "what we'd love to see them grow in" (freeform)
  temperament: string; // freeform, parent's words
  strengths: string; // freeform
  notes: string; // anything else helpful
}

// ---------- Documents & breakdowns (family-scoped) ----------

export type DocType = "iep" | "triennial";
export type DocStatus = "processing" | "ready" | "error";

export interface Document {
  id: string;
  childId: string;
  familyId: string;
  createdByParentId: string; // audit: which parent uploaded it
  docType: DocType;
  fileName: string;
  // Simulated storage path, namespaced per family. No real file in the MVP.
  storagePath: string;
  status: DocStatus;
  retentionUntil: string | null;
  createdAt: string;
}

// One of the three plain-language layers, bound to its verbatim source text.
export interface BreakdownItem {
  id: string;
  category: string; // e.g. "Communication goal", "Speech service", "WISC-V assessment"
  whatItSays: string; // verbatim source text
  whatItMeans: { en: string; es: string }; // ~6th grade, translated layers
  whatYouCanDo: { en: string; es: string };
  confidence: "high" | "low";
}

export interface BreakdownPayload {
  summary: { en: string; es: string };
  keyDates: { label: string; date: string }[];
  questionsToAsk: string[];
  items: BreakdownItem[];
  disclaimer: string;
  // For the loop: suggested course/partner tags this document touches.
  suggestedCourseTags: string[];
}

export interface DocumentBreakdown {
  id: string;
  documentId: string;
  familyId: string;
  summary: string;
  payload: BreakdownPayload;
  language: "en" | "es";
  // Provenance for the process-once-cache (consistency / no creativity).
  contentHash: string;
  promptVersion: string;
}

// A trackable goal for a child. Auto-extracted from an IEP (source "iep") OR added by a
// parent by hand (source "manual"). Manual goals have no documentId.
export interface ExtractedGoal {
  id: string;
  documentId: string | null;
  familyId: string;
  childId: string;
  source: "iep" | "manual";
  domain: string;
  verbatimText: string;
  baseline: string;
  target: string;
  measure: string;
  confidence: "high" | "low";
}

export interface GoalProgress {
  id: string;
  extractedGoalId: string;
  familyId: string;
  observedByParentId: string;
  observedAt: string;
  note: string;
  simpleRating: 1 | 2 | 3 | 4 | 5; // 1 = struggling .. 5 = mastering
  // Optional photo/video of the child captured with the observation.
  mediaUrl?: string;
  mediaType?: "image" | "video";
}

// ---------- DDE Partner Directory (admin-managed) ----------

export type PartnerStatus = "active" | "archived";

export interface Partner {
  id: string;
  name: string;
  category: string; // e.g. "Equine therapy", "Speech clinic", "Social skills"
  tagline: string; // short confidence-building one-liner
  imageUrl?: string; // logo / photo for the directory card
  description: string; // what they do
  howTheyHelp: string; // how they're helpful to DDE families
  services: string[]; // bullet list of offerings
  insuranceAccepted: string[]; // e.g. ["Medi-Cal", "Aetna", "Private pay"]
  // Matching tags (deterministic recommendations).
  interestTags: string[];
  needTags: string[];
  // Contact / business info.
  contactName: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  status: PartnerStatus;
}

// The whole local DB shape (JSON store).
export interface Database {
  users: User[];
  families: Family[];
  familyStaffAssignments: FamilyStaffAssignment[];
  partners: Partner[];
  courses: Course[];
  lessons: Lesson[];
  contentBlocks: ContentBlock[];
  assessments: Assessment[];
  questions: Question[];
  classes: ClassOffering[];
  enrollments: Enrollment[];
  attempts: Attempt[];
  lessonProgress: LessonProgress[];
  children: Child[];
  documents: Document[];
  documentBreakdowns: DocumentBreakdown[];
  extractedGoals: ExtractedGoal[];
  goalProgress: GoalProgress[];
}
