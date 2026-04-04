-- ============================================================
-- RPC: cast_vote
-- Called by students via /votes endpoint.
-- All validation + insert happens atomically on the server.
-- The app never writes to Votes directly.
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
  v_user_id  uuid;
  v_vote_id  uuid;
  v_settings record;
begin
  -- 1. Resolve caller to internal Users.id
  v_user_id := public.current_user_id();
  if v_user_id is null then
    return json_build_object('success', false, 'error', 'User profile not found');
  end if;

  -- 2. Voting window check
  select * into v_settings from public."SystemSettings" limit 1;
  if v_settings is null
     or now() < v_settings.voting_start_time
     or now() > v_settings.voting_end_time
  then
    return json_build_object('success', false, 'error', 'Voting is not currently open');
  end if;

  -- 3. Duplicate vote check
  if exists (
    select 1 from public."Votes"
    where  student_id  = v_user_id
    and    position_id = p_position_id
    and    is_valid    = true
  ) then
    return json_build_object('success', false, 'error', 'Already voted for this position');
  end if;

  -- 4. Candidate ↔ position integrity check
  if not exists (
    select 1 from public."Candidates"
    where id = p_candidate_id and position_id = p_position_id
  ) then
    return json_build_object('success', false, 'error', 'Candidate does not belong to this position');
  end if;

  -- 5. Insert — unique constraint is the last line of defence
  insert into public."Votes" (student_id, candidate_id, position_id)
  values (v_user_id, p_candidate_id, p_position_id)
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
-- RPC: invalidate_vote
-- Admin-only. Updates Votes.is_valid and writes to AuditLogs
-- in a single transaction — can't succeed partially.
-- ============================================================
create or replace function public.invalidate_vote(p_vote_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_admin_id uuid;
begin
  if not public.has_role('Admin') then
    return json_build_object('success', false, 'error', 'Unauthorized');
  end if;

  v_admin_id := public.current_user_id();

  update public."Votes" set is_valid = false where id = p_vote_id;

  if not found then
    return json_build_object('success', false, 'error', 'Vote not found');
  end if;

  insert into public."AuditLogs" (admin_id, action_type, target_id)
  values (v_admin_id, 'INVALIDATE_VOTE', p_vote_id);

  return json_build_object('success', true);
end;
$$;

-- ============================================================
-- RPC: delete_candidate
-- Admin-only. Deletes candidate and logs the action atomically.
-- ============================================================
create or replace function public.delete_candidate(p_candidate_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_admin_id uuid;
begin
  if not public.has_role('Admin') then
    return json_build_object('success', false, 'error', 'Unauthorized');
  end if;

  v_admin_id := public.current_user_id();

  delete from public."Candidates" where id = p_candidate_id;

  if not found then
    return json_build_object('success', false, 'error', 'Candidate not found');
  end if;

  insert into public."AuditLogs" (admin_id, action_type, target_id)
  values (v_admin_id, 'DELETE_CANDIDATE', p_candidate_id);

  return json_build_object('success', true);
end;
$$;

-- ============================================================
-- RPC: get_vote_tally  (admin: full results)
-- ============================================================
create or replace function public.get_vote_tally()
returns table (
  position_id   uuid,
  position_name text,
  candidate_id  uuid,
  candidate_name text,
  partylist     text,
  vote_count    bigint
)
language sql
security definer
stable
as $$
  select
    p.id,
    p.position_name,
    c.id,
    c.name,
    c.partylist,
    count(v.id) filter (where v.is_valid = true) as vote_count
  from   public."Positions"  p
  join   public."Candidates" c  on c.position_id = p.id
  left join public."Votes"   v  on v.candidate_id = c.id
  group  by p.id, p.position_name, p.display_order, c.id, c.name, c.partylist
  order  by p.display_order, vote_count desc;
$$;

-- ============================================================
-- RPC: get_live_results  (students: anonymous percentages only)
-- Only runs when SystemSettings.show_live_results = true.
-- ============================================================
create or replace function public.get_live_results()
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
  v_show boolean;
begin
  select show_live_results into v_show from public."SystemSettings" limit 1;
  if not v_show then
    raise exception 'Live results are not currently available';
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
  left join public."Votes"   v  on v.candidate_id = c.id
  group  by p.id, p.position_name, p.display_order, c.id
  order  by p.display_order;
end;
$$;