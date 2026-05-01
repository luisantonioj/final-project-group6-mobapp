-- ============================================================
-- MIGRATION: Add Departments table
-- Replaces the hardcoded DEPARTMENTS constant in candidateStore.ts.
-- Departments are soft-deleted (is_active = false) rather than
-- hard-deleted so that historical position/candidate records
-- retain their department reference.
-- ============================================================

create table public."Departments" (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null unique,          -- abbreviation: 'CITE', 'CBEAM', etc.
  full_name     text        not null,                 -- full college name
  is_active     boolean     not null default true,    -- false = soft-deleted / no longer on ballot
  display_order int         not null default 0,       -- controls ballot section ordering
  created_at    timestamptz not null default now()
);

-- ============================================================
-- SEED: Current departments (SY 2025-2026)
-- 'Executive Council' is a virtual department — it is never
-- attached to a student's profile but is used as the parent
-- of executive-level positions.
-- ============================================================

insert into public."Departments" (name, full_name, display_order) values
  ('Executive Council', 'Supreme Student Government – Executive Council',  0),
  ('CITE',              'College of Information Technology and Engineering', 1),
  ('CBEAM',             'College of Business, Economics, Accountancy and Management', 2),
  ('CON',               'College of Nursing',                               3),
  ('CEAS',              'College of Education, Arts and Sciences',          4),
  ('CIHTM',             'College of International Hospitality and Tourism Management', 5);

-- ============================================================
-- RLS
-- ============================================================

alter table public."Departments" enable row level security;

-- All authenticated users can read active departments (needed for ballot + profile setup)
create policy "departments: authenticated read"
  on public."Departments" for select
  using (auth.role() = 'authenticated');

-- Only admins can insert/update/delete
create policy "departments: admin write"
  on public."Departments" for all
  using (public.has_role('Admin'));

-- ============================================================
-- REALTIME
-- Admins see department list updates live in the CRUD panel.
-- ============================================================

alter publication supabase_realtime add table public."Departments";
