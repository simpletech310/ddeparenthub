// Client-side upload helpers shared by the course-content and partner-image uploaders.
// (Browser-only — these use XHR / canvas and are imported by "use client" components.)

// PUT a file/blob to a signed storage URL with progress callbacks.
export function putWithProgress(url: string, body: Blob, onPct: (n: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", body.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onPct(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(body);
  });
}

// Downscale/compress an image file to a JPEG blob (cover-fit within maxDim) so
// directory photos stay light and load fast. Falls back to the original on failure.
export async function downscaleImage(file: File, maxDim = 1600, quality = 0.85): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
    return blob ?? file;
  } catch {
    return file;
  }
}
