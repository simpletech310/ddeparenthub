import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getCourseSnapshot } from "@/lib/data/repos";
import { LessonContent } from "@/components/LessonContent";
import type { Question } from "@/lib/types";

// Read-only "preview as parent" — staff see exactly what a parent will experience.
export default async function CoursePreview({ params }: { params: { courseId: string } }) {
  await requireRole("staff");
  const snap = await getCourseSnapshot(params.courseId);
  if (!snap) notFound();
  const { course, lessons, contentBlocks, assessments, questions } = snap;
  const pre = assessments.find((a) => a.kind === "pretest");
  const post = assessments.find((a) => a.kind === "posttest");

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/staff/courses/${course.id}`} className="text-sm text-brand-600">← Editor</Link>
        <h1 className="mt-1 text-xl font-bold text-brand-900">{course.title}</h1>
        <p className="text-sm text-brand-600">{course.description}</p>
        <p className="mt-1 text-xs text-brand-400">Preview — this is the parent's view.</p>
      </div>

      <QuizPreview title="Pre-test" questions={pre ? questions.filter((q) => q.assessmentId === pre.id) : []} />

      {lessons.map((l, i) => {
        const blocks = contentBlocks.filter((b) => b.lessonId === l.id);
        const check = assessments.find((a) => a.kind === "lesson_check" && a.lessonId === l.id);
        const checkQs = check ? questions.filter((q) => q.assessmentId === check.id) : [];
        return (
          <section key={l.id} className="card space-y-3">
            <span className="pill bg-accent-100 text-accent-700">Lesson {i + 1}</span>
            <h2 className="text-lg font-bold text-brand-900">{l.title.replace(/^Lesson \d+:\s*/, "")}</h2>
            {blocks.length ? <LessonContent blocks={blocks} /> : <p className="text-sm text-accent-600">⚠ No content yet.</p>}
            {checkQs.length > 0 && (
              <div className="mt-2">
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">Lesson check</h3>
                <QuizList questions={checkQs} />
              </div>
            )}
          </section>
        );
      })}

      <QuizPreview title="Post-test" questions={post ? questions.filter((q) => q.assessmentId === post.id) : []} />
    </div>
  );
}

function QuizPreview({ title, questions }: { title: string; questions: Question[] }) {
  return (
    <section className="card">
      <h2 className="mb-2 font-semibold text-brand-900">{title}</h2>
      <QuizList questions={questions} />
    </section>
  );
}

function QuizList({ questions }: { questions: Question[] }) {
  if (!questions.length) return <p className="text-sm text-brand-400">No questions.</p>;
  return (
    <ol className="space-y-2">
      {questions.map((q, i) => (
        <li key={q.id} className="text-sm">
          <p className="font-medium text-brand-800">{i + 1}. {q.prompt}</p>
          {q.options.length > 0 && (
            <ul className="mt-1 space-y-0.5 pl-4 text-brand-600">
              {q.options.map((o, oi) => {
                const correct = Array.isArray(q.answerKey) && (q.answerKey as number[]).includes(oi);
                return (
                  <li key={oi} className={correct && q.scored ? "font-medium text-brand-700" : ""}>
                    {correct && q.scored ? "✓ " : "• "}{o}
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}
