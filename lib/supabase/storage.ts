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

// Ensure the private state bucket exists (no-op if present). Safe to call repeatedly.
export async function ensureBucket(): Promise<void> {
  await fetch(`${URL}/storage/v1/bucket`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ id: STATE_BUCKET, name: STATE_BUCKET, public: false }),
  }).catch(() => {});
}
