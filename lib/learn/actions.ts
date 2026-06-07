"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import {
  EnrollmentError,
  enroll,
  getClass,
  getEnrollment,
  recordAttempt,
  setEnrollmentStatus,
  upsertLessonProgress,
} from "@/lib/data/repos";
import { gradeAssessment, type SubmittedAnswer } from "@/lib/grading";

export async function enrollAction(formData: FormData): Promise<void> {
  const user = await requireRole("parent");
  const classId = String(formData.get("classId") ?? "");
  try {
    await enroll(classId, user.id);
  } catch (e) {
    if (e instanceof EnrollmentError) {
      redirect(`/parent/learn/${classId}?error=${encodeURIComponent(e.message)}`);
    }
    throw e;
  }
  revalidatePath("/parent/learn");
  redirect(`/parent/learn/${classId}/play`);
}

// Grade + record one assessment (pre-test, lesson check, or post-test) and advance state.
export async function submitAssessmentAction(formData: FormData): Promise<void> {
  const user = await requireRole("parent");
  const classId = String(formData.get("classId") ?? "");
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const answers = JSON.parse(
    String(formData.get("answers") ?? "[]")
  ) as SubmittedAnswer[];

  const offering = await getClass(classId);
  const enrollment = await getEnrollment(classId, user.id);
  if (!offering || !enrollment) redirect("/parent/learn");

  const snap = offering!.courseSnapshot;
  const assessment = snap.assessments.find((a) => a.id === assessmentId);
  if (!assessment) redirect(`/parent/learn/${classId}/play`);

  const questions = snap.questions.filter((q) => q.assessmentId === assessmentId);
  const { score, maxScore } = gradeAssessment(questions, answers);
  await recordAttempt(enrollment!.id, assessmentId, score, maxScore);

  if (assessment!.kind === "pretest") {
    await setEnrollmentStatus(enrollment!.id, "in_progress");
  } else if (assessment!.kind === "lesson_check" && assessment!.lessonId) {
    await upsertLessonProgress(enrollment!.id, assessment!.lessonId, "complete", 0);
  } else if (assessment!.kind === "posttest") {
    await setEnrollmentStatus(enrollment!.id, "completed");
  }

  revalidatePath(`/parent/learn/${classId}/play`);
  redirect(`/parent/learn/${classId}/play`);
}
