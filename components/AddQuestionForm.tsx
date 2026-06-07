"use client";

import { useState } from "react";
import { addQuestionAction } from "@/lib/staff/actions";

// Type-aware "add question" form for lesson checks and pre/post tests.
export function AddQuestionForm({
  courseId,
  target,
}: {
  courseId: string;
  target: string; // "lesson:<id>" | "pretest" | "posttest"
}) {
  const [type, setType] = useState<"true_false" | "multiple_choice" | "multi_select" | "short_text">("true_false");

  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-xs font-medium text-ink-600">+ Add question</summary>
      <form action={addQuestionAction} className="mt-2 space-y-2 rounded-lg bg-brand-50 p-2">
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="target" value={target} />
        <select name="type" value={type} onChange={(e) => setType(e.target.value as typeof type)} className="input py-1.5 text-xs">
          <option value="true_false">True / False</option>
          <option value="multiple_choice">Multiple choice (one answer)</option>
          <option value="multi_select">Multi-select (several answers)</option>
          <option value="short_text">Short answer</option>
        </select>
        <input name="prompt" className="input py-1.5 text-xs" placeholder="Question prompt" required />

        {type === "true_false" && (
          <select name="correct" className="input py-1.5 text-xs">
            <option value="true">Answer: True</option>
            <option value="false">Answer: False</option>
          </select>
        )}

        {type === "multiple_choice" && (
          <>
            <textarea name="options" className="input min-h-[60px] py-1.5 text-xs" placeholder="One option per line" />
            <input name="correctIndex" type="number" min={0} defaultValue={0} className="input py-1.5 text-xs" placeholder="Correct option # (0 = first)" />
          </>
        )}

        {type === "multi_select" && (
          <>
            <textarea name="options" className="input min-h-[60px] py-1.5 text-xs" placeholder="One option per line" />
            <input name="correctIndexes" className="input py-1.5 text-xs" placeholder="Correct option #s, comma-separated (e.g. 0,2)" />
          </>
        )}

        {type === "short_text" && (
          <input name="keywords" className="input py-1.5 text-xs" placeholder="Accepted keywords (comma-separated)" />
        )}

        <button className="btn-ghost py-1.5 text-xs" type="submit">Add question</button>
      </form>
    </details>
  );
}
