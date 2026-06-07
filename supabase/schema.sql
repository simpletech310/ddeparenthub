-- =====================================================================
-- DDE Parent Hub — Postgres schema + Row Level Security (v2, family-scoped)
--
-- FORWARD ARTIFACT. Not executed by the local MVP (which uses a JSON store + repo-layer
-- access checks in lib/auth/access.ts that simulate these policies). Authored so wiring
-- real Supabase is a drop-in.
--
-- v2 ACCESS MODEL (supersedes the v1 "parent-only" rule):
--   * Clinical data (children, documents, breakdowns, goals, progress) is FAMILY-scoped.
--   * parent  -> their own family (users.family_id)
--   * staff   -> families they are ASSIGNED to (family_staff_assignments)
--   * admin   -> all families
--   Writes to clinical data are limited to family members (parents) + admin; staff are
--   read-only. Helpers is_admin()/is_assigned_staff()/is_family_member() encode this.
-- =====================================================================

create type user_role as enum ('admin', 'staff', 'parent');
create type course_status as enum ('draft', 'published');
create type assessment_kind as enum ('pretest', 'posttest', 'lesson_check');
create type doc_type as enum ('iep', 'triennial');
create type doc_status as enum ('processing', 'ready', 'error');
create type partner_status as enum ('active', 'archived');

create table families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  retention_months int,
  consent_accepted_at timestamptz
);

create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null,
  email text not null unique,
  name text not null,
  title text,
  preferred_language text not null default 'en',
  status text not null default 'active',
  family_id uuid references families (id) on delete set null  -- parents only
);

create table family_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families (id) on delete cascade,
  staff_id uuid not null references users (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique (family_id, staff_id)
);

-- ---------------- Access helper functions (SECURITY DEFINER) ----------------
create or replace function is_admin() returns boolean language sql stable as $$
  select exists (select 1 from users u where u.id = auth.uid() and u.role = 'admin' and u.status = 'active');
$$;
create or replace function is_family_member(fid uuid) returns boolean language sql stable as $$
  select exists (select 1 from users u where u.id = auth.uid() and u.family_id = fid and u.status = 'active');
$$;
create or replace function is_assigned_staff(fid uuid) returns boolean language sql stable as $$
  select exists (
    select 1 from family_staff_assignments a
    join users u on u.id = auth.uid()
    where a.family_id = fid and a.staff_id = auth.uid() and u.status = 'active'
  );
$$;
-- Read access = member OR assigned staff OR admin. Write access = member OR admin.
create or replace function can_read_family(fid uuid) returns boolean language sql stable as $$
  select is_admin() or is_family_member(fid) or is_assigned_staff(fid);
$$;
create or replace function can_write_family(fid uuid) returns boolean language sql stable as $$
  select is_admin() or is_family_member(fid);
$$;

-- ---------------- LMS (org-visible) ----------------
create table courses (
  id uuid primary key default gen_random_uuid(),
  owner_staff_id uuid not null references users (id),
  title text not null, description text, outcomes text, teacher_instructions text,
  is_template boolean not null default false, category text,
  status course_status not null default 'draft', estimated_duration text, cover_image text,
  tags text[] not null default '{}'
);
create table lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  order_index int not null, title text not null, teacher_instructions text
);
create table content_blocks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons (id) on delete cascade,
  order_index int not null, type text not null, payload jsonb not null default '{}'
);
create table assessments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  kind assessment_kind not null, lesson_id uuid references lessons (id) on delete cascade, title text not null
);
create table questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments (id) on delete cascade,
  order_index int not null, type text not null, prompt text not null,
  options jsonb not null default '[]', option_images jsonb, right_options jsonb,
  answer_key jsonb, scored boolean not null default true, media jsonb
);
create table classes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id), course_snapshot jsonb not null,
  staff_id uuid not null references users (id), title text not null,
  description text, cover_image text, starts_at timestamptz, schedule text,
  capacity int not null, enrollment_status text not null default 'open',
  delivery_mode text not null default 'telehealth', address text, meeting_link text
);
create table enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes (id) on delete cascade,
  parent_id uuid not null references users (id) on delete cascade,
  status text not null default 'enrolled', created_at timestamptz not null default now(),
  attendance text not null default 'pending', checked_in_at timestamptz,
  checked_in_by_staff_id uuid references users (id),
  unique (class_id, parent_id)
);
create table attempts (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments (id) on delete cascade,
  assessment_id uuid not null references assessments (id),
  score int not null, max_score int not null, submitted_at timestamptz not null default now()
);
create table lesson_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments (id) on delete cascade,
  lesson_id uuid not null references lessons (id),
  status text not null default 'not_started', last_block_index int not null default 0
);

-- ---------------- DDE Partner Directory (admin-managed) ----------------
create table partners (
  id uuid primary key default gen_random_uuid(),
  name text not null, category text, tagline text, image_url text,
  description text, how_they_help text,
  services text[] not null default '{}',
  insurance_accepted text[] not null default '{}',
  interest_tags text[] not null default '{}', need_tags text[] not null default '{}',
  contact_name text, phone text, email text, website text, address text,
  status partner_status not null default 'active'
);

-- ---------------- Family-scoped clinical data ----------------
create table children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families (id) on delete cascade,
  display_name text not null, dob date,
  interest_tags text[] not null default '{}', need_tags text[] not null default '{}',
  temperament text, strengths text, notes text
);
create table documents (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children (id) on delete cascade,
  family_id uuid not null references families (id) on delete cascade,
  created_by_parent_id uuid references users (id),
  doc_type doc_type not null, file_name text not null, storage_path text not null,
  status doc_status not null default 'processing', retention_until timestamptz,
  created_at timestamptz not null default now()
);
create table document_breakdowns (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents (id) on delete cascade,
  family_id uuid not null references families (id) on delete cascade,
  summary text, payload jsonb not null, language text not null default 'en',
  content_hash text not null, prompt_version text not null
);
create table extracted_goals (
  id uuid primary key default gen_random_uuid(),
  -- null document_id = a goal added by hand (source 'manual')
  document_id uuid references documents (id) on delete cascade,
  family_id uuid not null references families (id) on delete cascade,
  child_id uuid not null references children (id) on delete cascade,
  source text not null default 'iep',
  domain text, verbatim_text text, baseline text, target text, measure text,
  confidence text not null default 'high'
);
create table goal_progress (
  id uuid primary key default gen_random_uuid(),
  extracted_goal_id uuid not null references extracted_goals (id) on delete cascade,
  family_id uuid not null references families (id) on delete cascade,
  observed_by_parent_id uuid references users (id),
  observed_at timestamptz not null default now(), note text, simple_rating int not null,
  -- optional photo/video stored in the private 'documents' bucket (path namespaced per family)
  media_url text, media_type text
);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

-- Users: read self; admin reads all (to manage). Staff/admin may read parent rows of
-- families they can access via the join in app code; here we keep it simple: self + admin.
alter table users enable row level security;
create policy users_self_select on users for select using (id = auth.uid() or is_admin());
create policy users_self_update on users for update using (id = auth.uid() or is_admin());

alter table families enable row level security;
create policy families_read on families for select using (can_read_family(id));
create policy families_write on families for all using (can_write_family(id)) with check (can_write_family(id));

alter table family_staff_assignments enable row level security;
create policy fsa_read on family_staff_assignments for select
  using (is_admin() or staff_id = auth.uid() or is_family_member(family_id));
create policy fsa_admin_write on family_staff_assignments for all using (is_admin()) with check (is_admin());

-- LMS content: readable by authenticated users; writes by owning staff or admin.
alter table courses enable row level security;
create policy courses_read on courses for select using (auth.role() = 'authenticated');
create policy courses_write on courses for all
  using (owner_staff_id = auth.uid() or is_admin()) with check (owner_staff_id = auth.uid() or is_admin());

-- Partners: everyone authenticated can read active ones; only admin writes.
alter table partners enable row level security;
create policy partners_read on partners for select using (auth.role() = 'authenticated');
create policy partners_admin_write on partners for all using (is_admin()) with check (is_admin());

-- Enrollments: parent sees own; staff of the class see them.
alter table enrollments enable row level security;
create policy enrollments_parent on enrollments for all
  using (parent_id = auth.uid()) with check (parent_id = auth.uid());
create policy enrollments_staff_read on enrollments for select
  using (is_admin() or exists (select 1 from classes c where c.id = class_id and c.staff_id = auth.uid()));

-- ---- THE FAMILY ACCESS CONTRACT ----
-- read = member OR assigned staff OR admin; write = member OR admin (staff read-only).

alter table children enable row level security;
create policy children_read on children for select using (can_read_family(family_id));
create policy children_write on children for all using (can_write_family(family_id)) with check (can_write_family(family_id));

alter table documents enable row level security;
create policy documents_read on documents for select using (can_read_family(family_id));
create policy documents_write on documents for all using (can_write_family(family_id)) with check (can_write_family(family_id));

alter table document_breakdowns enable row level security;
create policy breakdowns_read on document_breakdowns for select using (can_read_family(family_id));
create policy breakdowns_write on document_breakdowns for all using (can_write_family(family_id)) with check (can_write_family(family_id));

alter table extracted_goals enable row level security;
create policy goals_read on extracted_goals for select using (can_read_family(family_id));
create policy goals_write on extracted_goals for all using (can_write_family(family_id)) with check (can_write_family(family_id));

alter table goal_progress enable row level security;
create policy goal_progress_read on goal_progress for select using (can_read_family(family_id));
create policy goal_progress_write on goal_progress for all using (can_write_family(family_id)) with check (can_write_family(family_id));

-- ---------------- Storage (private bucket) ----------------
-- Private 'documents' bucket; object path = '<family_id>/<child_id>/...'. Access via
-- short-lived signed URLs to readers of the family. (Folder-1 = family_id.)
--   insert into storage.buckets (id, name, public) values ('documents', 'documents', false);
create policy "documents_storage_family_read"
  on storage.objects for select
  using (bucket_id = 'documents' and can_read_family(((storage.foldername(name))[1])::uuid));
create policy "documents_storage_family_write"
  on storage.objects for all
  using (bucket_id = 'documents' and can_write_family(((storage.foldername(name))[1])::uuid))
  with check (bucket_id = 'documents' and can_write_family(((storage.foldername(name))[1])::uuid));
