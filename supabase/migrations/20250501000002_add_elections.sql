-- ============================================================
-- MIGRATION: Add Elections table
-- Each election cycle (e.g. SY 2025-2026) is one row.
-- Voting schedule moves here from SystemSettings so that
-- archived elections retain their original start/end times.
-- SystemSettings gains active_election_id to point at whichever
-- election is currently running.
-- ============================================================

create table public."Elections" (
  id            uuid        primary key default gen_random_uuid(),
  label         text        not null unique,          -- e.g. 'SY 2025-2026'
  status        text        not null default 'active'
                            check (status in ('active', 'archived')),
  voting_start  timestamptz,                          -- null = not yet scheduled
  voting_end    timestamptz,                          -- null = not yet scheduled
  archived_at   timestamptz,                          -- set when status → archived
  created_at    timestamptz not null default now()
);

-- ============================================================
-- SEED: Create the current active election and migrate the
-- existing voting window from SystemSettings into it.
-- ============================================================

do $$
declare
  v_election_id uuid;
  v_start       timestamptz;
  v_end         timestamptz;
begin
  -- Grab existing schedule before we touch SystemSettings
  select voting_start_time, voting_end_time
  into   v_start, v_end
  from   public."SystemSettings"
  limit  1;

  -- Create the active election row
  insert into public."Elections" (label, status, voting_start, voting_end)
  values ('SY 2025-2026', 'active', v_start, v_end)
  returning id into v_election_id;

  -- Wire SystemSettings to the new election
  alter table public."SystemSettings"
    add column if not exists active_election_id uuid
      references public."Elections"(id) on delete set null;

  update public."SystemSettings"
  set    active_election_id = v_election_id;

  -- Remove redundant columns from SystemSettings (schedule now lives in Elections)
  alter table public."SystemSettings"
    drop column if exists voting_start_time,
    drop column if exists voting_end_time;
end;
$$;

-- ============================================================
-- RLS
-- ============================================================

alter table public."Elections" enable row level security;

-- Authenticated users can read any election (needed for results history)
create policy "elections: authenticated read"
  on public."Elections" for select
  using (auth.role() = 'authenticated');

-- Only admins can create/update/archive elections
create policy "elections: admin write"
  on public."Elections" for all
  using (public.has_role('Admin'));

-- ============================================================
-- FUNCTION: archive_election
-- Atomically archives the current election and optionally
-- activates a new one. Called by admin from the UI.
-- ============================================================

create or replace function public.archive_election(
  p_new_label text default null   -- if supplied, creates + activates a new election
)
returns json
language plpgsql
security definer
as $$
declare
  v_admin_id      uuid;
  v_old_id        uuid;
  v_new_id        uuid;
begin
  if not public.has_role('Admin') then
    return json_build_object('success', false, 'error', 'Unauthorized');
  end if;

  v_admin_id := public.current_user_id();

  -- Find current active election
  select active_election_id into v_old_id
  from   public."SystemSettings"
  limit  1;

  if v_old_id is null then
    return json_build_object('success', false, 'error', 'No active election to archive');
  end if;

  -- Archive it
  update public."Elections"
  set    status = 'archived', archived_at = now()
  where  id = v_old_id;

  insert into public."AuditLogs" (admin_id, action_type, target_id)
  values (v_admin_id, 'ARCHIVE_ELECTION', v_old_id);

  -- Optionally spin up a new election
  if p_new_label is not null then
    insert into public."Elections" (label, status)
    values (p_new_label, 'active')
    returning id into v_new_id;

    update public."SystemSettings"
    set    active_election_id = v_new_id;

    insert into public."AuditLogs" (admin_id, action_type, target_id)
    values (v_admin_id, 'CREATE_ELECTION', v_new_id);

    return json_build_object('success', true, 'archived_id', v_old_id, 'new_election_id', v_new_id);
  else
    -- No new election — clear the pointer
    update public."SystemSettings"
    set    active_election_id = null;
    return json_build_object('success', true, 'archived_id', v_old_id);
  end if;
end;
$$;

-- ============================================================
-- REALTIME
-- ============================================================

alter publication supabase_realtime add table public."Elections";
