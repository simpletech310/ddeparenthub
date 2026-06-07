"use client";

import { useRef, useState } from "react";
import { Avatar } from "./Avatar";

// Resize/crop an image file to a square JPEG data URL, client-side, so stored
// avatars stay small. Returns a ~256px cover-cropped data URL.
async function fileToAvatarDataUrl(file: File, dim = 256): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = dim;
  canvas.height = dim;
  const ctx = canvas.getContext("2d")!;
  // cover-crop to square
  const scale = Math.max(dim / bitmap.width, dim / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (dim - w) / 2, (dim - h) / 2, w, h);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function AvatarUpload({
  name,
  currentSrc,
  action,
  hiddenFields,
  label = "Update photo",
}: {
  name: string;
  currentSrc?: string | null;
  action: (formData: FormData) => void | Promise<void>;
  hiddenFields?: Record<string, string>;
  label?: string;
}) {
  const [preview, setPreview] = useState<string | null>(currentSrc ?? null);
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setPreview(dataUrl);
      // set hidden field then submit
      const input = formRef.current?.elements.namedItem("avatarUrl") as HTMLInputElement | null;
      if (input) input.value = dataUrl;
      formRef.current?.requestSubmit();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} action={action} className="flex items-center gap-4">
      {hiddenFields &&
        Object.entries(hiddenFields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <input type="hidden" name="avatarUrl" defaultValue={preview ?? ""} />
      <Avatar name={name} src={preview} size="xl" ring />
      <label className="btn-ghost cursor-pointer">
        {busy ? "Uploading…" : label}
        <input type="file" accept="image/*" className="hidden" onChange={onPick} disabled={busy} />
      </label>
    </form>
  );
}
