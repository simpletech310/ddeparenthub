"use client";

import { useState } from "react";
import type { ContentBlock } from "@/lib/types";

export function LessonContent({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((b) => (
        <Block key={b.id} block={b} />
      ))}
    </div>
  );
}

function Block({ block }: { block: ContentBlock }) {
  const p = block.payload as Record<string, any>;
  switch (block.type) {
    case "rich_text":
      return (
        <div
          className="prose-sm text-sm leading-relaxed text-brand-800 [&_strong]:text-brand-900"
          dangerouslySetInnerHTML={{ __html: String(p.html ?? "") }}
        />
      );
    case "video":
      return (
        <div className="overflow-hidden rounded-xl bg-black">
          <div className="aspect-video">
            <iframe
              src={String(p.url ?? "")}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      );
    case "image":
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={String(p.url ?? "")} alt={String(p.alt ?? "")} className="rounded-xl" />;
    case "slideshow":
      return <Slideshow images={(p.images as { url: string; alt?: string }[]) ?? []} />;
    case "embedded_question":
      return (
        <EmbeddedQuestion
          prompt={String(p.prompt ?? "")}
          options={(p.options as string[]) ?? []}
          answerIndex={Number(p.answerIndex ?? 0)}
        />
      );
    default:
      return null;
  }
}

function Slideshow({ images }: { images: { url: string; alt?: string }[] }) {
  const [i, setI] = useState(0);
  if (!images.length) return null;
  return (
    <div className="rounded-xl border border-brand-100 p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[i].url} alt={images[i].alt ?? ""} className="mx-auto rounded-lg" />
      <div className="mt-2 flex items-center justify-between text-xs text-ink-600">
        <button onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0} className="btn-ghost">
          ‹ Prev
        </button>
        <span>
          {i + 1} / {images.length}
        </span>
        <button
          onClick={() => setI((x) => Math.min(images.length - 1, x + 1))}
          disabled={i === images.length - 1}
          className="btn-ghost"
        >
          Next ›
        </button>
      </div>
    </div>
  );
}

function EmbeddedQuestion({
  prompt,
  options,
  answerIndex,
}: {
  prompt: string;
  options: string[];
  answerIndex: number;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-3">
      <p className="text-sm font-medium text-brand-900">Quick check: {prompt}</p>
      <div className="mt-2 space-y-1.5">
        {options.map((o, idx) => {
          const isPicked = picked === idx;
          const correct = idx === answerIndex;
          return (
            <button
              key={idx}
              onClick={() => setPicked(idx)}
              className={`block w-full rounded-lg border px-3 py-1.5 text-left text-sm ${
                picked === null
                  ? "border-brand-200 bg-white text-brand-700 hover:border-brand-300"
                  : isPicked && correct
                  ? "border-brand-500 bg-brand-100 text-brand-800"
                  : isPicked
                  ? "border-accent-300 bg-accent-50 text-accent-700"
                  : correct
                  ? "border-brand-400 bg-brand-50 text-brand-700"
                  : "border-brand-100 bg-white text-ink-400"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <p className="mt-2 text-xs font-medium text-ink-600">
          {picked === answerIndex ? "Correct! 🎉 (not graded)" : "Not quite — review above. (not graded)"}
        </p>
      )}
    </div>
  );
}
