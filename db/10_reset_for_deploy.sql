-- ============================================================
-- PhotoStream — 10_reset_for_deploy.sql
-- Run BEFORE the public launch to ship a fresh, empty wall.
--   · wipes every profile (all accounts)
--   · wipes every post, photo row and vote (the demo + test content)
--   · see note below for clearing the `photos` storage bucket
-- Destructive on purpose — there is no undo. The DB keeps its
-- schema, RLS, RPCs and the realtime publication intact, so the
-- site starts from "new" but fully working on the first visitor.
-- ============================================================
--
-- STORAGE FIRST (Supabase blocks `delete from storage.objects` —
-- it must be done through the Storage API):
--   Two options:
--   a) Dashboard → Storage → `photos` bucket → select all →
--      Delete. (Easiest.)
--   b) In the SQL Editor, the guarded one-liner below. If it
--      errors, use option (a).
--
--   select storage.empty_bucket('photos');
-- ============================================================

-- 1) Votes, photo rows, posts (explicit, even though cascades would do it)
delete from public.votes;
delete from public.post_photos;
delete from public.posts;

-- 2) Contact messages (optional — wipe them too for a truly clean slate)
delete from public.contact_messages;

-- 3) Profiles (one row per account)
delete from public.profiles;

-- 4) Auth users (the actual accounts; cascades profiles above)
delete from auth.users;

-- 5) Reset id sequences so fresh rows start clean
alter sequence public.post_photos_id_seq restart with 1;