"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import {
  addContentBlock,
  addLesson,
  addQuestion,
  cloneTemplate,
  courseReadiness,
  createBlankCourse,
  createClassFromCourse,
  deleteContentBlock,
  deleteLesson,
  deleteQuestion,
  getCourse,
  getCourseAssessmentId,
  getOrCreateLessonCheck,
  moveContentBlock,
  moveLesson,
  saveGeneratedCourse,
  setAttendance,
  setCourseStatus,
  setCourseTemplate,
  updateContentBlock,
  updateCourseMeta,
  updateLesson,
} from "@/lib/data/repos";
import { generateCourse } from "@/lib/ai/courseBuilder";
import { createSignedUploadUrl } from "@/lib/supabase/storage";
import { id } from "@/lib/data/store";
import type { ContentBlockType, Question, QuestionType } from "@/lib/types";

async function ownsCourse(userId: string, courseId: string): Promise<boolean> {
  return (await getCourse(courseId))?.ownerStaffId === userId;
}

// Allowed direct-upload media types → file extension.
const ALLOWED_MEDIA: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/ogg": "ogv",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

// Step 1 of a direct upload: mint a one-time signed URL the browser PUTs the file to.
// The path is constructed server-side (never trusted from the client) and scoped to
// this course, so a signed URL can't be used to overwrite db.json or another course.
export async function createCourseUploadUrlAction(input: {
  courseId: string;
  lessonId: string;
  contentType: string;
}): Promise<{ ok: true; uploadUrl: string; path: string } | { ok: false; error: string }> {
  const user = await requireRole("staff");
  if (!(await ownsCourse(user.id, input.courseId))) return { ok: false, error: "You don't own this course." };
  const ext = ALLOWED_MEDIA[input.contentType];
  if (!ext) return { ok: false, error: "Unsupported file type. Use MP4/WebM/MOV video or JPG/PNG/WebP image." };
  const safeLesson = input.lessonId.replace(/[^a-zA-Z0-9_-]/g, "");
  const path = `media/courses/${input.courseId}/${safeLesson}/${id("m")}.${ext}`;
  try {
    const uploadUrl = await createSignedUploadUrl(path);
    return { ok: true, uploadUrl, path };
  } catch {
    return { ok: false, error: "Couldn't start the upload. Please try again." };
  }
}

// Step 2 of a direct upload: once the file is in storage, attach it as a content block.
export async function attachCourseMediaAction(input: {
  courseId: string;
  lessonId: string;
  path: string;
  kind: "video" | "image";
  caption?: string;
}): Promise<void> {
  const user = await requireRole("staff");
  if (!(await ownsCourse(user.id, input.courseId))) return;
  // Only attach media that lives under this course's own media folder.
  if (!input.path.startsWith(`media/courses/${input.courseId}/`)) return;
  const url = `/api/media/${input.path}`;
  const caption = (input.caption ?? "").trim();
  if (input.kind === "video") {
    await addContentBlock(input.lessonId, "video", { url, caption, uploaded: true });
  } else {
    await addContentBlock(input.lessonId, "image", { url, alt: caption });
  }
  revalidatePath(`/staff/courses/${input.courseId}`);
}

function textToHtml(text: string): string {
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`);
  return paras.join("") || "<p></p>";
}

export async function generateCourseAction(formData: FormData): Promise<void> {
  const user = await requireRole("staff");
  const gen = await generateCourse(
    {
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      outcomes: String(formData.get("outcomes") ?? "").trim(),
      audience: String(formData.get("audience") ?? "").trim(),
      lessonCount: Number(formData.get("lessonCount") ?? 3),
    },
    user.id
  );
  const course = await saveGeneratedCourse(gen);
  revalidatePath("/staff");
  redirect(`/staff/courses/${course.id}`);
}

export async function createBlankCourseAction(formData: FormData): Promise<void> {
  const user = await requireRole("staff");
  const course = await createBlankCourse(user.id, String(formData.get("title") ?? "").trim() || "New Course");
  revalidatePath("/staff");
  redirect(`/staff/courses/${course.id}`);
}

export async function publishCourseAction(formData: FormData): Promise<void> {
  await requireRole("staff");
  const courseId = String(formData.get("courseId") ?? "");
  if (!(await courseReadiness(courseId)).ready) {
    redirect(`/staff/courses/${courseId}?error=not-ready`);
  }
  await setCourseStatus(courseId, "published");
  revalidatePath(`/staff/courses/${courseId}`);
  revalidatePath("/staff");
}

export async function unpublishCourseAction(formData: FormData): Promise<void> {
  await requireRole("staff");
  const courseId = String(formData.get("courseId") ?? "");
  await setCourseStatus(courseId, "draft");
  revalidatePath(`/staff/courses/${courseId}`);
}

export async function publishTemplateAction(formData: FormData): Promise<void> {
  await requireRole("staff");
  const courseId = String(formData.get("courseId") ?? "");
  await setCourseStatus(courseId, "published");
  await setCourseTemplate(courseId, true);
  revalidatePath(`/staff/courses/${courseId}`);
  revalidatePath("/staff/templates");
}

export async function cloneTemplateAction(formData: FormData): Promise<void> {
  const user = await requireRole("staff");
  const courseId = String(formData.get("courseId") ?? "");
  const copy = await cloneTemplate(courseId, user.id);
  revalidatePath("/staff");
  if (copy) redirect(`/staff/courses/${copy.id}`);
}

// ---- Course metadata ----
export async function updateCourseMetaAction(formData: FormData): Promise<void> {
  const user = await requireRole("staff");
  const courseId = String(formData.get("courseId") ?? "");
  if (!(await ownsCourse(user.id, courseId))) return;
  await updateCourseMeta(courseId, {
    title: String(formData.get("title") ?? "").trim() || "Untitled Course",
    description: String(formData.get("description") ?? "").trim(),
    outcomes: String(formData.get("outcomes") ?? "").trim(),
    teacherInstructions: String(formData.get("teacherInstructions") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim() || "Custom",
    estimatedDuration: String(formData.get("estimatedDuration") ?? "").trim(),
    coverImage: String(formData.get("coverImage") ?? "").trim() || undefined,
    tags: String(formData.get("tags") ?? "").split(",").map((t) => t.trim().toLowerCase().replace(/\s+/g, "_")).filter(Boolean),
  });
  revalidatePath(`/staff/courses/${courseId}`);
}

// ---- Lessons ----
export async function addLessonAction(formData: FormData): Promise<void> {
  const user = await requireRole("staff");
  const courseId = String(formData.get("courseId") ?? "");
  if (!(await ownsCourse(user.id, courseId))) return;
  await addLesson(courseId, String(formData.get("title") ?? "").trim());
  revalidatePath(`/staff/courses/${courseId}`);
}
export async function updateLessonAction(formData: FormData): Promise<void> {
  const user = await requireRole("staff");
  const courseId = String(formData.get("courseId") ?? "");
  if (!(await ownsCourse(user.id, courseId))) return;
  await updateLesson(String(formData.get("lessonId") ?? ""), {
    title: String(formData.get("title") ?? "").trim() || "Lesson",
    teacherInstructions: String(formData.get("teacherInstructions") ?? "").trim(),
  });
  revalidatePath(`/staff/courses/${courseId}`);
}
export async function deleteLessonAction(formData: FormData): Promise<void> {
  const user = await requireRole("staff");
  const courseId = String(formData.get("courseId") ?? "");
  if (!(await ownsCourse(user.id, courseId))) return;
  await deleteLesson(String(formData.get("lessonId") ?? ""));
  revalidatePath(`/staff/courses/${courseId}`);
}
export async function moveLessonAction(formData: FormData): Promise<void> {
  const user = await requireRole("staff");
  const courseId = String(formData.get("courseId") ?? "");
  if (!(await ownsCourse(user.id, courseId))) return;
  await moveLesson(courseId, String(formData.get("lessonId") ?? ""), Number(formData.get("dir")) === 1 ? 1 : -1);
  revalidatePath(`/staff/courses/${courseId}`);
}

// ---- Content blocks ----
export async function addContentBlockAction(formData: FormData): Promise<void> {
  const user = await requireRole("staff");
  const courseId = String(formData.get("courseId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  if (!(await ownsCourse(user.id, courseId))) return;
  const type = String(formData.get("type") ?? "rich_text") as ContentBlockType;
  if (type === "rich_text") {
    const text = String(formData.get("text") ?? "").trim();
    await addContentBlock(lessonId, "rich_text", { html: textToHtml(text || "New text block.") });
  } else {
    const url = String(formData.get("url") ?? "").trim();
    const alt = String(formData.get("alt") ?? "").trim();
    if (!url) return;
    const payload = type === "video" ? { url, caption: alt } : type === "slideshow" ? { images: [{ url, alt }] } : { url, alt };
    await addContentBlock(lessonId, type, payload);
  }
  revalidatePath(`/staff/courses/${courseId}`);
}
export async function updateRichTextAction(formData: FormData): Promise<void> {
  const user = await requireRole("staff");
  const courseId = String(formData.get("courseId") ?? "");
  if (!(await ownsCourse(user.id, courseId))) return;
  await updateContentBlock(String(formData.get("blockId") ?? ""), { html: textToHtml(String(formData.get("text") ?? "")) });
  revalidatePath(`/staff/courses/${courseId}`);
}
export async function deleteContentBlockAction(formData: FormData): Promise<void> {
  const user = await requireRole("staff");
  const courseId = String(formData.get("courseId") ?? "");
  if (!(await ownsCourse(user.id, courseId))) return;
  await deleteContentBlock(String(formData.get("blockId") ?? ""));
  revalidatePath(`/staff/courses/${courseId}`);
}
export async function moveContentBlockAction(formData: FormData): Promise<void> {
  const user = await requireRole("staff");
  const courseId = String(formData.get("courseId") ?? "");
  if (!(await ownsCourse(user.id, courseId))) return;
  await moveContentBlock(String(formData.get("lessonId") ?? ""), String(formData.get("blockId") ?? ""), Number(formData.get("dir")) === 1 ? 1 : -1);
  revalidatePath(`/staff/courses/${courseId}`);
}

// ---- Questions (lesson checks + pre/post) ----
export async function addQuestionAction(formData: FormData): Promise<void> {
  const user = await requireRole("staff");
  const courseId = String(formData.get("courseId") ?? "");
  if (!(await ownsCourse(user.id, courseId))) return;
  const prompt = String(formData.get("prompt") ?? "").trim();
  if (!prompt) return;
  const target = String(formData.get("target") ?? "");
  let assessmentId: string | undefined;
  if (target.startsWith("lesson:")) {
    assessmentId = await getOrCreateLessonCheck(courseId, target.slice("lesson:".length));
  } else if (target === "pretest" || target === "posttest") {
    assessmentId = await getCourseAssessmentId(courseId, target);
  }
  if (!assessmentId) return;

  const type = String(formData.get("type") ?? "true_false") as QuestionType;
  const q: Omit<Question, "id"> = buildQuestion(type, prompt, formData, assessmentId);
  await addQuestion(q);
  revalidatePath(`/staff/courses/${courseId}`);
}
export async function deleteQuestionAction(formData: FormData): Promise<void> {
  const user = await requireRole("staff");
  const courseId = String(formData.get("courseId") ?? "");
  if (!(await ownsCourse(user.id, courseId))) return;
  await deleteQuestion(String(formData.get("questionId") ?? ""));
  revalidatePath(`/staff/courses/${courseId}`);
}

function buildQuestion(type: QuestionType, prompt: string, fd: FormData, assessmentId: string): Omit<Question, "id"> {
  const base = { assessmentId, orderIndex: 999, prompt, scored: true } as const;
  if (type === "true_false") {
    const correct = String(fd.get("correct") ?? "true") === "true" ? 0 : 1;
    return { ...base, type, options: ["True", "False"], answerKey: [correct] };
  }
  const options = String(fd.get("options") ?? "").split("\n").map((o) => o.trim()).filter(Boolean);
  if (type === "multi_select") {
    const key = String(fd.get("correctIndexes") ?? "").split(",").map((n) => Number(n.trim())).filter((n) => !Number.isNaN(n));
    return { ...base, type, options, answerKey: key };
  }
  if (type === "short_text") {
    const keywords = String(fd.get("keywords") ?? "").split(",").map((k) => k.trim()).filter(Boolean);
    return { ...base, type: "short_text", options: [], answerKey: keywords };
  }
  const correctIndex = Number(fd.get("correctIndex") ?? 0) || 0;
  return { ...base, type: "multiple_choice", options: options.length ? options : ["Option A", "Option B"], answerKey: [correctIndex] };
}

export async function launchClassAction(formData: FormData): Promise<void> {
  const user = await requireRole("staff");
  const courseId = String(formData.get("courseId") ?? "");
  const deliveryMode = String(formData.get("deliveryMode") ?? "telehealth") === "in_person" ? "in_person" : "telehealth";
  const startsAtRaw = String(formData.get("startsAt") ?? "").trim();
  const offering = await createClassFromCourse(courseId, user.id, {
    title: String(formData.get("title") ?? "").trim() || "New Event",
    description: String(formData.get("description") ?? "").trim(),
    coverImage: String(formData.get("coverImage") ?? "").trim() || undefined,
    startsAt: startsAtRaw ? new Date(startsAtRaw).toISOString() : new Date().toISOString(),
    schedule: String(formData.get("schedule") ?? "").trim(),
    capacity: Math.max(1, Number(formData.get("capacity") ?? 10)),
    deliveryMode,
    address: deliveryMode === "in_person" ? String(formData.get("address") ?? "").trim() : undefined,
    meetingLink: deliveryMode === "telehealth" ? String(formData.get("meetingLink") ?? "").trim() : undefined,
  });
  revalidatePath("/staff");
  if (offering) redirect(`/staff/classes/${offering.id}`);
}

export async function checkInAction(formData: FormData): Promise<void> {
  const user = await requireRole("staff");
  const classId = String(formData.get("classId") ?? "");
  await setAttendance(user, String(formData.get("enrollmentId") ?? ""), String(formData.get("status") ?? "present") as "present" | "absent" | "pending");
  revalidatePath(`/staff/classes/${classId}`);
}
