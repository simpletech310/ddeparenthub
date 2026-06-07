import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import {
  getClass,
  getEnrollment,
  listAttempts,
  listLessonProgress,
} from "@/lib/data/repos";
import { AssessmentForm } from "@/components/AssessmentForm";
import { LessonContent } from "@/components/LessonContent";
import { PlayerResults } from "./PlayerResults";

export default async function PlayerPage({ params }: { params: { classId: string } }) {
  const user = await requireRole("parent");
  const cls = await getClass(params.classId);
  if (!cls) notFound();
  const enrollment = await getEnrollment(cls.id, user.id);
  if (!enrollment) redirect(`/parent/learn/${cls.id}`);

  const snap = cls.courseSnapshot;
  const pre = snap.assessments.find((a) => a.kind === "pretest")!;
  const post = snap.assessments.find((a) => a.kind === "posttest")!;
  const attempts = await listAttempts(enrollment!.id);
  const progress = await listLessonProgress(enrollment!.id);
  const done = (id: string) => attempts.some((a) => a.assessmentId === id);
  const lessonDone = (lessonId: string) =>
    progress.some((p) => p.lessonId === lessonId && p.status === "complete");

  // Determine the active stage (sequential gating, §4.5).
  let stage: "pretest" | "lesson" | "posttest" | "results";
  let activeLessonIndex = -1;
  if (!done(pre.id)) {
    stage = "pretest";
  } else {
    activeLessonIndex = snap.lessons.findIndex((l) => !lessonDone(l.id));
    if (activeLessonIndex !== -1) stage = "lesson";
    else if (!done(post.id)) stage = "posttest";
    else stage = "results";
  }

  const totalSteps = snap.lessons.length + 2;
  const completedSteps =
    (done(pre.id) ? 1 : 0) +
    snap.lessons.filter((l) => lessonDone(l.id)).length +
    (done(post.id) ? 1 : 0);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/parent/learn" className="text-sm text-ink-600">
          ← Classes
        </Link>
        <h1 className="mt-1 text-lg font-bold text-brand-900">{cls.title}</h1>
        <ProgressBar completed={completedSteps} total={totalSteps} />
      </div>

      {stage === "pretest" && (
        <Stage
          badge="Pre-test"
          title="Let's set your baseline"
          subtitle="A few quick questions before we begin. This helps us measure your growth."
        >
          <AssessmentForm
            key={pre.id}
            classId={cls.id}
            assessmentId={pre.id}
            questions={snap.questions.filter((q) => q.assessmentId === pre.id)}
            submitLabel="Start the class"
          />
        </Stage>
      )}

      {stage === "lesson" && activeLessonIndex !== -1 && (() => {
        const lesson = snap.lessons[activeLessonIndex];
        const blocks = snap.contentBlocks.filter((b) => b.lessonId === lesson.id);
        const check = snap.assessments.find(
          (a) => a.kind === "lesson_check" && a.lessonId === lesson.id
        );
        const checkQs = check
          ? snap.questions.filter((q) => q.assessmentId === check.id)
          : [];
        return (
          <Stage
            badge={`Lesson ${activeLessonIndex + 1} of ${snap.lessons.length}`}
            title={lesson.title}
          >
            <LessonContent blocks={blocks} />
            {check && checkQs.length > 0 && (
              <div className="mt-5">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-600">
                  Lesson check
                </h3>
                <AssessmentForm
                  key={check.id}
                  classId={cls.id}
                  assessmentId={check.id}
                  questions={checkQs}
                  submitLabel="Complete lesson"
                />
              </div>
            )}
          </Stage>
        );
      })()}

      {stage === "posttest" && (
        <Stage
          badge="Post-test"
          title="Last step — measure your growth"
          subtitle="You've finished all the lessons. Answer these to see your progress."
        >
          <AssessmentForm
            key={post.id}
            classId={cls.id}
            assessmentId={post.id}
            questions={snap.questions.filter((q) => q.assessmentId === post.id)}
            submitLabel="Finish & see results"
          />
        </Stage>
      )}

      {stage === "results" && (
        <PlayerResults
          snapshot={snap}
          preAttempt={attempts.find((a) => a.assessmentId === pre.id)!}
          postAttempt={attempts.find((a) => a.assessmentId === post.id)!}
          attempts={attempts}
        />
      )}
    </div>
  );
}

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = Math.round((completed / total) * 100);
  return (
    <div className="mt-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-brand-100">
        <div className="h-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-ink-500">
        {completed} of {total} steps complete
      </p>
    </div>
  );
}

function Stage({
  badge,
  title,
  subtitle,
  children,
}: {
  badge: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <span className="pill bg-accent-100 text-accent-700">{badge}</span>
        <h2 className="mt-2 text-lg font-bold text-brand-900">{title}</h2>
        {subtitle && <p className="text-sm text-ink-600">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
