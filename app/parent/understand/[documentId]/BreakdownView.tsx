"use client";

import { useState } from "react";
import type { BreakdownPayload } from "@/lib/types";

export function BreakdownView({
  payload,
  docType,
}: {
  payload: BreakdownPayload;
  docType: "iep" | "triennial";
}) {
  const [lang, setLang] = useState<"en" | "es">("en");

  return (
    <div className="space-y-5">
      {/* Persistent disclaimer (§5.4 / §13) */}
      <div className="rounded-xl border border-accent-200 bg-accent-50 p-3 text-xs text-accent-800">
        {payload.disclaimer}
      </div>

      {/* Language toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-brand-600">Language:</span>
        <div className="inline-flex overflow-hidden rounded-lg border border-brand-200 text-xs">
          {(["en", "es"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1 font-medium ${
                lang === l ? "bg-brand-600 text-white" : "bg-white text-brand-600"
              }`}
            >
              {l === "en" ? "English" : "Español"}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-brand-400">Original text is never translated.</span>
      </div>

      {/* Summary */}
      <section className="card">
        <h2 className="mb-1 font-semibold text-brand-900">Plain-language summary</h2>
        <p className="text-sm leading-relaxed text-brand-700">{payload.summary[lang]}</p>
      </section>

      {/* Key dates */}
      {payload.keyDates.length > 0 && (
        <section className="card">
          <h2 className="mb-2 font-semibold text-brand-900">Key dates</h2>
          <ul className="space-y-1.5">
            {payload.keyDates.map((d, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-brand-700">{d.label}</span>
                <span className="pill bg-brand-50 text-brand-700">
                  {new Date(d.date).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recommended supports render below the breakdown (see the document page). */}

      {/* Three-layer item cards */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          {docType === "iep" ? "Goals, services & accommodations" : "Assessments & findings"}
        </h2>
        {payload.items.map((item) => (
          <ItemCard key={item.id} item={item} lang={lang} />
        ))}
      </section>

      {/* Questions to ask */}
      {payload.questionsToAsk.length > 0 && (
        <section className="card">
          <h2 className="mb-2 font-semibold text-brand-900">
            Questions to ask your {docType === "iep" ? "IEP team" : "evaluator"}
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-brand-700">
            {payload.questionsToAsk.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ItemCard({
  item,
  lang,
}: {
  item: BreakdownPayload["items"][number];
  lang: "en" | "es";
}) {
  const [showOriginal, setShowOriginal] = useState(false);
  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="pill bg-brand-100 text-brand-700">{item.category}</span>
        {item.confidence === "low" && (
          <span className="pill bg-accent-100 text-accent-700">⚠ Please verify</span>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
          What it means
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-brand-800">
          {item.whatItMeans[lang]}
        </p>
      </div>

      <div className="rounded-xl bg-brand-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          What you can do at home
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-brand-800">
          {item.whatYouCanDo[lang]}
        </p>
      </div>

      <div>
        <button
          onClick={() => setShowOriginal((s) => !s)}
          className="text-xs font-medium text-brand-600 underline"
        >
          {showOriginal ? "Hide original text" : "Show original text"}
        </button>
        {showOriginal && (
          <blockquote className="mt-2 border-l-2 border-brand-300 pl-3 text-xs italic text-brand-600">
            “{item.whatItSays}”
          </blockquote>
        )}
      </div>

      {item.confidence === "low" && (
        <p className="text-xs text-accent-700">
          I'm not fully certain I read this correctly — please confirm with your team.
        </p>
      )}
    </div>
  );
}
