import "server-only";

// Minimal Supabase Storage client over the REST API (plain fetch — avoids the
// supabase-js realtime/WebSocket dependency, and is serverless-friendly).
// Used by the JSON-document store (lib/data/store.ts).

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const STATE_BUCKET = "app-state";
export const STATE_PATH = "db.json";

function headers(extra?: Record<string, string>) {
  return { Authorization: `Bearer ${KEY}`, apikey: KEY ?? "", ...(extra ?? {}) };
}

export function storageConfigured(): boolean {
  return !!(URL && KEY);
}

// Download the state blob. Returns null if it doesn't exist yet.
export async function downloadState(): Promise<string | null> {
  const res = await fetch(`${URL}/storage/v1/object/${STATE_BUCKET}/${STATE_PATH}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) throw new Error(`state download failed: ${res.status}`);
  return res.text();
}

// Upsert the state blob.
export async function uploadState(json: string): Promise<void> {
  const res = await fetch(`${URL}/storage/v1/object/${STATE_BUCKET}/${STATE_PATH}`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json", "x-upsert": "true" }),
    body: json,
  });
  if (!res.ok) throw new Error(`state upload failed: ${res.status} ${await res.text()}`);
}

// Upload an arbitrary media object (image/video) to a per-family path; returns its public-ish
// signed-read path. For the MVP we keep media in the same private bucket and return a data ref.
export async function uploadMedia(path: string, bytes: ArrayBuffer, contentType: string): Promise<string> {
  const res = await fetch(`${URL}/storage/v1/object/${STATE_BUCKET}/${path}`, {
    method: "POST",
    headers: headers({ "Content-Type": contentType, "x-upsert": "true" }),
    body: bytes,
  });
  if (!res.ok) throw new Error(`media upload failed: ${res.status}`);
  return path;
}

// Create a one-time signed upload URL for a media object. The browser uploads the file
// directly to Supabase Storage with this URL, bypassing the serverless request-body limit
// (Vercel caps function bodies at ~4.5MB, which is far too small for video). Returns the
// absolute URL to PUT the file to.
export async function createSignedUploadUrl(path: string): Promise<string> {
  const res = await fetch(`${URL}/storage/v1/object/upload/sign/${STATE_BUCKET}/${path}`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: "{}",
  });
  if (!res.ok) throw new Error(`sign upload failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { url?: string };
  if (!json.url) throw new Error("sign upload: missing url in response");
  return `${URL}/storage/v1${json.url}`;
}

// Stream a media object back from the private bucket (used by the /api/media proxy).
// Forwards an optional Range header so <video> seeking works. Returns null if missing.
export async function fetchMedia(path: string, range?: string | null): Promise<Response | null> {
  const extra: Record<string, string> = {};
  if (range) extra["Range"] = range;
  const res = await fetch(`${URL}/storage/v1/object/${STATE_BUCKET}/${path}`, {
    headers: headers(extra),
    cache: "no-store",
  });
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok && res.status !== 206) throw new Error(`media fetch failed: ${res.status}`);
  return res;
}

// Ensure the private state bucket exists (no-op if present). Safe to call repeatedly.
export async function ensureBucket(): Promise<void> {
  await fetch(`${URL}/storage/v1/bucket`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ id: STATE_BUCKET, name: STATE_BUCKET, public: false }),
  }).catch(() => {});
}
