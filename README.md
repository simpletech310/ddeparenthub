# DDE Parent Hub

A mobile-first PWA for **Data Driven Educators** implementing one connected loop for parents:
**Understand → Learn → Track**.

## 🚀 Live: https://dde-parent-hub.vercel.app

Deployed on **Vercel** with **Supabase** persistence and **Anthropic** (real AI course builder).
Sign in with a demo account (password `demo`): `celia@dde.example` (admin), `marcus@dde.example`
(staff, assigned to the Gomez family), `maria@example.com` (parent).

### Production architecture
- **Persistence**: whole app state is a single JSON document in a private **Supabase Storage** bucket
  (`app-state/db.json`), accessed via REST. The data layer is fully async (`lib/data/`).
- **Auth**: HMAC-signed session cookie (`SESSION_SECRET`) — forgery-proof. Demo accounts for now;
  Supabase Auth is the next step.
- **AI**: `generateCourse` calls Claude when `ANTHROPIC_API_KEY` is set, with a deterministic fallback.
- **Access control (privacy)**: family-scoped in `lib/auth/access.ts` — parent→own family,
  staff→assigned families, admin→all. Verified via `/api/documents` + `/api/goals`.

### Env vars (set in Vercel + `.env.local` locally)
`SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `SESSION_SECRET`. Redeploy with
`npx vercel --prod`. **Rotate any secrets shared in plaintext.**

### Local dev
Runs with **no env** (in-memory store + deterministic AI), or with `.env.local` to use real
Supabase + Claude. Both behind interfaces.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

On the login screen use **quick login** (Parent / Staff / Admin), or sign in with a demo account
(password `demo`): `maria@example.com` (parent), `celia@dde.example` (staff), `admin@dde.example`
(admin).

## What's built

- **Auth & roles** — cookie session, role-based dashboards (Admin / Staff / Parent).
- **Understand (parent-private)** — upload an IEP or triennial evaluation → plain-language,
  three-layer breakdown (What it says / What it means / What you can do) with original-text toggle,
  key dates, "questions to ask," English/Español toggle, and a persistent disclaimer. IEP and
  triennial run through separate pipelines.
- **Learn (LMS)** — staff build courses (incl. an AI course-builder draft), publish templates,
  launch capacity-limited classes (curriculum snapshotted at launch). Parents enroll and move
  through **pre-test → lessons + checks → post-test → results**, with the **pre→post delta** as the
  headline metric. Staff/Admin reporting shows scores only.
- **Track (parent-private)** — goals extracted from the IEP, home observation logging with a simple
  trend, and meeting prep (upcoming dates + questions).
- **Privacy model (PRD §7)** — children/documents/breakdowns/goals/progress are owner-scoped in the
  data layer (simulated RLS): no admin/staff override path. Verify via the API:
  ```bash
  # parent sees their rows; staff/admin see ZERO
  curl -s localhost:3000/api/documents -H "Cookie: dde_session=user_parent_maria"
  curl -s localhost:3000/api/documents -H "Cookie: dde_session=user_staff_celia"   # count: 0
  ```

## Project layout

- `app/` — App Router pages (`parent/`, `staff/`, `admin/`, `api/`).
- `lib/types.ts` — domain model (mirrors PRD §10).
- `lib/data/` — JSON store, seed, owner-scoped repos (the privacy contract), reporting.
- `lib/ai/` — stubbed IEP/triennial breakdown + course-builder (schema-shaped JSON).
- `lib/auth/` — cookie session + server actions.
- `supabase/schema.sql` — **forward artifact**: the real Postgres DDL + RLS policies for when
  Supabase is wired (not executed by this MVP).

## Not in this MVP (behind interfaces, slot in later)

Real Supabase/Postgres + RLS execution, real Anthropic calls, real PDF/OCR parsing (upload accepts
metadata; parsing is stubbed), email verification/magic-link, payments, waitlist, video hosting.
