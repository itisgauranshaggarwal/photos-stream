-- ============================================================
-- PhotoStream — 11_contact_messages.sql
-- Run in: Supabase Dashboard → SQL Editor → Run
--
-- Contact page storage: the signed-in visitor writes a message
-- and it's saved here, keyed to their account (their sign-up
-- email is captured on the row so the site owner can reply).
-- Owner reads the rows in the Table Editor / a simple select.
-- ============================================================

create table if not exists public.contact_messages (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  email      text not null,
  message    text not null check (char_length(message) between 10 and 5000),
  created_at timestamptz not null default now()
);

create index if not exists idx_contact_created on public.contact_messages (created_at desc);
create index if not exists idx_contact_user on public.contact_messages (user_id);

-- RLS: a signed-in user can insert their own message and read their
-- own rows; nothing is public. (The site owner reads all rows via the
-- dashboard, which bypasses RLS.)
alter table public.contact_messages enable row level security;

drop policy if exists contact_insert_own on public.contact_messages;
create policy contact_insert_own
  on public.contact_messages for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists contact_select_own on public.contact_messages;
create policy contact_select_own
  on public.contact_messages for select
  to authenticated
  using (user_id = auth.uid());