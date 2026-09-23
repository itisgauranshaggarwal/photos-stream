-- ============================================================
-- PhotoStream — 05_login.sql
-- Run in: Supabase Dashboard → SQL Editor → Run
-- Lets the app resolve a *username* to its hidden login email
-- (security definer: the client never reads auth.users directly).
-- Returns NULL when nothing matches, so sign-in stays safe.
-- ============================================================

create or replace function public.email_for_login(p_identifier text)
returns text
language sql security definer set search_path = auth, public
stable
as $$
  select u.email
  from auth.users u
  where u.email = p_identifier
     or u.id = (select id from public.profiles where username = p_identifier)
  limit 1
$$;

-- If the line below prints 'ready' you're good.
select 'login helper ready' as status;