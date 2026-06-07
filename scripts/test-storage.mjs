const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "app-state";
const h = { Authorization: `Bearer ${KEY}`, apikey: KEY };

// create bucket (idempotent)
let r = await fetch(`${URL}/storage/v1/bucket`, { method: "POST", headers: { ...h, "Content-Type": "application/json" }, body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }) });
console.log("create bucket:", r.status, (await r.text()).slice(0,120));

// upload (upsert)
r = await fetch(`${URL}/storage/v1/object/${BUCKET}/db.json`, { method: "POST", headers: { ...h, "Content-Type": "application/json", "x-upsert": "true" }, body: JSON.stringify({ hello: "world" }) });
console.log("upload:", r.status, (await r.text()).slice(0,120));

// download
r = await fetch(`${URL}/storage/v1/object/${BUCKET}/db.json`, { headers: h });
console.log("download:", r.status, (await r.text()).slice(0,120));
