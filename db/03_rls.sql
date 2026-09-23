-- ============================================================
-- PhotoStream — 03_rls.sql
-- Run this file THIRD in: Supabase Dashboard → SQL Editor → Run
-- Security: anyone can READ published content; only the owner
-- can write, edit or delete their own stuff. Votes are per-user.
-- ============================================================

alter table public.profiles    enable row level security;
alter table public.posts       enable row level security;
alter table public.post_photos enable row level security;
alter table public.votes       enable row level security;

-- ---------- profiles ----------
create policy "profiles_read"   on public.profiles for select using (true);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- ---------- posts ----------
create policy "posts_read"   on public.posts for select using (true);
create policy "posts_insert" on public.posts for insert with check (auth.uid() = author_id);
create policy "posts_update" on public.posts for update using (auth.uid() = author_id);
create policy "posts_delete" on public.posts for delete using (auth.uid() = author_id);

-- ---------- post_photos ----------
create policy "photos_read" on public.post_photos for select using (true);
create policy "photos_insert" on public.post_photos for insert
  with check (exists (
    select 1 from public.posts where id = post_id and author_id = auth.uid()
  ));
create policy "photos_delete" on public.post_photos for delete
  using (exists (
    select 1 from public.posts where id = post_id and author_id = auth.uid()
  ));

-- ---------- votes ----------
create policy "votes_read"  on public.votes for select using (true);
create policy "votes_write" on public.votes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- verify ----------
-- The lines below should print 'ready'. If they error, re-check the file above.
select 'RLS applied OK' as status;