-- Enable Realtime only on tables that need live updates.
-- Votes is intentionally excluded — students use polling (refetchInterval).
-- AuditLogs and SystemSettings are excluded — admin fetches on demand.
alter publication supabase_realtime add table public."Posts";
alter publication supabase_realtime add table public."Comments";
alter publication supabase_realtime add table public."MitingQuestions";
alter publication supabase_realtime add table public."QuestionUpvotes";
alter publication supabase_realtime add table public."Notifications";