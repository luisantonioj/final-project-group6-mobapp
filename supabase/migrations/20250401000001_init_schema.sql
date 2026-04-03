-- ============================================================
-- ROLES
-- ============================================================
create table public."Roles" (
  id          uuid primary key default gen_random_uuid(),
  role_name   text not null unique,
  created_at  timestamptz default now()
);

-- ============================================================
-- USERS  (linked to Supabase Auth via auth_id)
-- ============================================================
create table public."Users" (
  id                uuid primary key default gen_random_uuid(),
  auth_id           uuid references auth.users(id) on delete cascade unique,
  name              text not null,
  email             text not null unique,
  profile_photo_url text,
  is_active         boolean default true,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ============================================================
-- USER ROLES  (junction — one user can hold multiple roles)
-- ============================================================
create table public."UserRoles" (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public."Users"(id) on delete cascade not null,
  role_id     uuid references public."Roles"(id) on delete cascade not null,
  assigned_at timestamptz default now(),
  unique(user_id, role_id)
);

-- ============================================================
-- POSITIONS  (replaces free-text position column on Candidates)
-- ============================================================
create table public."Positions" (
  id            uuid primary key default gen_random_uuid(),
  position_name text not null unique,
  display_order int  not null default 0,
  created_at    timestamptz default now()
);

-- ============================================================
-- CANDIDATES
-- ============================================================
create table public."Candidates" (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  partylist   text,
  position_id uuid references public."Positions"(id) on delete restrict not null,
  email       text,
  credentials text,
  platform    text,
  photo_url   text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- VOTES  — UNIQUE(student_id, position_id) enforces 1 vote per position
-- ============================================================
create table public."Votes" (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid references public."Users"(id)      on delete restrict not null,
  candidate_id uuid references public."Candidates"(id) on delete restrict not null,
  position_id  uuid references public."Positions"(id)  on delete restrict not null,
  is_valid     boolean default true,
  created_at   timestamptz default now(),
  unique(student_id, position_id)
);

-- ============================================================
-- POSTS  (announcements + polls share this table, type field distinguishes)
-- ============================================================
create table public."Posts" (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid references public."Users"(id) on delete set null,
  type       text not null check (type in ('announcement', 'poll')),
  title      text not null,
  content    text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- POLL OPTIONS  (child of Posts where type = 'poll')
-- ============================================================
create table public."PollOptions" (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid references public."Posts"(id) on delete cascade not null,
  option_text text not null
);

-- ============================================================
-- POLL RESPONSES  — UNIQUE(student_id, poll_option_id) prevents double voting
-- ============================================================
create table public."PollResponses" (
  id             uuid primary key default gen_random_uuid(),
  poll_option_id uuid references public."PollOptions"(id) on delete cascade not null,
  student_id     uuid references public."Users"(id)       on delete cascade not null,
  created_at     timestamptz default now(),
  unique(student_id, poll_option_id)
);

-- ============================================================
-- COMMENTS
-- ============================================================
create table public."Comments" (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references public."Posts"(id)  on delete cascade not null,
  student_id uuid references public."Users"(id)  on delete cascade not null,
  content    text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- MITING QUESTIONS  (renamed from CommunityUpvotes — stores the question, not the upvote)
-- upvote_count is a cached counter — kept in sync by a trigger below
-- ============================================================
create table public."MitingQuestions" (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid references public."Users"(id) on delete cascade not null,
  question_text text not null,
  upvote_count  int default 0,
  is_approved   boolean default false,
  created_at    timestamptz default now()
);

-- ============================================================
-- QUESTION UPVOTES  — UNIQUE(question_id, student_id) prevents double upvoting
-- ============================================================
create table public."QuestionUpvotes" (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid references public."MitingQuestions"(id) on delete cascade not null,
  student_id  uuid references public."Users"(id)           on delete cascade not null,
  created_at  timestamptz default now(),
  unique(question_id, student_id)
);

-- ============================================================
-- NOTIFICATIONS  (config/template table — one row per event type)
-- ============================================================
create table public."Notifications" (
  id            uuid primary key default gen_random_uuid(),
  event_trigger text not null unique,
  title         text not null,
  message_body  text not null,
  updated_at    timestamptz default now()
);

-- ============================================================
-- SYSTEM SETTINGS  (singleton config row — only one row ever exists)
-- ============================================================
create table public."SystemSettings" (
  id                  uuid primary key default gen_random_uuid(),
  voting_start_time   timestamptz,
  voting_end_time     timestamptz,
  is_miting_active    boolean default false,
  show_live_results   boolean default false,
  updated_at          timestamptz default now()
);

-- ============================================================
-- AUDIT LOGS  (polymorphic — target_id has no FK by design)
-- Never written to directly via API; only via internal RPCs
-- ============================================================
create table public."AuditLogs" (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references public."Users"(id) on delete set null,
  action_type text not null,
  target_id   uuid,           -- polymorphic: points to Votes, Candidates, etc.
  created_at  timestamptz default now()
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- auto-update updated_at on writes
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_users_updated
  before update on public."Users"
  for each row execute procedure public.handle_updated_at();

create trigger trg_candidates_updated
  before update on public."Candidates"
  for each row execute procedure public.handle_updated_at();

create trigger trg_posts_updated
  before update on public."Posts"
  for each row execute procedure public.handle_updated_at();

create trigger trg_comments_updated
  before update on public."Comments"
  for each row execute procedure public.handle_updated_at();

-- Keep MitingQuestions.upvote_count in sync with QuestionUpvotes rows
create or replace function public.sync_upvote_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public."MitingQuestions"
    set upvote_count = upvote_count + 1
    where id = NEW.question_id;
  elsif (TG_OP = 'DELETE') then
    update public."MitingQuestions"
    set upvote_count = greatest(upvote_count - 1, 0)
    where id = OLD.question_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger trg_upvote_count
  after insert or delete on public."QuestionUpvotes"
  for each row execute procedure public.sync_upvote_count();

-- Auto-create a Users profile row whenever a new auth.users entry is created
create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public."Users" (auth_id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();