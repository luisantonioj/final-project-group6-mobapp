-- ============================================================
-- MIGRATION: Update RLS policies for election scoping
-- Students are restricted to the active election on all
-- transactional tables. Admins can access any election.
-- New policies added for Departments and Elections tables.
-- ============================================================

-- ============================================================
-- DROP policies that need replacing (transactional tables)
-- We drop by name because Postgres doesn't have CREATE OR REPLACE
-- for policies.
-- ============================================================

-- Candidates
drop policy if exists "candidates: authenticated read" on public."Candidates";

-- Votes
drop policy if exists "votes: student read own / admin read all" on public."Votes";
drop policy if exists "votes: student insert own" on public."Votes";

-- Posts
drop policy if exists "posts: authenticated read" on public."Posts";

-- MitingQuestions
drop policy if exists "miting: student reads approved / admin reads all" on public."MitingQuestions";
drop policy if exists "miting: student insert" on public."MitingQuestions";

-- ============================================================
-- HELPER: Resolve the active election id
-- Avoids a join in every policy; security definer so it can
-- read SystemSettings without triggering RLS on that table.
-- ============================================================

create or replace function public.active_election_id()
returns uuid
language sql
security definer
stable
as $$
  select active_election_id from public."SystemSettings" limit 1;
$$;

-- ============================================================
-- CANDIDATES — students see only current election; admins see all
-- ============================================================

create policy "candidates: student read active election"
  on public."Candidates" for select
  using (
    election_id = public.active_election_id()
    or public.has_role('Admin')
  );

-- Admin write policy already covers all operations — no change needed.

-- ============================================================
-- VOTES — scoped to active election for student inserts/reads
-- ============================================================

create policy "votes: student insert own"
  on public."Votes" for insert
  with check (
    student_id  = public.current_user_id()
    and election_id = public.active_election_id()
  );

create policy "votes: student read own / admin read all"
  on public."Votes" for select
  using (
    (student_id = public.current_user_id() and election_id = public.active_election_id())
    or public.has_role('Admin')
  );

-- ============================================================
-- POSTS — students see posts from the active election only
-- ============================================================

create policy "posts: student read active election"
  on public."Posts" for select
  using (
    election_id = public.active_election_id()
    or public.has_role('Admin')
  );

-- ============================================================
-- MITING QUESTIONS — students read approved questions from
-- the active election; admins read everything
-- ============================================================

create policy "miting: student insert active election"
  on public."MitingQuestions" for insert
  with check (
    student_id  = public.current_user_id()
    and election_id = public.active_election_id()
  );

create policy "miting: student reads approved active / admin reads all"
  on public."MitingQuestions" for select
  using (
    (is_approved = true and election_id = public.active_election_id())
    or public.has_role('Admin')
  );

-- ============================================================
-- SYSTEM SETTINGS — existing policies are fine; just expose
-- the new active_election_id column through the existing read.
-- No changes needed here — the authenticated read policy already
-- covers the whole row.
-- ============================================================

-- ============================================================
-- USER ROLES — allow admin to also read all UserRoles
-- (needed by the admin Users management panel)
-- ============================================================

drop policy if exists "userroles: read own" on public."UserRoles";

create policy "userroles: read own or admin reads all"
  on public."UserRoles" for select
  using (
    user_id = public.current_user_id()
    or public.has_role('Admin')
  );

-- ============================================================
-- REALTIME: SystemSettings was not in the realtime publication.
-- Add it now so the app gets live updates when active_election_id
-- changes (e.g. after an election is archived and a new one starts).
-- ============================================================

alter publication supabase_realtime add table public."SystemSettings";
