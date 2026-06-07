import "server-only";
import { cache } from "react";
import type { Database } from "@/lib/types";
import { buildSeed } from "./seed";
import {
  downloadState,
  ensureBucket,
  storageConfigured,
  uploadState,
} from "@/lib/supabase/storage";

// =====================================================================
// Persistence (production: Supabase Storage; fallback: in-memory).
//
// The whole app state is a single JSON document stored at app-state/db.json in a private
// Supabase Storage bucket. This keeps the synchronous repo logic intact while working on
// Vercel's serverless, filesystem-less runtime. Access control is enforced in the app layer
// (lib/auth/access.ts); see README for the path to per-table Postgres + RLS.
//
// getDb() is request-memoized via React cache() so many repo reads in one render share a
// single download. saveDb() mutates that in-request object and uploads the whole blob.
// =====================================================================

// In-memory fallback for local dev without Supabase env (or if Storage is unreachable).
const g = globalThis as unknown as { __dde_mem?: Database };

async function loadDb(): Promise<Database> {
  if (!storageConfigured()) {
    if (!g.__dde_mem) g.__dde_mem = buildSeed();
    return g.__dde_mem;
  }
  try {
    const raw = await downloadState();
    if (raw) return JSON.parse(raw) as Database;
  } catch {
    // fall through to seed
  }
  const seeded = buildSeed();
  await ensureBucket();
  await uploadState(JSON.stringify(seeded));
  return seeded;
}

// Request-scoped memoization: one load per request.
const getDbCached = cache(loadDb);

export async function getDb(): Promise<Database> {
  return getDbCached();
}

export async function saveDb(mutator?: (db: Database) => void): Promise<Database> {
  const db = await getDb();
  if (mutator) mutator(db);
  if (storageConfigured()) {
    await uploadState(JSON.stringify(db));
  } else {
    g.__dde_mem = db;
  }
  return db;
}

let counter = 0;
export function id(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
