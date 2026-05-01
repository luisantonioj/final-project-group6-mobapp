-- ============================================================
-- MIGRATION: Alter Positions — link to Departments
-- Adds department_id, is_executive, and is_active columns.
-- Existing rows (from the original seed) are backfilled by
-- matching common name prefixes. Unknown rows default to
-- is_executive = true so they surface in the ballot until
-- an admin corrects them.
-- ============================================================

-- Add the new columns (all nullable / defaulted so existing rows don't break)
alter table public."Positions"
  add column if not exists department_id uuid
    references public."Departments"(id) on delete restrict,
  add column if not exists is_executive  boolean not null default false,
  add column if not exists is_active     boolean not null default true;

-- ============================================================
-- BACKFILL: Tag executive positions
-- Pattern: names that start with 'Executive ' belong to the
-- Executive Council department.
-- ============================================================

update public."Positions"
set
  is_executive  = true,
  department_id = (
    select id from public."Departments" where name = 'Executive Council'
  )
where position_name ilike 'Executive %';

-- ============================================================
-- BACKFILL: Tag positions seeded without a department prefix
-- (Secretary General, Treasurer, Auditor, PRO, Year Reps)
-- These were placeholder rows — mark them executive so they
-- still appear on the ballot. Admin can reassign via CRUD UI.
-- ============================================================

update public."Positions"
set
  is_executive  = true,
  department_id = (
    select id from public."Departments" where name = 'Executive Council'
  )
where department_id is null
  and position_name not ilike 'Executive %';

-- ============================================================
-- SEED: Full department position set
-- Each department gets: Governor, Vice Governor, Secretary,
-- Treasurer, Auditor, PRO, 1st–4th Year Representatives.
-- display_order starts at 100 to keep them after exec positions.
-- ============================================================

do $$
declare
  dept   record;
  offset int;
  pos    text;
  positions text[] := array[
    'Governor', 'Vice Governor', 'Secretary', 'Treasurer',
    'Auditor', 'Public Relations Officer',
    '1st Year Representative', '2nd Year Representative',
    '3rd Year Representative', '4th Year Representative'
  ];
begin
  offset := 0;
  for dept in
    select id, name, display_order
    from   public."Departments"
    where  name <> 'Executive Council'
    order  by display_order
  loop
    foreach pos in array positions loop
      -- Only insert if this exact combo doesn't already exist
      insert into public."Positions" (position_name, department_id, is_executive, is_active, display_order)
      select dept.name || ' – ' || pos,
             dept.id,
             false,
             true,
             100 + (dept.display_order * 20) + offset
      where not exists (
        select 1 from public."Positions"
        where  position_name = dept.name || ' – ' || pos
      );
      offset := offset + 1;
    end loop;
    offset := 0;
  end loop;
end;
$$;

-- ============================================================
-- INDEX: Speed up per-department position lookups
-- ============================================================

create index if not exists idx_positions_department_id
  on public."Positions" (department_id);

create index if not exists idx_positions_is_executive
  on public."Positions" (is_executive)
  where is_executive = true;
