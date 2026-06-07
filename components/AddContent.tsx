"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addContentBlockAction,
  attachCourseMediaAction,
  createCourseUploadUrlAction,
} from "@/lib/staff/actions";

type Tab = "text" | "video" | "image" | "link";
const MAX_BYTES = 100 * 1024 * 1024; // 100 MB — direct-to-storage, no serverless body limit

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "text", label: "Text", icon: "✍️" },
  { key: "video", label: "Upload video", icon: "🎬" },
  { key: "image", label: "Upload image", icon: "🖼️" },
  { key: "link", label: "Video link", icon: "🔗" },
];

function putWithProgress(url: string, file: File, onPct: (n: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onPct(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(file);
  });
}

export function AddContent({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const captionRef = useRef<HTMLInputElement>(null);

  function reset() {
    setTab(null);
    setFileName(null);
    setErr(null);
    setPct(0);
    if (fileRef.current) fileRef.current.value = "";
    if (captionRef.current) captionRef.current.value = "";
  }

  async function upload(kind: "video" | "image") {
    setErr(null);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setErr("Choose a file first.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setErr("That file is over 100 MB. Trim it, or paste a video link instead.");
      return;
    }
    setBusy(true);
    setPct(0);
    try {
      const signed = await createCourseUploadUrlAction({ courseId, lessonId, contentType: file.type });
      if (!signed.ok) {
        setErr(signed.error);
        setBusy(false);
        return;
      }
      await putWithProgress(signed.uploadUrl, file, setPct);
      await attachCourseMediaAction({
        courseId,
        lessonId,
        path: signed.path,
        kind,
        caption: captionRef.current?.value ?? "",
      });
      setBusy(false);
      reset();
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed. Please try again.");
      setBusy(false);
    }
  }

  const isUpload = tab === "video" || tab === "image";

  return (
    <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-2.5">
      {/* Tab chooser */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setErr(null);
              setFileName(null);
              setTab(tab === t.key ? null : t.key);
            }}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              tab === t.key
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-white text-ink-600 ring-1 ring-brand-100 hover:ring-brand-300"
            }`}
          >
            <span aria-hidden>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Text */}
      {tab === "text" && (
        <form action={addContentBlockAction} className="mt-2.5 space-y-1.5" onSubmit={() => setTimeout(reset, 0)}>
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="lessonId" value={lessonId} />
          <input type="hidden" name="type" value="rich_text" />
          <textarea
            name="text"
            className="input min-h-[80px] text-sm"
            placeholder="Write a paragraph for parents. Keep it concrete and home-based…"
          />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost py-1.5 text-xs" onClick={reset}>
              Cancel
            </button>
            <button className="btn-primary py-1.5 text-xs" type="submit">
              Add text
            </button>
          </div>
        </form>
      )}

      {/* Upload video / image */}
      {isUpload && (
        <div className="mt-2.5 space-y-2">
          <label
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
              fileName ? "border-brand-300 bg-white" : "border-brand-200 bg-white hover:border-brand-300"
            } ${busy ? "pointer-events-none opacity-60" : ""}`}
          >
            <span className="text-2xl" aria-hidden>
              {tab === "video" ? "🎬" : "🖼️"}
            </span>
            <span className="mt-1 text-sm font-semibold text-brand-800">
              {fileName ?? `Choose ${tab === "video" ? "a video" : "an image"} to upload`}
            </span>
            <span className="mt-0.5 text-xs text-ink-500">
              {tab === "video" ? "MP4, WebM or MOV · up to 100 MB" : "JPG, PNG, GIF or WebP"}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept={tab === "video" ? "video/*" : "image/*"}
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                setErr(null);
                setFileName(e.target.files?.[0]?.name ?? null);
              }}
            />
          </label>

          <input
            ref={captionRef}
            className="input py-1.5 text-sm"
            placeholder={tab === "video" ? "Caption (optional)" : "Alt text / caption (optional)"}
            disabled={busy}
          />

          {busy && (
            <div className="space-y-1">
              <div className="h-2 overflow-hidden rounded-full bg-brand-100">
                <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-ink-500">Uploading… {pct}%</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost py-1.5 text-xs" onClick={reset} disabled={busy}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary py-1.5 text-xs disabled:opacity-50"
              onClick={() => upload(tab as "video" | "image")}
              disabled={busy || !fileName}
            >
              {busy ? "Uploading…" : `Add ${tab}`}
            </button>
          </div>
        </div>
      )}

      {/* Video link (embed) */}
      {tab === "link" && (
        <form action={addContentBlockAction} className="mt-2.5 space-y-1.5" onSubmit={() => setTimeout(reset, 0)}>
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="lessonId" value={lessonId} />
          <input type="hidden" name="type" value="video" />
          <input name="url" className="input py-1.5 text-sm" placeholder="Paste a YouTube, Vimeo or Loom embed link" />
          <input name="alt" className="input py-1.5 text-sm" placeholder="Caption (optional)" />
          <p className="text-xs text-ink-500">Best for longer videos already hosted elsewhere.</p>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost py-1.5 text-xs" onClick={reset}>
              Cancel
            </button>
            <button className="btn-primary py-1.5 text-xs" type="submit">
              Add video link
            </button>
          </div>
        </form>
      )}

      {err && <p className="mt-2 rounded-lg bg-accent-50 px-2.5 py-1.5 text-xs text-accent-700">{err}</p>}
    </div>
  );
}
