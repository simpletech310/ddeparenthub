import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { courseReadiness, getCourseSnapshot } from "@/lib/data/repos";
import {
  addLessonAction,
  deleteContentBlockAction,
  deleteLessonAction,
  deleteQuestionAction,
  moveContentBlockAction,
  moveLessonAction,
  publishCourseAction,
  publishTemplateAction,
  unpublishCourseAction,
  updateCourseMetaAction,
  updateLessonAction,
  updateRichTextAction,
} from "@/lib/staff/actions";
import { LaunchEventForm } from "@/components/LaunchEventForm";
import { AddQuestionForm } from "@/components/AddQuestionForm";
import { AddContent } from "@/components/AddContent";
import { LessonContent } from "@/components/LessonContent";
import type { Assessment, Question } from "@/lib/types";

function htmlToText(html: string): string {
  return html
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export default async function CourseEditor({
  params,
  searchParams,
}: {
  params: { courseId: string };
  searchParams: { error?: string };
}) {
  const user = await requireRole("staff");
  const snap = await getCourseSnapshot(params.courseId);
  if (!snap) notFound();
  const { course, lessons, contentBlocks, assessments, questions } = snap;
  const owns = course.ownerStaffId === user.id;
  const ready = await courseReadiness(course.id);
  const pre = assessments.find((a) => a.kind === "pretest");
  const post = assessments.find((a) => a.kind === "posttest");

  const cid = course.id;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/staff" className="text-sm text-ink-600">← Dashboard</Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-brand-900">{course.title}</h1>
          <span className={`pill ${course.status === "published" ? "bg-brand-50 text-brand-700" : "bg-accent-50 text-accent-700"}`}>{course.status}</span>
          {course.isTemplate && <span className="pill bg-brand-100 text-brand-700">Template</span>}
          <Link href={`/staff/courses/${cid}/preview`} className="ml-auto btn-ghost py-1.5 text-xs">Preview as parent</Link>
        </div>
      </div>

      {searchParams.error === "not-ready" && (
        <p className="rounded-xl bg-accent-50 p-3 text-sm text-accent-700">
          This course isn't ready to publish yet — finish the checklist below first.
        </p>
      )}

      {/* Readiness checklist */}
      <section className="card">
        <h2 className="mb-2 font-semibold text-brand-900">Readiness</h2>
        <ul className="space-y-1 text-sm">
          <Check ok={ready.hasPretest} label="Has a pre-test" />
          <Check ok={ready.hasPosttest} label="Has a post-test" />
          <Check ok={ready.lessonCount >= 1} label="Has at least one lesson" />
          <Check ok={ready.lessonsMissingContent.length === 0} label={ready.lessonsMissingContent.length ? `Add content to: ${ready.lessonsMissingContent.join(", ")}` : "Every lesson has content"} />
          <Check ok={ready.lessonsMissingCheck.length === 0} label={ready.lessonsMissingCheck.length ? `Add a check question to: ${ready.lessonsMissingCheck.join(", ")}` : "Every lesson has a check question"} />
        </ul>
        {ready.ready ? (
          <p className="mt-2 text-xs font-medium text-brand-700">✓ Ready to publish.</p>
        ) : (
          <p className="mt-2 text-xs text-accent-700">Finish the items above to publish.</p>
        )}
      </section>

      {owns && (
        <>
          {/* Course details */}
          <details className="card" open={course.status === "draft"}>
            <summary className="cursor-pointer font-semibold text-brand-900">Course details</summary>
            <form action={updateCourseMetaAction} className="mt-3 space-y-3">
              <input type="hidden" name="courseId" value={cid} />
              <div><label className="label">Title</label><input name="title" className="input" defaultValue={course.title} /></div>
              <div><label className="label">Description</label><textarea name="description" className="input min-h-[60px]" defaultValue={course.description} /></div>
              <div><label className="label">Outcomes</label><textarea name="outcomes" className="input min-h-[60px]" defaultValue={course.outcomes} /></div>
              <div><label className="label">Teacher instructions</label><textarea name="teacherInstructions" className="input min-h-[60px]" defaultValue={course.teacherInstructions} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Category</label><input name="category" className="input" defaultValue={course.category} /></div>
                <div><label className="label">Estimated time</label><input name="estimatedDuration" className="input" defaultValue={course.estimatedDuration} /></div>
              </div>
              <div><label className="label">Tags (comma)</label><input name="tags" className="input" defaultValue={course.tags.join(", ")} placeholder="communication, social, group_work" /></div>
              <div><label className="label">Cover image URL</label><input name="coverImage" className="input" defaultValue={course.coverImage ?? ""} /></div>
              <button className="btn-primary w-full" type="submit">Save details</button>
            </form>
          </details>

          {/* Pre-test */}
          <AssessmentEditor title="Pre-test" courseId={cid} assessment={pre} questions={questions} target="pretest" />

          {/* Lessons */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-600">Lessons</h2>
              <form action={addLessonAction}>
                <input type="hidden" name="courseId" value={cid} />
                <button className="btn-ghost py-1.5 text-xs" type="submit">+ Add lesson</button>
              </form>
            </div>

            {lessons.map((l, i) => {
              const blocks = contentBlocks.filter((b) => b.lessonId === l.id).sort((a, b) => a.orderIndex - b.orderIndex);
              const check = assessments.find((a) => a.kind === "lesson_check" && a.lessonId === l.id);
              return (
                <div key={l.id} className="card space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="pill bg-brand-100 text-brand-700">Lesson {i + 1}</span>
                    <div className="flex items-center gap-1">
                      <MoveBtns courseId={cid} action={moveLessonAction} idField="lessonId" idValue={l.id} disablePrev={i === 0} disableNext={i === lessons.length - 1} />
                      <form action={deleteLessonAction}>
                        <input type="hidden" name="courseId" value={cid} />
                        <input type="hidden" name="lessonId" value={l.id} />
                        <button className="rounded px-2 py-0.5 text-xs font-medium text-accent-600" type="submit">Delete</button>
                      </form>
                    </div>
                  </div>

                  <form action={updateLessonAction} className="space-y-2">
                    <input type="hidden" name="courseId" value={cid} />
                    <input type="hidden" name="lessonId" value={l.id} />
                    <input name="title" className="input font-semibold" defaultValue={l.title} />
                    <input name="teacherInstructions" className="input text-sm" defaultValue={l.teacherInstructions} placeholder="Teacher instructions (optional)" />
                    <button className="btn-ghost py-1.5 text-xs" type="submit">Save lesson</button>
                  </form>

                  {/* Content blocks */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Content</p>
                    {blocks.length === 0 && (
                      <p className="rounded-lg bg-brand-50/60 px-3 py-2 text-xs text-ink-500">
                        No content yet — add a paragraph or a video below.
                      </p>
                    )}
                    {blocks.map((b, bi) => (
                      <div key={b.id} className="rounded-xl border border-brand-100 bg-white p-2.5">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-600">
                            {blockIcon(b.type, b.payload)} {blockLabel(b.type, b.payload)}
                          </span>
                          <div className="flex items-center gap-1">
                            <MoveBtns courseId={cid} action={moveContentBlockAction} idField="blockId" idValue={b.id} extra={{ lessonId: l.id }} disablePrev={bi === 0} disableNext={bi === blocks.length - 1} />
                            <form action={deleteContentBlockAction}>
                              <input type="hidden" name="courseId" value={cid} />
                              <input type="hidden" name="blockId" value={b.id} />
                              <button className="rounded px-2 py-0.5 text-xs text-accent-600" type="submit" aria-label="Delete content block">✕</button>
                            </form>
                          </div>
                        </div>
                        {b.type === "rich_text" ? (
                          <form action={updateRichTextAction}>
                            <input type="hidden" name="courseId" value={cid} />
                            <input type="hidden" name="blockId" value={b.id} />
                            <textarea name="text" className="input min-h-[70px] text-sm" defaultValue={htmlToText(String((b.payload as any).html ?? ""))} />
                            <button className="btn-ghost mt-1 py-1 text-xs" type="submit">Save text</button>
                          </form>
                        ) : (
                          <LessonContent blocks={[b]} />
                        )}
                      </div>
                    ))}

                    {/* Add content */}
                    <AddContent courseId={cid} lessonId={l.id} />
                  </div>

                  {/* Lesson check */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Lesson check</p>
                    <QuestionList courseId={cid} questions={check ? questions.filter((q) => q.assessmentId === check.id) : []} />
                    <AddQuestionForm courseId={cid} target={`lesson:${l.id}`} />
                  </div>
                </div>
              );
            })}
          </section>

          {/* Post-test */}
          <AssessmentEditor title="Post-test" courseId={cid} assessment={post} questions={questions} target="posttest" />

          {/* Publish + launch */}
          <section className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {course.status !== "published" ? (
                <form action={publishCourseAction}>
                  <input type="hidden" name="courseId" value={cid} />
                  <button className="btn-primary disabled:opacity-50" type="submit" disabled={!ready.ready}>Publish</button>
                </form>
              ) : (
                <form action={unpublishCourseAction}>
                  <input type="hidden" name="courseId" value={cid} />
                  <button className="btn-ghost" type="submit">Unpublish</button>
                </form>
              )}
              {!course.isTemplate && ready.ready && (
                <form action={publishTemplateAction}>
                  <input type="hidden" name="courseId" value={cid} />
                  <button className="btn-ghost" type="submit">Publish to template library</button>
                </form>
              )}
            </div>

            {ready.ready && <LaunchEventForm courseId={cid} defaultTitle={`${course.title} — Cohort`} />}
          </section>
        </>
      )}
    </div>
  );
}

function blockIcon(type: string, payload: Record<string, unknown>): string {
  if (type === "video") return (payload as any).uploaded ? "🎬" : "🔗";
  if (type === "image") return "🖼️";
  if (type === "slideshow") return "🖼️";
  return "✍️";
}

function blockLabel(type: string, payload: Record<string, unknown>): string {
  if (type === "rich_text") return "Text";
  if (type === "video") return (payload as any).uploaded ? "Uploaded video" : "Video link";
  if (type === "image") return "Image";
  if (type === "slideshow") return "Slideshow";
  return type.replace(/_/g, " ");
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-start gap-2 ${ok ? "text-brand-700" : "text-accent-700"}`}>
      <span>{ok ? "✓" : "○"}</span>
      <span>{label}</span>
    </li>
  );
}

function MoveBtns({
  courseId, action, idField, idValue, extra, disablePrev, disableNext,
}: {
  courseId: string;
  action: (fd: FormData) => void;
  idField: string;
  idValue: string;
  extra?: Record<string, string>;
  disablePrev: boolean;
  disableNext: boolean;
}) {
  return (
    <>
      {([-1, 1] as const).map((dir) => (
        <form action={action} key={dir}>
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name={idField} value={idValue} />
          {extra && Object.entries(extra).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <input type="hidden" name="dir" value={dir} />
          <button className="rounded px-1.5 py-0.5 text-xs text-ink-500 disabled:opacity-30" type="submit" disabled={dir === -1 ? disablePrev : disableNext}>
            {dir === -1 ? "↑" : "↓"}
          </button>
        </form>
      ))}
    </>
  );
}

function QuestionList({ courseId, questions }: { courseId: string; questions: Question[] }) {
  if (!questions.length) return <p className="text-xs text-ink-400">No questions yet.</p>;
  return (
    <ul className="space-y-1">
      {questions.map((q) => (
        <li key={q.id} className="flex items-start justify-between gap-2 rounded-lg bg-brand-50 px-2 py-1.5">
          <div>
            <p className="text-sm text-brand-800">{q.prompt}</p>
            <p className="text-[10px] uppercase tracking-wide text-ink-400">{q.type.replace(/_/g, " ")}{q.scored ? "" : " · unscored"}</p>
          </div>
          <form action={deleteQuestionAction}>
            <input type="hidden" name="courseId" value={courseId} />
            <input type="hidden" name="questionId" value={q.id} />
            <button className="text-xs text-accent-600" type="submit">✕</button>
          </form>
        </li>
      ))}
    </ul>
  );
}

function AssessmentEditor({
  title, courseId, assessment, questions, target,
}: {
  title: string;
  courseId: string;
  assessment: Assessment | undefined;
  questions: Question[];
  target: "pretest" | "posttest";
}) {
  const qs = assessment ? questions.filter((q) => q.assessmentId === assessment.id) : [];
  return (
    <section className="card">
      <h2 className="mb-2 font-semibold text-brand-900">{title}</h2>
      <QuestionList courseId={courseId} questions={qs} />
      <AddQuestionForm courseId={courseId} target={target} />
    </section>
  );
}
