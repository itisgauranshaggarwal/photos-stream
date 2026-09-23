-- ============================================================
-- PhotoStream — 01_schema.sql
-- Run this file FIRST in: Supabase Dashboard → SQL Editor → Run
-- Creates: profiles, posts, post_photos, votes + triggers.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------
-- profiles — one row per signed-up user (created by an auth trigger)
-- ------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique not null,
  display_name text,
  bio          text not null default '',
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- Auto-create a profile when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'user_name',
      'user_' || substr(replace(new.id::text, '-', ''), 1, 10)
    ),
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New User'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------------
-- posts — a moment: title + description + up to 25 photos
-- ------------------------------------------------------------------
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  cover_full  text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_posts_created on public.posts (created_at desc);
create index if not exists idx_posts_author  on public.posts (author_id);

-- Keep updated_at fresh on edits.
create or replace function public.touch_post()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_posts_touch on public.posts;
create trigger trg_posts_touch
  before update on public.posts
  for each row execute procedure public.touch_post();

-- ------------------------------------------------------------------
-- post_photos — one row per image (full + thumbnail storage paths)
-- ------------------------------------------------------------------
create table if not exists public.post_photos (
  id           bigint generated always as identity primary key,
  post_id      uuid not null references public.posts (id) on delete cascade,
  storage_path text not null,
  thumb_path   text not null default '',
  position     int  not null default 0,
  created_at   timestamptz not null default now(),
  unique (post_id, position)
);

create index if not exists idx_photos_post on public.post_photos (post_id, position);

-- ------------------------------------------------------------------
-- votes — the single Like / Dislike per user per post
--   vote =  1 → Like
--   vote = -1 → Dislike
-- The PRIMARY KEY (post_id, user_id) makes "one vote per user" a law.
-- ------------------------------------------------------------------
create table if not exists public.votes (
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  vote       smallint not null check (vote in (1, -1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists idx_votes_post on public.votes (post_id);