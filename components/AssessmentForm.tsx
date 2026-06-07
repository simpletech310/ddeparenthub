"use client";

import { useMemo, useState } from "react";
import { submitAssessmentAction } from "@/lib/learn/actions";
import type { Question } from "@/lib/types";
import type { SubmittedAnswer } from "@/lib/grading";

export function AssessmentForm({
  classId,
  assessmentId,
  questions,
  submitLabel = "Submit",
}: {
  classId: string;
  assessmentId: string;
  questions: Question[];
  submitLabel?: string;
}) {
  // answers keyed by question id; ordering questions start in a deliberately non-correct order.
  const [answers, setAnswers] = useState<Record<string, number[] | string>>(() => {
    const init: Record<string, number[] | string> = {};
    for (const q of questions) {
      if (q.type === "ordering") {
        init[q.id] = q.options.map((_, i) => i).reverse(); // shuffled-ish, not the key
      } else if (q.type === "matching") {
        init[q.id] = q.options.map(() => -1); // unset
      }
    }
    return init;
  });

  const serialized = useMemo<SubmittedAnswer[]>(
    () => Object.entries(answers).map(([questionId, value]) => ({ questionId, value })),
    [answers]
  );

  const setSingle = (qid: string, idx: number) => setAnswers((a) => ({ ...a, [qid]: [idx] }));
  const toggleMulti = (qid: string, idx: number) =>
    setAnswers((a) => {
      const cur = (a[qid] as number[]) ?? [];
      return { ...a, [qid]: cur.includes(idx) ? cur.filter((x) => x !== idx) : [...cur, idx] };
    });
  const setText = (qid: string, v: string) => setAnswers((a) => ({ ...a, [qid]: v }));
  const move = (qid: string, from: number, dir: -1 | 1) =>
    setAnswers((a) => {
      const cur = [...((a[qid] as number[]) ?? [])];
      const to = from + dir;
      if (to < 0 || to >= cur.length) return a;
      [cur[from], cur[to]] = [cur[to], cur[from]];
      return { ...a, [qid]: cur };
    });
  const setMatch = (qid: string, leftIdx: number, rightIdx: number) =>
    setAnswers((a) => {
      const cur = [...((a[qid] as number[]) ?? [])];
      cur[leftIdx] = rightIdx;
      return { ...a, [qid]: cur };
    });

  const isAnswered = (q: Question): boolean => {
    const v = answers[q.id];
    if (q.type === "ordering") return Array.isArray(v) && v.length > 0;
    if (q.type === "matching") return Array.isArray(v) && v.length === q.options.length && v.every((x) => x >= 0);
    if (q.type === "short_text") return typeof v === "string" && v.trim().length > 0;
    return Array.isArray(v) && v.length > 0;
  };
  const allAnswered = questions.every(isAnswered);

  return (
    <form action={submitAssessmentAction} className="space-y-4">
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="assessmentId" value={assessmentId} />
      <input type="hidden" name="answers" value={JSON.stringify(serialized)} />

      {questions.map((q, i) => (
        <div key={q.id} className="card space-y-2">
          <p className="text-sm font-semibold text-brand-900">
            {i + 1}. {q.prompt}
          </p>

          {q.media && <QuestionMediaView media={q.media} />}

          {(q.type === "multiple_choice" || q.type === "true_false") && (
            <div className="space-y-1.5">
              {q.options.map((opt, idx) => (
                <label key={idx} className="flex items-center gap-2 text-sm text-brand-700">
                  <input type="radio" name={`q_${q.id}`} checked={((answers[q.id] as number[]) ?? [])[0] === idx} onChange={() => setSingle(q.id, idx)} />
                  {opt}
                </label>
              ))}
            </div>
          )}

          {q.type === "multi_select" && (
            <div className="space-y-1.5">
              {q.options.map((opt, idx) => (
                <label key={idx} className="flex items-center gap-2 text-sm text-brand-700">
                  <input type="checkbox" checked={((answers[q.id] as number[]) ?? []).includes(idx)} onChange={() => toggleMulti(q.id, idx)} />
                  {opt}
                </label>
              ))}
            </div>
          )}

          {q.type === "image_choice" && (
            <div className="grid grid-cols-2 gap-2">
              {q.options.map((opt, idx) => {
                const picked = ((answers[q.id] as number[]) ?? [])[0] === idx;
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setSingle(q.id, idx)}
                    className={`rounded-xl border-2 p-2 text-left ${picked ? "border-brand-500 bg-brand-50" : "border-brand-100"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={q.optionImages?.[idx] ?? ""} alt={opt} className="mb-1 aspect-video w-full rounded-lg object-cover" />
                    <span className="text-xs text-brand-700">{opt}</span>
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "likert" && (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="flex flex-col items-center text-xs text-ink-600">
                  <input type="radio" name={`q_${q.id}`} checked={((answers[q.id] as number[]) ?? [])[0] === n} onChange={() => setSingle(q.id, n)} />
                  {n}
                </label>
              ))}
            </div>
          )}

          {q.type === "short_text" && (
            <input className="input" value={(answers[q.id] as string) ?? ""} onChange={(e) => setText(q.id, e.target.value)} placeholder="Type your answer" />
          )}

          {q.type === "ordering" && (
            <ol className="space-y-1.5">
              {((answers[q.id] as number[]) ?? []).map((origIdx, pos) => (
                <li key={origIdx} className="flex items-center gap-2 rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm text-brand-800">
                  <span className="font-semibold text-ink-400">{pos + 1}.</span>
                  <span className="flex-1">{q.options[origIdx]}</span>
                  <button type="button" onClick={() => move(q.id, pos, -1)} disabled={pos === 0} className="rounded px-2 py-0.5 text-ink-500 disabled:opacity-30" aria-label="Move up">↑</button>
                  <button type="button" onClick={() => move(q.id, pos, 1)} disabled={pos === q.options.length - 1} className="rounded px-2 py-0.5 text-ink-500 disabled:opacity-30" aria-label="Move down">↓</button>
                </li>
              ))}
            </ol>
          )}

          {q.type === "matching" && (
            <div className="space-y-2">
              {q.options.map((left, leftIdx) => (
                <div key={leftIdx} className="flex items-center gap-2">
                  <span className="flex-1 text-sm text-brand-800">{left}</span>
                  <span className="text-ink-400">→</span>
                  <select
                    className="input flex-1"
                    value={((answers[q.id] as number[]) ?? [])[leftIdx] ?? -1}
                    onChange={(e) => setMatch(q.id, leftIdx, Number(e.target.value))}
                  >
                    <option value={-1}>Choose…</option>
                    {(q.rightOptions ?? []).map((right, rightIdx) => (
                      <option key={rightIdx} value={rightIdx}>{right}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <button className="btn-primary w-full" type="submit" disabled={!allAnswered}>
        {allAnswered ? submitLabel : "Answer all questions to continue"}
      </button>
    </form>
  );
}

function QuestionMediaView({ media }: { media: NonNullable<Question["media"]> }) {
  if (media.type === "video") {
    return (
      <div className="overflow-hidden rounded-xl bg-black">
        <div className="aspect-video">
          <iframe src={media.url} className="h-full w-full" allowFullScreen />
        </div>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={media.url} alt={media.alt ?? ""} className="rounded-xl" />;
}
