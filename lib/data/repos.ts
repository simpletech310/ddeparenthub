import { getDb, saveDb, id, nowIso } from "./store";
import { processDocument } from "@/lib/ai/breakdown";
import { PROMPT_VERSION } from "@/lib/ai/config";
import {
  accessibleFamilyIds,
  canAccessFamily,
  canWriteFamily,
} from "@/lib/auth/access";
import type { GeneratedCourse } from "@/lib/ai/courseBuilder";
import type {
  Attempt,
  AttendanceStatus,
  Child,
  ClassOffering,
  ContentBlockType,
  Course,
  CourseSnapshot,
  Document,
  DocType,
  DocumentBreakdown,
  Enrollment,
  ExtractedGoal,
  GoalProgress,
  Lesson,
  LessonProgress,
  Question,
  User,
} from "@/lib/types";

// =====================================================================
// FAMILY ACCESS CONTRACT — read lib/auth/access.ts first. Every family-scoped accessor
// takes the acting `user` and enforces canAccessFamily/canWriteFamily. Async because the
// store is a remote JSON document (Supabase Storage).
// =====================================================================

class AccessError extends Error {}

// ---------------- Users ----------------

export async function listUsers(): Promise<User[]> {
  return (await getDb()).users;
}
export async function getUser(userId: string): Promise<User | undefined> {
  return (await getDb()).users.find((u) => u.id === userId);
}
export async function findUserByEmail(email: string): Promise<User | undefined> {
  return (await getDb()).users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
export async function setUserStatus(userId: string, status: User["status"]): Promise<void> {
  await saveDb((db) => {
    const u = db.users.find((x) => x.id === userId);
    if (u) u.status = status;
  });
}
export async function setUserLanguage(userId: string, lang: "en" | "es"): Promise<void> {
  await saveDb((db) => {
    const u = db.users.find((x) => x.id === userId);
    if (u) u.preferredLanguage = lang;
  });
}
// Update the acting user's own profile (name, staff title, language, photo).
export async function updateUserProfile(
  userId: string,
  patch: Partial<Pick<User, "name" | "title" | "preferredLanguage" | "avatarUrl">>
): Promise<void> {
  await saveDb((db) => {
    const u = db.users.find((x) => x.id === userId);
    if (u) Object.assign(u, patch);
  });
}
export async function createUser(input: {
  role: User["role"];
  name: string;
  email: string;
  title?: string;
  familyId?: string | null;
}): Promise<User> {
  const user: User = {
    id: id("user"),
    role: input.role,
    name: input.name,
    email: input.email,
    title: input.title,
    familyId: input.role === "parent" ? input.familyId ?? null : null,
    preferredLanguage: "en",
    status: "active",
    password: "demo",
  };
  await saveDb((db) => db.users.push(user));
  return user;
}
export async function setUserFamily(userId: string, familyId: string | null): Promise<void> {
  await saveDb((db) => {
    const u = db.users.find((x) => x.id === userId);
    if (u && u.role === "parent") u.familyId = familyId;
  });
}

// ---------------- Courses / templates ----------------

export async function getCourse(courseId: string): Promise<Course | undefined> {
  return (await getDb()).courses.find((c) => c.id === courseId);
}
export async function listCoursesByOwner(staffId: string): Promise<Course[]> {
  return (await getDb()).courses.filter((c) => c.ownerStaffId === staffId);
}
export async function listTemplates(): Promise<Course[]> {
  return (await getDb()).courses.filter((c) => c.isTemplate && c.status === "published");
}
export async function listAllCourses(): Promise<Course[]> {
  return (await getDb()).courses;
}
export async function listPublishedCourses(): Promise<Course[]> {
  return (await getDb()).courses.filter((c) => c.status === "published");
}

export async function getCourseSnapshot(courseId: string): Promise<CourseSnapshot | undefined> {
  const db = await getDb();
  const course = db.courses.find((c) => c.id === courseId);
  if (!course) return undefined;
  const lessons = db.lessons
    .filter((l) => l.courseId === courseId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const lessonIds = new Set(lessons.map((l) => l.id));
  const contentBlocks = db.contentBlocks
    .filter((b) => lessonIds.has(b.lessonId))
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const assessments = db.assessments.filter((a) => a.courseId === courseId);
  const assessmentIds = new Set(assessments.map((a) => a.id));
  const questions = db.questions
    .filter((q) => assessmentIds.has(q.assessmentId))
    .sort((a, b) => a.orderIndex - b.orderIndex);
  return { course, lessons, contentBlocks, assessments, questions };
}

// Readiness — enforces that a course "reliably has content" before it can be published.
export interface CourseReadiness {
  hasPretest: boolean;
  hasPosttest: boolean;
  lessonCount: number;
  lessonsMissingContent: string[];
  lessonsMissingCheck: string[];
  ready: boolean;
}
export async function courseReadiness(courseId: string): Promise<CourseReadiness> {
  const snap = await getCourseSnapshot(courseId);
  if (!snap) {
    return { hasPretest: false, hasPosttest: false, lessonCount: 0, lessonsMissingContent: [], lessonsMissingCheck: [], ready: false };
  }
  const hasPretest = snap.assessments.some((a) => a.kind === "pretest");
  const hasPosttest = snap.assessments.some((a) => a.kind === "posttest");
  const lessonsMissingContent: string[] = [];
  const lessonsMissingCheck: string[] = [];
  for (const l of snap.lessons) {
    if (!snap.contentBlocks.some((b) => b.lessonId === l.id)) lessonsMissingContent.push(l.title);
    const check = snap.assessments.find((a) => a.kind === "lesson_check" && a.lessonId === l.id);
    const hasQ = check && snap.questions.some((q) => q.assessmentId === check.id);
    if (!hasQ) lessonsMissingCheck.push(l.title);
  }
  const ready =
    hasPretest && hasPosttest && snap.lessons.length >= 1 &&
    lessonsMissingContent.length === 0 && lessonsMissingCheck.length === 0;
  return { hasPretest, hasPosttest, lessonCount: snap.lessons.length, lessonsMissingContent, lessonsMissingCheck, ready };
}

export async function saveGeneratedCourse(gen: GeneratedCourse): Promise<Course> {
  await saveDb((db) => {
    db.courses.push(gen.course);
    db.lessons.push(...gen.lessons);
    db.contentBlocks.push(...gen.contentBlocks);
    db.assessments.push(...gen.assessments);
    db.questions.push(...gen.questions);
  });
  return gen.course;
}
export async function setCourseStatus(courseId: string, status: Course["status"]): Promise<void> {
  await saveDb((db) => {
    const c = db.courses.find((x) => x.id === courseId);
    if (c) c.status = status;
  });
}
export async function setCourseTemplate(courseId: string, isTemplate: boolean): Promise<void> {
  await saveDb((db) => {
    const c = db.courses.find((x) => x.id === courseId);
    if (c) c.isTemplate = isTemplate;
  });
}
export async function cloneTemplate(courseId: string, newOwnerStaffId: string): Promise<Course | undefined> {
  const snap = await getCourseSnapshot(courseId);
  if (!snap) return undefined;
  const newCourseId = id("course");
  const idMap = new Map<string, string>();
  const course: Course = {
    ...snap.course,
    id: newCourseId,
    ownerStaffId: newOwnerStaffId,
    title: `${snap.course.title} (copy)`,
    isTemplate: false,
    status: "draft",
  };
  await saveDb((db) => {
    db.courses.push(course);
    for (const l of snap.lessons) {
      const nl = { ...l, id: id("lesson"), courseId: newCourseId };
      idMap.set(l.id, nl.id);
      db.lessons.push(nl);
    }
    for (const b of snap.contentBlocks) {
      db.contentBlocks.push({ ...b, id: id("cb"), lessonId: idMap.get(b.lessonId)! });
    }
    for (const a of snap.assessments) {
      const na = { ...a, id: id("asmt"), courseId: newCourseId, lessonId: a.lessonId ? idMap.get(a.lessonId) ?? null : null };
      idMap.set(a.id, na.id);
      db.assessments.push(na);
    }
    for (const q of snap.questions) {
      db.questions.push({ ...q, id: id("q"), assessmentId: idMap.get(q.assessmentId)! });
    }
  });
  return course;
}

// ---- Manual authoring: course meta, lessons, blocks, questions ----

export async function updateCourseMeta(
  courseId: string,
  patch: Partial<Pick<Course, "title" | "description" | "outcomes" | "teacherInstructions" | "category" | "estimatedDuration" | "coverImage" | "tags">>
): Promise<void> {
  await saveDb((db) => {
    const c = db.courses.find((x) => x.id === courseId);
    if (c) Object.assign(c, patch);
  });
}

export async function createBlankCourse(ownerStaffId: string, title: string): Promise<Course> {
  const courseId = id("course");
  const course: Course = {
    id: courseId, ownerStaffId, title: title || "New Course",
    description: "", outcomes: "", teacherInstructions: "", isTemplate: false,
    category: "Custom", status: "draft", estimatedDuration: "~15 min", tags: [],
  };
  const lessonId = id("lesson");
  const preId = id("asmt");
  const postId = id("asmt");
  const lcId = id("asmt");
  await saveDb((db) => {
    db.courses.push(course);
    db.lessons.push({ id: lessonId, courseId, orderIndex: 0, title: "Lesson 1", teacherInstructions: "" });
    db.contentBlocks.push({ id: id("cb"), lessonId, orderIndex: 0, type: "rich_text", payload: { html: "<p>Write your lesson here. Keep it concrete and home-based.</p>" } });
    db.assessments.push({ id: preId, courseId, kind: "pretest", lessonId: null, title: "Pre-test" });
    db.assessments.push({ id: postId, courseId, kind: "posttest", lessonId: null, title: "Post-test" });
    db.assessments.push({ id: lcId, courseId, kind: "lesson_check", lessonId, title: "Lesson 1 Check" });
    db.questions.push({ id: id("q"), assessmentId: lcId, orderIndex: 0, type: "true_false", prompt: "Replace this with a check question.", options: ["True", "False"], answerKey: [0], scored: true });
    db.questions.push({ id: id("q"), assessmentId: preId, orderIndex: 0, type: "true_false", prompt: "Breaking a skill into small steps makes it easier to teach.", options: ["True", "False"], answerKey: [0], scored: true });
    db.questions.push({ id: id("q"), assessmentId: postId, orderIndex: 0, type: "true_false", prompt: "Breaking a skill into small steps makes it easier to teach.", options: ["True", "False"], answerKey: [0], scored: true });
  });
  return course;
}

export async function addLesson(courseId: string, title: string): Promise<string> {
  const lessonId = id("lesson");
  const lcId = id("asmt");
  await saveDb((db) => {
    const count = db.lessons.filter((l) => l.courseId === courseId).length;
    db.lessons.push({ id: lessonId, courseId, orderIndex: count, title: title || `Lesson ${count + 1}`, teacherInstructions: "" });
    db.contentBlocks.push({ id: id("cb"), lessonId, orderIndex: 0, type: "rich_text", payload: { html: "<p>Write your lesson here.</p>" } });
    db.assessments.push({ id: lcId, courseId, kind: "lesson_check", lessonId, title: `${title || "Lesson"} Check` });
    db.questions.push({ id: id("q"), assessmentId: lcId, orderIndex: 0, type: "true_false", prompt: "Replace this with a check question.", options: ["True", "False"], answerKey: [0], scored: true });
  });
  return lessonId;
}

export async function updateLesson(lessonId: string, patch: Partial<Pick<Lesson, "title" | "teacherInstructions">>): Promise<void> {
  await saveDb((db) => {
    const l = db.lessons.find((x) => x.id === lessonId);
    if (l) Object.assign(l, patch);
  });
}

export async function deleteLesson(lessonId: string): Promise<void> {
  await saveDb((db) => {
    const lesson = db.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;
    const checkIds = db.assessments.filter((a) => a.lessonId === lessonId).map((a) => a.id);
    db.questions = db.questions.filter((q) => !checkIds.includes(q.assessmentId));
    db.assessments = db.assessments.filter((a) => a.lessonId !== lessonId);
    db.contentBlocks = db.contentBlocks.filter((b) => b.lessonId !== lessonId);
    db.lessons = db.lessons.filter((l) => l.id !== lessonId);
    db.lessons.filter((l) => l.courseId === lesson.courseId).sort((a, b) => a.orderIndex - b.orderIndex).forEach((l, i) => (l.orderIndex = i));
  });
}

function swapOrder<T extends { orderIndex: number }>(items: T[], itemId: string, dir: -1 | 1, idOf: (x: T) => string) {
  const sorted = [...items].sort((a, b) => a.orderIndex - b.orderIndex);
  const idx = sorted.findIndex((x) => idOf(x) === itemId);
  const swapWith = idx + dir;
  if (idx === -1 || swapWith < 0 || swapWith >= sorted.length) return;
  const a = sorted[idx].orderIndex;
  sorted[idx].orderIndex = sorted[swapWith].orderIndex;
  sorted[swapWith].orderIndex = a;
}

export async function moveLesson(courseId: string, lessonId: string, dir: -1 | 1): Promise<void> {
  await saveDb((db) => {
    swapOrder(db.lessons.filter((l) => l.courseId === courseId), lessonId, dir, (l) => l.id);
  });
}

export async function updateContentBlock(blockId: string, payload: Record<string, unknown>): Promise<void> {
  await saveDb((db) => {
    const b = db.contentBlocks.find((x) => x.id === blockId);
    if (b) b.payload = payload;
  });
}
export async function deleteContentBlock(blockId: string): Promise<void> {
  await saveDb((db) => {
    const block = db.contentBlocks.find((b) => b.id === blockId);
    if (!block) return;
    db.contentBlocks = db.contentBlocks.filter((b) => b.id !== blockId);
    db.contentBlocks.filter((b) => b.lessonId === block.lessonId).sort((a, b) => a.orderIndex - b.orderIndex).forEach((b, i) => (b.orderIndex = i));
  });
}
export async function moveContentBlock(lessonId: string, blockId: string, dir: -1 | 1): Promise<void> {
  await saveDb((db) => {
    swapOrder(db.contentBlocks.filter((b) => b.lessonId === lessonId), blockId, dir, (b) => b.id);
  });
}

export async function updateQuestion(questionId: string, patch: Partial<Question>): Promise<void> {
  await saveDb((db) => {
    const q = db.questions.find((x) => x.id === questionId);
    if (q) Object.assign(q, patch);
  });
}
export async function deleteQuestion(questionId: string): Promise<void> {
  await saveDb((db) => {
    db.questions = db.questions.filter((q) => q.id !== questionId);
  });
}

export async function getCourseAssessmentId(courseId: string, kind: "pretest" | "posttest"): Promise<string | undefined> {
  return (await getDb()).assessments.find((a) => a.courseId === courseId && a.kind === kind)?.id;
}

export async function addContentBlock(lessonId: string, type: ContentBlockType, payload: Record<string, unknown>): Promise<void> {
  await saveDb((db) => {
    const count = db.contentBlocks.filter((b) => b.lessonId === lessonId).length;
    db.contentBlocks.push({ id: id("cb"), lessonId, orderIndex: count, type, payload });
  });
}
export async function addQuestion(q: Omit<Question, "id">): Promise<void> {
  await saveDb((db) => {
    const count = db.questions.filter((x) => x.assessmentId === q.assessmentId).length;
    db.questions.push({ ...q, id: id("q"), orderIndex: q.orderIndex ?? count });
  });
}
export async function getOrCreateLessonCheck(courseId: string, lessonId: string): Promise<string> {
  const db = await getDb();
  const existing = db.assessments.find((a) => a.courseId === courseId && a.kind === "lesson_check" && a.lessonId === lessonId);
  if (existing) return existing.id;
  const asmtId = id("asmt");
  await saveDb((d) => d.assessments.push({ id: asmtId, courseId, kind: "lesson_check", lessonId, title: "Lesson Check" }));
  return asmtId;
}

// ---------------- Classes & enrollment ----------------

export async function getClass(classId: string): Promise<ClassOffering | undefined> {
  return (await getDb()).classes.find((c) => c.id === classId);
}
export async function listOpenClasses(): Promise<ClassOffering[]> {
  return (await getDb()).classes.filter((c) => c.enrollmentStatus === "open");
}
export async function listClassesByStaff(staffId: string): Promise<ClassOffering[]> {
  return (await getDb()).classes.filter((c) => c.staffId === staffId);
}
export async function createClassFromCourse(
  courseId: string,
  staffId: string,
  details: { title: string; description: string; coverImage?: string; startsAt: string; schedule: string; capacity: number; deliveryMode: ClassOffering["deliveryMode"]; address?: string; meetingLink?: string }
): Promise<ClassOffering | undefined> {
  const snapshot = await getCourseSnapshot(courseId);
  if (!snapshot) return undefined;
  const offering: ClassOffering = {
    id: id("class"), courseId, courseSnapshot: snapshot, staffId,
    title: details.title, description: details.description, coverImage: details.coverImage,
    startsAt: details.startsAt, schedule: details.schedule, capacity: details.capacity,
    enrollmentStatus: "open", deliveryMode: details.deliveryMode, address: details.address, meetingLink: details.meetingLink,
  };
  await saveDb((db) => db.classes.push(offering));
  return offering;
}

export async function listUpcomingClasses(): Promise<ClassOffering[]> {
  const now = nowIso();
  return (await getDb()).classes
    .filter((c) => c.enrollmentStatus === "open" && c.startsAt >= now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export class EnrollmentError extends Error {}
export async function enroll(classId: string, parentId: string): Promise<Enrollment> {
  const db = await getDb();
  const offering = db.classes.find((c) => c.id === classId);
  if (!offering) throw new EnrollmentError("Class not found.");
  if (db.enrollments.find((e) => e.classId === classId && e.parentId === parentId))
    throw new EnrollmentError("You are already enrolled in this class.");
  const count = db.enrollments.filter((e) => e.classId === classId).length;
  if (count >= offering.capacity) throw new EnrollmentError("This class is full.");
  const enrollment: Enrollment = { id: id("enr"), classId, parentId, status: "enrolled", createdAt: nowIso(), attendance: "pending" };
  await saveDb((d) => d.enrollments.push(enrollment));
  return enrollment;
}

export async function setAttendance(user: User, enrollmentId: string, status: AttendanceStatus): Promise<void> {
  const db = await getDb();
  const enr = db.enrollments.find((e) => e.id === enrollmentId);
  if (!enr) return;
  const cls = db.classes.find((c) => c.id === enr.classId);
  if (!cls) return;
  if (user.role !== "admin" && cls.staffId !== user.id) return;
  await saveDb((d) => {
    const e = d.enrollments.find((x) => x.id === enrollmentId);
    if (!e) return;
    e.attendance = status;
    e.checkedInAt = status === "pending" ? undefined : nowIso();
    e.checkedInByStaffId = status === "pending" ? undefined : user.id;
  });
}
export async function getEnrollment(classId: string, parentId: string): Promise<Enrollment | undefined> {
  return (await getDb()).enrollments.find((e) => e.classId === classId && e.parentId === parentId);
}
export async function listEnrollmentsByParent(parentId: string): Promise<Enrollment[]> {
  return (await getDb()).enrollments.filter((e) => e.parentId === parentId);
}
export async function listEnrollmentsByClass(classId: string): Promise<Enrollment[]> {
  return (await getDb()).enrollments.filter((e) => e.classId === classId);
}
export async function seatsRemaining(classId: string): Promise<number> {
  const offering = await getClass(classId);
  if (!offering) return 0;
  return Math.max(0, offering.capacity - (await listEnrollmentsByClass(classId)).length);
}
export async function setEnrollmentStatus(enrollmentId: string, status: Enrollment["status"]): Promise<void> {
  await saveDb((db) => {
    const e = db.enrollments.find((x) => x.id === enrollmentId);
    if (e) e.status = status;
  });
}

// ---------------- Attempts & lesson progress ----------------

export async function recordAttempt(enrollmentId: string, assessmentId: string, score: number, maxScore: number): Promise<Attempt> {
  const attempt: Attempt = { id: id("att"), enrollmentId, assessmentId, score, maxScore, submittedAt: nowIso() };
  await saveDb((db) => {
    db.attempts = db.attempts.filter((a) => !(a.enrollmentId === enrollmentId && a.assessmentId === assessmentId));
    db.attempts.push(attempt);
  });
  return attempt;
}
export async function listAttempts(enrollmentId: string): Promise<Attempt[]> {
  return (await getDb()).attempts.filter((a) => a.enrollmentId === enrollmentId);
}
export async function getAttempt(enrollmentId: string, assessmentId: string): Promise<Attempt | undefined> {
  return (await getDb()).attempts.find((a) => a.enrollmentId === enrollmentId && a.assessmentId === assessmentId);
}
export async function upsertLessonProgress(enrollmentId: string, lessonId: string, status: LessonProgress["status"], lastBlockIndex: number): Promise<void> {
  await saveDb((db) => {
    let lp = db.lessonProgress.find((p) => p.enrollmentId === enrollmentId && p.lessonId === lessonId);
    if (!lp) {
      lp = { id: id("lp"), enrollmentId, lessonId, status, lastBlockIndex };
      db.lessonProgress.push(lp);
    } else {
      lp.status = status;
      lp.lastBlockIndex = lastBlockIndex;
    }
  });
}
export async function listLessonProgress(enrollmentId: string): Promise<LessonProgress[]> {
  return (await getDb()).lessonProgress.filter((p) => p.enrollmentId === enrollmentId);
}

// =====================================================================
// FAMILY-SCOPED CLINICAL DATA
// =====================================================================

export async function listMyChildren(user: User): Promise<Child[]> {
  return user.familyId ? listFamilyChildren(user, user.familyId) : [];
}
export async function listMyDocuments(user: User): Promise<Document[]> {
  return user.familyId ? listDocumentsForFamily(user, user.familyId) : [];
}
export async function listMyGoals(user: User): Promise<ExtractedGoal[]> {
  return user.familyId ? listGoalsForFamily(user, user.familyId) : [];
}

// ---- Children & profiles ----
export async function listFamilyChildren(user: User, familyId: string): Promise<Child[]> {
  if (!(await canAccessFamily(user, familyId))) return [];
  return (await getDb()).children.filter((c) => c.familyId === familyId);
}
export async function getChildById(user: User, childId: string): Promise<Child | undefined> {
  const child = (await getDb()).children.find((c) => c.id === childId);
  if (!child || !(await canAccessFamily(user, child.familyId))) return undefined;
  return child;
}
export async function addChild(user: User, familyId: string, data: { displayName: string; dob?: string }): Promise<Child> {
  if (!canWriteFamily(user, familyId)) throw new AccessError("No write access to this family.");
  const child: Child = { id: id("child"), familyId, displayName: data.displayName, dob: data.dob, interestTags: [], needTags: [], temperament: "", strengths: "", notes: "" };
  await saveDb((db) => db.children.push(child));
  return child;
}
export async function updateChildProfile(
  user: User,
  childId: string,
  patch: Partial<Pick<Child, "displayName" | "dob" | "avatarUrl" | "interestTags" | "needTags" | "temperament" | "strengths" | "notes">>
): Promise<void> {
  const child = await getChildById(user, childId);
  if (!child || !canWriteFamily(user, child.familyId)) throw new AccessError("No write access to this child.");
  await saveDb((db) => {
    const c = db.children.find((x) => x.id === childId);
    if (c) Object.assign(c, patch);
  });
}
export async function deleteChild(user: User, childId: string): Promise<void> {
  const child = await getChildById(user, childId);
  if (!child || !canWriteFamily(user, child.familyId)) return;
  const docs = (await getDb()).documents.filter((d) => d.childId === childId);
  for (const d of docs) await deleteDocument(user, d.id);
  await saveDb((db) => {
    db.children = db.children.filter((c) => c.id !== childId);
  });
}

// ---- Documents (+ derived breakdown & goals) ----
export async function listDocumentsForFamily(user: User, familyId: string): Promise<Document[]> {
  if (!(await canAccessFamily(user, familyId))) return [];
  return (await getDb()).documents.filter((d) => d.familyId === familyId);
}
export async function listAccessibleDocuments(user: User): Promise<Document[]> {
  const fams = new Set(await accessibleFamilyIds(user));
  return (await getDb()).documents.filter((d) => fams.has(d.familyId));
}
export async function getDocumentById(user: User, docId: string): Promise<Document | undefined> {
  const doc = (await getDb()).documents.find((d) => d.id === docId);
  if (!doc || !(await canAccessFamily(user, doc.familyId))) return undefined;
  return doc;
}

export async function createDocument(user: User, childId: string, docType: DocType, fileName: string): Promise<Document> {
  const child = await getChildById(user, childId);
  if (!child) throw new AccessError("Child not found.");
  if (!canWriteFamily(user, child.familyId)) throw new AccessError("No write access.");

  const family = (await getDb()).families.find((f) => f.id === child.familyId);
  const retentionUntil = retentionUntilFromMonths(family?.retentionMonths);

  const docId = id("doc");
  const doc: Document = {
    id: docId, childId, familyId: child.familyId, createdByParentId: user.id, docType, fileName,
    storagePath: `${child.familyId}/${childId}/${fileName}`, status: "ready", retentionUntil, createdAt: nowIso(),
  };

  const result = await processDocument({ fileName, docType });
  const breakdown: DocumentBreakdown = {
    id: id("bd"), documentId: docId, familyId: child.familyId, summary: result.payload.summary.en,
    payload: result.payload, language: "en", contentHash: result.contentHash, promptVersion: result.promptVersion,
  };
  const goals: ExtractedGoal[] = result.goalDrafts.map((g) => ({ ...g, id: id("eg"), documentId: docId, familyId: child.familyId, childId, source: "iep" as const }));

  await saveDb((db) => {
    db.documents.push(doc);
    db.documentBreakdowns.push(breakdown);
    db.extractedGoals.push(...goals);
  });
  return doc;
}

export async function reprocessDocument(user: User, docId: string): Promise<{ changed: boolean }> {
  const doc = await getDocumentById(user, docId);
  if (!doc || !canWriteFamily(user, doc.familyId)) return { changed: false };
  const result = await processDocument({ fileName: doc.fileName, docType: doc.docType });
  const existing = await getBreakdownByDoc(user, docId);
  if (existing && existing.contentHash === result.contentHash && existing.promptVersion === PROMPT_VERSION) {
    return { changed: false };
  }
  await saveDb((db) => {
    db.documentBreakdowns = db.documentBreakdowns.filter((b) => b.documentId !== docId);
    db.extractedGoals = db.extractedGoals.filter((g) => g.documentId !== docId);
    db.documentBreakdowns.push({
      id: id("bd"), documentId: docId, familyId: doc.familyId, summary: result.payload.summary.en,
      payload: result.payload, language: "en", contentHash: result.contentHash, promptVersion: result.promptVersion,
    });
    db.extractedGoals.push(...result.goalDrafts.map((g) => ({ ...g, id: id("eg"), documentId: docId, familyId: doc.familyId, childId: doc.childId, source: "iep" as const })));
  });
  return { changed: true };
}

export async function getBreakdownByDoc(user: User, docId: string): Promise<DocumentBreakdown | undefined> {
  const bd = (await getDb()).documentBreakdowns.find((b) => b.documentId === docId);
  if (!bd || !(await canAccessFamily(user, bd.familyId))) return undefined;
  return bd;
}

export async function deleteDocument(user: User, docId: string): Promise<void> {
  const doc = await getDocumentById(user, docId);
  if (!doc || !canWriteFamily(user, doc.familyId)) return;
  await saveDb((db) => {
    const goalIds = db.extractedGoals.filter((g) => g.documentId === docId).map((g) => g.id);
    db.documents = db.documents.filter((d) => d.id !== docId);
    db.documentBreakdowns = db.documentBreakdowns.filter((b) => b.documentId !== docId);
    db.extractedGoals = db.extractedGoals.filter((g) => g.documentId !== docId);
    db.goalProgress = db.goalProgress.filter((p) => !goalIds.includes(p.extractedGoalId));
  });
}

// ---- Extracted goals & home progress ----
export async function listGoalsForFamily(user: User, familyId: string): Promise<ExtractedGoal[]> {
  if (!(await canAccessFamily(user, familyId))) return [];
  return (await getDb()).extractedGoals.filter((g) => g.familyId === familyId);
}
export async function listGoalsForChild(user: User, childId: string): Promise<ExtractedGoal[]> {
  const child = await getChildById(user, childId);
  if (!child) return [];
  return (await getDb()).extractedGoals.filter((g) => g.childId === childId);
}
export async function listAccessibleGoals(user: User): Promise<ExtractedGoal[]> {
  const fams = new Set(await accessibleFamilyIds(user));
  return (await getDb()).extractedGoals.filter((g) => fams.has(g.familyId));
}
export async function getGoalById(user: User, goalId: string): Promise<ExtractedGoal | undefined> {
  const goal = (await getDb()).extractedGoals.find((g) => g.id === goalId);
  if (!goal || !(await canAccessFamily(user, goal.familyId))) return undefined;
  return goal;
}
export async function logGoalProgress(
  user: User,
  goalId: string,
  note: string,
  simpleRating: GoalProgress["simpleRating"],
  media?: { url: string; type: "image" | "video" }
): Promise<GoalProgress> {
  const goal = await getGoalById(user, goalId);
  if (!goal) throw new AccessError("Goal not found.");
  if (!canWriteFamily(user, goal.familyId)) throw new AccessError("Staff are read-only on progress.");
  const entry: GoalProgress = {
    id: id("gp"), extractedGoalId: goalId, familyId: goal.familyId, observedByParentId: user.id,
    observedAt: nowIso(), note, simpleRating, mediaUrl: media?.url, mediaType: media?.type,
  };
  await saveDb((db) => db.goalProgress.push(entry));
  return entry;
}

export async function addManualGoal(user: User, childId: string, data: { domain: string; target: string; baseline?: string; measure?: string }): Promise<ExtractedGoal> {
  const child = await getChildById(user, childId);
  if (!child) throw new AccessError("Child not found.");
  if (!canWriteFamily(user, child.familyId)) throw new AccessError("No write access.");
  const goal: ExtractedGoal = {
    id: id("eg"), documentId: null, familyId: child.familyId, childId, source: "manual",
    domain: data.domain || "Custom", verbatimText: "", baseline: data.baseline ?? "", target: data.target,
    measure: data.measure ?? "Parent observation", confidence: "high",
  };
  await saveDb((db) => db.extractedGoals.push(goal));
  return goal;
}

export async function deleteGoal(user: User, goalId: string): Promise<void> {
  const goal = await getGoalById(user, goalId);
  if (!goal || !canWriteFamily(user, goal.familyId)) return;
  await saveDb((db) => {
    db.extractedGoals = db.extractedGoals.filter((g) => g.id !== goalId);
    db.goalProgress = db.goalProgress.filter((p) => p.extractedGoalId !== goalId);
  });
}
export async function listGoalProgress(user: User, goalId: string): Promise<GoalProgress[]> {
  const goal = await getGoalById(user, goalId);
  if (!goal) return [];
  return (await getDb()).goalProgress
    .filter((p) => p.extractedGoalId === goalId)
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt));
}

// ---- Family settings + data deletion ----
export function retentionUntilFromMonths(months: number | null | undefined): string | null {
  if (!months) return null;
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

export async function deleteFamilyData(user: User, familyId: string): Promise<void> {
  if (!canWriteFamily(user, familyId)) return;
  await saveDb((db) => {
    db.children = db.children.filter((c) => c.familyId !== familyId);
    db.documents = db.documents.filter((d) => d.familyId !== familyId);
    db.documentBreakdowns = db.documentBreakdowns.filter((b) => b.familyId !== familyId);
    db.extractedGoals = db.extractedGoals.filter((g) => g.familyId !== familyId);
    db.goalProgress = db.goalProgress.filter((p) => p.familyId !== familyId);
    if (user.role === "parent") {
      const u = db.users.find((x) => x.id === user.id);
      if (u) u.status = "deactivated";
    }
  });
}
