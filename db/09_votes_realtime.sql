-- 09_votes_realtime.sql
-- M5: put `votes` into the realtime publication so Like/Dislike count
-- changes stream to open tabs (post viewer + feed cards) via supabase-js.
-- Run once in the SQL editor (History panel will show it as ran).
-- Idempotent: skips if `votes` is already a member of the publication.
do $$
begin
  if not exists (
    select 1 from pg_publication p
    join pg_publication_tables t on t.pubname = p.pubname
    where p.pubname = 'supabase_realtime'
      and t.schemaname = 'public' and t.tablename = 'votes'
  ) then
    alter publication supabase_realtime add table public.votes;
  end if;
end $$;