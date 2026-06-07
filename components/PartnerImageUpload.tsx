"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPartnerUploadUrlAction, setPartnerImageAction } from "@/lib/admin/actions";
import { putWithProgress, downscaleImage } from "@/lib/uploadClient";

// Uploads a partner photo directly to storage (signed URL), optimizes it client-side,
// then attaches it to the partner. No URL pasting.
export function PartnerImageUpload({
  partnerId,
  name,
  currentSrc,
}: {
  partnerId: string;
  name: string;
  currentSrc?: string | null;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(currentSrc ?? null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setBusy(true);
    setPct(0);
    try {
      const blob = await downscaleImage(file);
      setPreview(URL.createObjectURL(blob));
      const signed = await createPartnerUploadUrlAction({ partnerId, contentType: blob.type || "image/jpeg" });
      if (!signed.ok) {
        setErr(signed.error);
        setBusy(false);
        return;
      }
      await putWithProgress(signed.uploadUrl, blob, setPct);
      await setPartnerImageAction({ partnerId, path: signed.path });
      setBusy(false);
      setPct(0);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="grid h-20 w-28 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-50 ring-1 ring-brand-100">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-2xl" aria-hidden>🏢</span>
        )}
      </div>
      <div className="min-w-0">
        <label className={`btn-ghost cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
          {busy ? `Uploading… ${pct}%` : preview ? "Change photo" : "Upload photo"}
          <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={onPick} />
        </label>
        {busy && (
          <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-brand-100">
            <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
        )}
        <p className="mt-1 text-xs text-ink-500">JPG, PNG or WebP — we optimize it for you.</p>
        {err && <p className="mt-1 text-xs text-accent-700">{err}</p>}
      </div>
    </div>
  );
}
