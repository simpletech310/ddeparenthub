import { requireRole } from "@/lib/auth/session";
import { createBlankCourseAction, generateCourseAction } from "@/lib/staff/actions";

export default async function NewCoursePage() {
  await requireRole("staff");
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-900">Create a course</h1>
        <p className="text-sm text-brand-600">
          Generate a complete, ready-to-teach draft with AI, or start from a blank course and build it
          yourself. Either way you can edit everything before publishing.
        </p>
      </div>

      {/* Start from scratch */}
      <form action={createBlankCourseAction} className="card flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-brand-900">Start from scratch</h2>
          <p className="text-sm text-brand-600">A blank course with a starter lesson, pre-test, and post-test.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <input name="title" className="input w-36" placeholder="Course title" />
          <button className="btn-ghost" type="submit">Create</button>
        </div>
      </form>

      <div className="text-center text-xs font-medium uppercase tracking-wide text-brand-400">or generate with AI</div>

      <form action={generateCourseAction} className="card space-y-4">
        <div>
          <label className="label" htmlFor="title">
            Course name
          </label>
          <input id="title" name="title" className="input" required placeholder="Toilet Training at Home" />
        </div>
        <div>
          <label className="label" htmlFor="description">
            Short description
          </label>
          <textarea
            id="description"
            name="description"
            className="input min-h-[70px]"
            placeholder="Help parents start toilet training using ABA steps and reinforcement."
          />
        </div>
        <div>
          <label className="label" htmlFor="outcomes">
            Target outcomes / goals
          </label>
          <textarea
            id="outcomes"
            name="outcomes"
            className="input min-h-[70px]"
            placeholder="Parents can set a schedule, prompt, and reinforce successes."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="audience">
              Intended audience
            </label>
            <input id="audience" name="audience" className="input" placeholder="Parents of toddlers" />
          </div>
          <div>
            <label className="label" htmlFor="lessonCount">
              Number of lessons
            </label>
            <input
              id="lessonCount"
              name="lessonCount"
              type="number"
              min={1}
              max={6}
              defaultValue={3}
              className="input"
            />
          </div>
        </div>
        <button className="btn-primary w-full" type="submit">
          ✨ Generate editable draft
        </button>
        <p className="text-center text-xs text-brand-500">
          Prototype note: generation is stubbed and returns a structured draft instantly.
        </p>
      </form>
    </div>
  );
}
