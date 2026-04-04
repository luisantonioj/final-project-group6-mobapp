-- Enable RLS on every table
alter table public."Roles"           enable row level security;
alter table public."Users"           enable row level security;
alter table public."UserRoles"       enable row level security;
alter table public."Positions"       enable row level security;
alter table public."Candidates"      enable row level security;
alter table public."Votes"           enable row level security;
alter table public."Posts"           enable row level security;
alter table public."PollOptions"     enable row level security;
alter table public."PollResponses"   enable row level security;
alter table public."Comments"        enable row level security;
alter table public."MitingQuestions" enable row level security;
alter table public."QuestionUpvotes" enable row level security;
alter table public."Notifications"   enable row level security;
alter table public."SystemSettings"  enable row level security;
alter table public."AuditLogs"       enable row level security;

-- ============================================================
-- HELPER: check if the calling user holds a given role
-- security definer means it runs as postgres, bypassing RLS loops
-- ============================================================
create or replace function public.has_role(role_name text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from   public."UserRoles" ur
    join   public."Users"     u  on u.id  = ur.user_id
    join   public."Roles"     r  on r.id  = ur.role_id
    where  u.auth_id       = auth.uid()
    and    r.role_name     = has_role.role_name
  );
$$;

-- ============================================================
-- HELPER: resolve auth.uid() → Users.id
-- ============================================================
create or replace function public.current_user_id()
returns uuid
language sql
security definer
stable
as $$
  select id from public."Users" where auth_id = auth.uid();
$$;

-- POSITIONS
create policy "positions: authenticated read"
  on public."Positions" for select
  using (auth.role() = 'authenticated');

create policy "positions: admin write"
  on public."Positions" for all
  using (public.has_role('Admin'));

-- CANDIDATES
create policy "candidates: authenticated read"
  on public."Candidates" for select
  using (auth.role() = 'authenticated');

create policy "candidates: admin write"
  on public."Candidates" for all
  using (public.has_role('Admin'));

-- VOTES
create policy "votes: student insert own"
  on public."Votes" for insert
  with check (student_id = public.current_user_id());

create policy "votes: student read own / admin read all"
  on public."Votes" for select
  using (
    student_id = public.current_user_id()
    or public.has_role('Admin')
  );

create policy "votes: admin update (invalidate)"
  on public."Votes" for update
  using (public.has_role('Admin'));

-- POSTS
create policy "posts: authenticated read"
  on public."Posts" for select
  using (auth.role() = 'authenticated');

create policy "posts: admin write"
  on public."Posts" for all
  using (public.has_role('Admin'));

-- POLL OPTIONS
create policy "poll_options: authenticated read"
  on public."PollOptions" for select
  using (auth.role() = 'authenticated');

create policy "poll_options: admin write"
  on public."PollOptions" for all
  using (public.has_role('Admin'));

-- POLL RESPONSES
create policy "poll_responses: student insert own"
  on public."PollResponses" for insert
  with check (student_id = public.current_user_id());

create policy "poll_responses: authenticated read"
  on public."PollResponses" for select
  using (auth.role() = 'authenticated');

-- COMMENTS
create policy "comments: authenticated read"
  on public."Comments" for select
  using (auth.role() = 'authenticated');

create policy "comments: student insert own"
  on public."Comments" for insert
  with check (student_id = public.current_user_id());

create policy "comments: student update own"
  on public."Comments" for update
  using (student_id = public.current_user_id());

create policy "comments: student or admin delete"
  on public."Comments" for delete
  using (
    student_id = public.current_user_id()
    or public.has_role('Admin')
  );

-- MITING QUESTIONS
create policy "miting: student insert"
  on public."MitingQuestions" for insert
  with check (student_id = public.current_user_id());

create policy "miting: student reads approved / admin reads all"
  on public."MitingQuestions" for select
  using (is_approved = true or public.has_role('Admin'));

create policy "miting: admin update (approve/delete)"
  on public."MitingQuestions" for update
  using (public.has_role('Admin'));

create policy "miting: admin delete"
  on public."MitingQuestions" for delete
  using (public.has_role('Admin'));

-- QUESTION UPVOTES
create policy "upvotes: student insert own"
  on public."QuestionUpvotes" for insert
  with check (student_id = public.current_user_id());

create policy "upvotes: student delete own (undo upvote)"
  on public."QuestionUpvotes" for delete
  using (student_id = public.current_user_id());

create policy "upvotes: authenticated read"
  on public."QuestionUpvotes" for select
  using (auth.role() = 'authenticated');

-- NOTIFICATIONS
create policy "notifications: authenticated read"
  on public."Notifications" for select
  using (auth.role() = 'authenticated');

create policy "notifications: admin write"
  on public."Notifications" for all
  using (public.has_role('Admin'));

-- SYSTEM SETTINGS
create policy "settings: authenticated read"
  on public."SystemSettings" for select
  using (auth.role() = 'authenticated');

create policy "settings: admin write"
  on public."SystemSettings" for all
  using (public.has_role('Admin'));

-- AUDIT LOGS  (admin read only — inserts only via RPC, never directly)
create policy "audit: admin read"
  on public."AuditLogs" for select
  using (public.has_role('Admin'));

-- USERS
create policy "users: read own or admin reads all"
  on public."Users" for select
  using (
    auth_id = auth.uid()
    or public.has_role('Admin')
  );

create policy "users: update own profile"
  on public."Users" for update
  using (auth_id = auth.uid());

create policy "users: admin toggle status"
  on public."Users" for update
  using (public.has_role('Admin'));

-- USER ROLES
create policy "userroles: read own"
  on public."UserRoles" for select
  using (user_id = public.current_user_id());

-- ROLES
create policy "roles: authenticated read"
  on public."Roles" for select
  using (auth.role() = 'authenticated');