import { getDb } from "./store";
import {
  getClass,
  getUser,
  listEnrollmentsByClass,
  listAttempts,
  listLessonProgress,
} from "./repos";

// Staff/admin reporting (§4.6). Reads ONLY learning data — never documents/goals. Async store.

export interface RosterRow {
  parentId: string;
  parentName: string;
  enrollmentId: string;
  status: string;
  preScore: number | null;
  preMax: number | null;
  postScore: number | null;
  postMax: number | null;
  delta: number | null;
  completionPct: number;
}

export async function classRoster(classId: string): Promise<RosterRow[]> {
  const offering = await getClass(classId);
  if (!offering) return [];
  const snap = offering.courseSnapshot;
  const pre = snap.assessments.find((a) => a.kind === "pretest");
  const post = snap.assessments.find((a) => a.kind === "posttest");
  const totalLessons = snap.lessons.length;

  const enrollments = await listEnrollmentsByClass(classId);
  const rows: RosterRow[] = [];
  for (const e of enrollments) {
    const attempts = await listAttempts(e.id);
    const preA = pre ? attempts.find((a) => a.assessmentId === pre.id) : undefined;
    const postA = post ? attempts.find((a) => a.assessmentId === post.id) : undefined;
    const completedLessons = (await listLessonProgress(e.id)).filter((p) => p.status === "complete").length;
    const preScore = preA ? preA.score : null;
    const postScore = postA ? postA.score : null;
    rows.push({
      parentId: e.parentId,
      parentName: (await getUser(e.parentId))?.name ?? "Parent",
      enrollmentId: e.id,
      status: e.status,
      preScore, preMax: preA ? preA.maxScore : null,
      postScore, postMax: postA ? postA.maxScore : null,
      delta: preScore !== null && postScore !== null ? postScore - preScore : null,
      completionPct: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0,
    });
  }
  return rows;
}

export async function lessonCheckPassRates(classId: string): Promise<{ lessonTitle: string; passRate: number; attempts: number }[]> {
  const offering = await getClass(classId);
  if (!offering) return [];
  const snap = offering.courseSnapshot;
  const enrollments = await listEnrollmentsByClass(classId);
  const checks = snap.assessments.filter((a) => a.kind === "lesson_check");

  const out: { lessonTitle: string; passRate: number; attempts: number }[] = [];
  for (const check of checks) {
    const lesson = snap.lessons.find((l) => l.id === check.lessonId);
    let pass = 0;
    let total = 0;
    for (const e of enrollments) {
      const a = (await listAttempts(e.id)).find((x) => x.assessmentId === check.id);
      if (!a) continue;
      total += 1;
      if (a.maxScore > 0 && a.score / a.maxScore >= 0.6) pass += 1;
    }
    out.push({ lessonTitle: lesson?.title ?? check.title, passRate: total ? Math.round((pass / total) * 100) : 0, attempts: total });
  }
  return out;
}

export interface CourseAggregate {
  courseId: string;
  courseTitle: string;
  classes: number;
  enrollments: number;
  completions: number;
  avgDelta: number | null;
}

export async function courseAggregates(): Promise<CourseAggregate[]> {
  const db = await getDb();
  const out: CourseAggregate[] = [];
  for (const course of db.courses) {
    const classes = db.classes.filter((c) => c.courseId === course.id);
    let enrollments = 0;
    let completions = 0;
    const deltas: number[] = [];
    for (const cls of classes) {
      const roster = await classRoster(cls.id);
      enrollments += roster.length;
      completions += roster.filter((r) => r.status === "completed").length;
      for (const r of roster) if (r.delta !== null) deltas.push(r.delta);
    }
    out.push({
      courseId: course.id, courseTitle: course.title, classes: classes.length,
      enrollments, completions,
      avgDelta: deltas.length ? Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10 : null,
    });
  }
  return out;
}
