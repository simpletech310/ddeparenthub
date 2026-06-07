# DDE Parent Hub — MVP (Walking Skeleton)

A mobile-first PWA for **Data Driven Educators** implementing one connected loop for parents:
**Understand → Learn → Track**. This is a local-first MVP — it runs with **no Supabase and no
Anthropic key**. Data persists to a local JSON store and AI is stubbed with schema-shaped
responses. Both sit behind interfaces so real Supabase + Claude drop in later.

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
