import { NextRequest } from "next/server";
import { fetchMedia } from "@/lib/supabase/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Streams course media (images/video) back from the private Supabase bucket.
// Guardrails: only ever serves objects under `media/` — never the state blob
// (db.json) or anything else in the bucket.
export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = (params.path ?? []).join("/");
  if (!path.startsWith("media/") || path.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  const upstream = await fetchMedia(path, req.headers.get("range"));
  if (!upstream) return new Response("Not found", { status: 404 });

  const out = new Headers();
  for (const h of ["content-type", "content-length", "content-range", "accept-ranges", "etag"]) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  if (!out.has("accept-ranges")) out.set("accept-ranges", "bytes");
  out.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(upstream.body, { status: upstream.status, headers: out });
}
