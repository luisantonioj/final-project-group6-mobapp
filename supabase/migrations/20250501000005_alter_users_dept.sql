-- ============================================================
-- MIGRATION: Add department_id to Users
-- Used by VoteScreen to show only department-specific positions
-- alongside executive positions on the student's ballot.
-- Null = department not yet assigned (admin should set on enrollment).
-- ============================================================

alter table public."Users"
  add column if not exists department_id uuid
    references public."Departments"(id) on delete set null;

create index if not exists idx_users_department_id
  on public."Users" (department_id);

-- ============================================================
-- RPC: get_ballot_positions
-- Returns positions visible to the calling student:
--   • All executive positions (is_executive = true)
--   • Positions belonging to the student's own department
-- Includes candidate rows so the ballot screen can render in
-- a single round-trip.
-- ============================================================

create or replace function public.get_ballot_positions()
returns json
language plpgsql
security definer
stable
as $$
declare
  v_user_id     uuid;
  v_dept_id     uuid;
  v_election_id uuid;
  v_result      json;
begin
  v_user_id := public.current_user_id();
  if v_user_id is null then
    raise exception 'User profile not found';
  end if;

  select u.department_id, s.active_election_id
  into   v_dept_id, v_election_id
  from   public."Users" u
  cross join public."SystemSettings" s
  where  u.id = v_user_id
  limit  1;

  select json_agg(pos_row order by pos_row.display_order)
  into   v_result
  from (
    select
      p.id                as position_id,
      p.position_name,
      p.is_executive,
      p.display_order,
      d.name              as department_name,
      json_agg(
        json_build_object(
          'id',           c.id,
          'name',         c.name,
          'partylist',    c.partylist,
          'photo_url',    c.photo_url,
          'credentials',  c.credentials,
          'platform',     c.platform,
          'email',        c.email
        ) order by c.name
      ) filter (where c.id is not null) as candidates
    from   public."Positions"   p
    left join public."Departments" d  on d.id = p.department_id
    left join public."Candidates"  c  on c.position_id = p.id
                                      and c.election_id = v_election_id
    where  p.is_active = true
    and    (
             p.is_executive = true
             or p.department_id = v_dept_id
           )
    group  by p.id, p.position_name, p.is_executive, p.display_order, d.name
  ) pos_row;

  return coalesce(v_result, '[]'::json);
end;
$$;
