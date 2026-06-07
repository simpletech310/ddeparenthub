import Link from "next/link";
import type { Attempt, CourseSnapshot } from "@/lib/types";

export function PlayerResults({
  snapshot,
  preAttempt,
  postAttempt,
  attempts,
}: {
  snapshot: CourseSnapshot;
  preAttempt: Attempt;
  postAttempt: Attempt;
  attempts: Attempt[];
}) {
  const delta = postAttempt.score - preAttempt.score;
  const pct = (a: Attempt) => (a.maxScore ? Math.round((a.score / a.maxScore) * 100) : 0);

  const checks = snapshot.assessments.filter((a) => a.kind === "lesson_check");

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-6 text-center text-white">
        <p className="text-sm font-medium opacity-90">You finished the class 🎉</p>
        <p className="mt-3 text-4xl font-bold">
          {delta >= 0 ? "+" : ""}
          {delta}
        </p>
        <p className="text-sm opacity-90">point change, pre-test → post-test</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <p className="text-xs uppercase tracking-wide text-brand-500">Pre-test</p>
          <p className="text-2xl font-bold text-brand-900">{pct(preAttempt)}%</p>
          <p className="text-xs text-brand-500">
            {preAttempt.score}/{preAttempt.maxScore}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-xs uppercase tracking-wide text-brand-500">Post-test</p>
          <p className="text-2xl font-bold text-brand-900">{pct(postAttempt)}%</p>
          <p className="text-xs text-brand-500">
            {postAttempt.score}/{postAttempt.maxScore}
          </p>
        </div>
      </div>

      <section className="card">
        <h2 className="mb-2 font-semibold text-brand-900">Per-lesson checks</h2>
        <ul className="space-y-1.5">
          {checks.map((c) => {
            const lesson = snapshot.lessons.find((l) => l.id === c.lessonId);
            const a = attempts.find((x) => x.assessmentId === c.id);
            const passed = a && a.maxScore > 0 && a.score / a.maxScore >= 0.6;
            return (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <span className="text-brand-700">{lesson?.title ?? c.title}</span>
                <span className={`pill ${passed ? "bg-brand-50 text-brand-700" : "bg-accent-50 text-accent-700"}`}>
                  {a ? (passed ? "Passed" : "Review") : "—"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <Link href="/parent/track" className="btn-primary w-full">
        Track this at home →
      </Link>
      <Link href="/parent/learn" className="btn-ghost w-full">
        Back to classes
      </Link>
    </div>
  );
}
