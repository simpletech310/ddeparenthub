// One-time: create the app_state table used by the JSON-document store.
// Run locally:  node --env-file=.env.local scripts/setup-db.mjs
import pg from "pg";

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL not set");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

const sql = `
create table if not exists app_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
`;

try {
  await client.connect();
  await client.query(sql);
  console.log("✓ app_state table ready");
} catch (e) {
  console.error("setup failed:", e.message);
  process.exit(1);
} finally {
  await client.end();
}
