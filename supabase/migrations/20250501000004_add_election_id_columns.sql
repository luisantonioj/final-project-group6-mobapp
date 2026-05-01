-- ============================================================
-- MIGRATION: Add election_id to transactional tables
-- Candidates, Votes, Posts, and MitingQuestions all gain an
-- election_id FK so they can be scoped to a specific cycle.
-- Existing rows are backfilled with the current active election.
-- RPCs are updated to accept p_election_id where relevant.
-- ============================================================

-- ── Helper: resolve active election id ──────────────────────
-- Re-used across backfill statements below.
do $$
declare
  v_election_id uuid;
begin
  select active_election_id into v_election_id
  from   public."SystemSettings"
  limit  1;

  if v_election_id is null then
    raise exception 'No active election found. Run migration 20250501000002 first.';
  end if;

  -- Candidates
  alter table public."Candidates"
    add column if not exists election_id uuid
      references public."Elections"(id) on delete restrict;

  update public."Candidates" set election_id = v_election_id where election_id is null;

  alter table public."Candidates"
    alter column election_id set not null;

  -- Votes
  alter table public."Votes"
    add column if not exists election_id uuid
      references public."Elections"(id) on delete restrict;

  update public."Votes" set election_id = v_election_id where election_id is null;

  alter table public."Votes"
    alter column election_id set not null;

  -- Posts
  alter table public."Posts"
    add column if not exists election_id uuid
      references public."Elections"(id) on delete restrict;

  update public."Posts" set election_id = v_election_id where election_id is null;

  alter table public."Posts"
    alter column election_id set not null;

  -- MitingQuestions
  alter table public."MitingQuestions"
    add column if not exists election_id uuid
      references public."Elections"(id) on delete restrict;

  update public."MitingQuestions" set election_id = v_election_id where election_id is null;

  alter table public."MitingQuestions"
    alter column election_id set not null;
end;
$$;

-- ============================================================
-- INDEXES: election_id is a frequent filter column
-- ============================================================

create index if not exists idx_candidates_election_id on public."Candidates" (election_id);
create index if not exists idx_votes_election_id      on public."Votes"      (election_id);
create index if not exists idx_posts_election_id      on public."Posts"      (election_id);
create index if not exists idx_miting_election_id     on public."MitingQuestions" (election_id);

-- ============================================================
-- RPC: cast_vote  (updated)
-- Voting window now comes from Elections via the active_election_id
-- pointer in SystemSettings. election_id is written to the vote row.
-- ============================================================

create or replace function public.cast_vote(
  p_candidate_id uuid,
  p_position_id  uuid
)
returns json
language plpgsql
security definer
as $$
declare
  v_user_id     uuid;
  v_vote_id     uuid;
  v_election_id uuid;
  v_election    record;
begin
  -- 1. Resolve caller to internal Users.id
  v_user_id := public.current_user_id();
  if v_user_id is null then
    return json_build_object('success', false, 'error', 'User profile not found');
  end if;

  -- 2. Resolve active election and check voting window
  select s.active_election_id into v_election_id
  from   public."SystemSettings" s
  limit  1;

  if v_election_id is null then
    return json_build_object('success', false, 'error', 'No active election configured');
  end if;

  select * into v_election
  from   public."Elections"
  where  id = v_election_id;

  if v_election is null
     or v_election.voting_start is null
     or v_election.voting_end   is null
     or now() < v_election.voting_start
     or now() > v_election.voting_end
  then
    return json_build_object('success', false, 'error', 'Voting is not currently open');
  end if;

  -- 3. Duplicate vote check (scoped to this election)
  if exists (
    select 1 from public."Votes"
    where  student_id   = v_user_id
    and    position_id  = p_position_id
    and    election_id  = v_election_id
    and    is_valid     = true
  ) then
    return json_build_object('success', false, 'error', 'Already voted for this position');
  end if;

  -- 4. Candidate ↔ position integrity check
  if not exists (
    select 1 from public."Candidates"
    where  id          = p_candidate_id
    and    position_id = p_position_id
    and    election_id = v_election_id
  ) then
    return json_build_object('success', false, 'error', 'Candidate does not belong to this position');
  end if;

  -- 5. Insert
  insert into public."Votes" (student_id, candidate_id, position_id, election_id)
  values (v_user_id, p_candidate_id, p_position_id, v_election_id)
  returning id into v_vote_id;

  return json_build_object('success', true, 'vote_id', v_vote_id);

exception
  when unique_violation then
    return json_build_object('success', false, 'error', 'Duplicate vote blocked by constraint');
  when others then
    return json_build_object('success', false, 'error', sqlerrm);
end;
$$;

-- ============================================================
-- RPC: get_vote_tally  (updated — scoped to an election)
-- p_election_id: if null, uses the current active election.
-- ============================================================

create or replace function public.get_vote_tally(
  p_election_id uuid default null
)
returns table (
  position_id    uuid,
  position_name  text,
  candidate_id   uuid,
  candidate_name text,
  partylist      text,
  vote_count     bigint
)
language plpgsql
security definer
stable
as $$
declare
  v_election_id uuid;
begin
  if not public.has_role('Admin') then
    raise exception 'Unauthorized';
  end if;

  -- Default to active election if caller did not specify one
  if p_election_id is not null then
    v_election_id := p_election_id;
  else
    select active_election_id into v_election_id
    from   public."SystemSettings"
    limit  1;
  end if;

  return query
  select
    p.id,
    p.position_name,
    c.id,
    c.name,
    c.partylist,
    count(v.id) filter (where v.is_valid = true)
  from   public."Positions"  p
  join   public."Candidates" c  on c.position_id = p.id
                                and c.election_id = v_election_id
  left join public."Votes"   v  on v.candidate_id = c.id
                                and v.election_id  = v_election_id
  group  by p.id, p.position_name, p.display_order, c.id, c.name, c.partylist
  order  by p.display_order, count(v.id) filter (where v.is_valid = true) desc;
end;
$$;

-- ============================================================
-- RPC: get_live_results  (updated — scoped to an election)
-- Students always see the active election only.
-- ============================================================

create or replace function public.get_live_results(
  p_election_id uuid default null
)
returns table (
  position_id   uuid,
  position_name text,
  candidate_id  uuid,
  percentage    numeric
)
language plpgsql
security definer
stable
as $$
declare
  v_show        boolean;
  v_election_id uuid;
begin
  select show_live_results, active_election_id
  into   v_show, v_election_id
  from   public."SystemSettings"
  limit  1;

  if not v_show then
    raise exception 'Live results are not currently available';
  end if;

  -- Admin may query any election; students are locked to active
  if p_election_id is not null and public.has_role('Admin') then
    v_election_id := p_election_id;
  end if;

  return query
  select
    p.id,
    p.position_name,
    c.id,
    round(
      count(v.id) filter (where v.is_valid = true) * 100.0
      / nullif(sum(count(v.id) filter (where v.is_valid = true)) over (partition by p.id), 0),
      1
    )
  from   public."Positions"  p
  join   public."Candidates" c  on c.position_id = p.id
                                and c.election_id = v_election_id
  left join public."Votes"   v  on v.candidate_id = c.id
                                and v.election_id  = v_election_id
  group  by p.id, p.position_name, p.display_order, c.id
  order  by p.display_order;
end;
$$;
