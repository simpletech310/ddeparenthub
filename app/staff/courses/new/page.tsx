import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createBlankCourseAction, generateCourseAction } from "@/lib/staff/actions";
import { PageHeader } from "@/components/PageHeader";

export default async function NewCoursePage() {
  await requireRole("staff");
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        backHref="/staff"
        backLabel="Dashboard"
        eyebrow="New course"
        title="Create a course"
        subtitle="Start with an AI-generated draft, or a blank course. You can edit, add videos, and reorder everything before publishing."
      />

      {/* Primary path: generate with AI */}
      <form action={generateCourseAction} className="card space-y-4 border-brand-100">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-100 text-lg">✨</span>
          <div>
            <h2 className="font-display font-bold text-brand-900">Generate with AI</h2>
            <p className="text-xs text-ink-500">A complete, editable ABA draft — lessons, a pre-test, and a post-test.</p>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="title">Course name</label>
          <input id="title" name="title" className="input" required placeholder="Toilet Training at Home" />
        </div>
        <div>
          <label className="label" htmlFor="description">Short description</label>
          <textarea
            id="description"
            name="description"
            className="input min-h-[70px]"
            placeholder="Help parents start toilet training using ABA steps and reinforcement."
          />
        </div>
        <div>
          <label className="label" htmlFor="outcomes">Target outcomes / goals</label>
          <textarea
            id="outcomes"
            name="outcomes"
            className="input min-h-[70px]"
            placeholder="Parents can set a schedule, prompt, and reinforce successes."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="audience">Intended audience</label>
            <input id="audience" name="audience" className="input" placeholder="Parents of toddlers" />
          </div>
          <div>
            <label className="label" htmlFor="lessonCount">Number of lessons</label>
            <input id="lessonCount" name="lessonCount" type="number" min={1} max={6} defaultValue={3} className="input" />
          </div>
        </div>
        <button className="btn-primary w-full" type="submit">✨ Generate editable draft</button>
        <p className="text-center text-xs text-ink-500">
          The draft is yours to refine — nothing is published until you choose to.
        </p>
      </form>

      <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-ink-400">
        <span className="h-px flex-1 bg-brand-100" />
        or build it yourself
        <span className="h-px flex-1 bg-brand-100" />
      </div>

      {/* Secondary path: blank */}
      <form action={createBlankCourseAction} className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-brand-900">Start from scratch</h2>
          <p className="text-sm text-ink-600">A blank course with a starter lesson, pre-test, and post-test.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <input name="title" className="input w-40" placeholder="Course title" />
          <button className="btn-ghost" type="submit">Create</button>
        </div>
      </form>

      <p className="text-center text-xs text-ink-500">
        Prefer to reuse something proven? Browse the{" "}
        <Link href="/staff/templates" className="font-medium text-brand-700 underline">template library</Link>.
      </p>
    </div>
  );
}
