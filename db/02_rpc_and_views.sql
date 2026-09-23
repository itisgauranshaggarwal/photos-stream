-- ============================================================
-- PhotoStream — 02_rpc_and_views.sql
-- Run this file SECOND in: Supabase Dashboard → SQL Editor → Run
-- Creates: toggle_vote (Like/Dislike cycle), feed_posts (Top/New),
--          personal_feed (For You — votes reshape your feed).
-- ============================================================

-- ------------------------------------------------------------------
-- Vote toggle — atomic Like ↔ Dislike cycle.
-- One call per click. Deletes the old vote, then upserts the new one,
-- in a single transaction → no double votes, instant switching.
-- ------------------------------------------------------------------
create or replace function public.toggle_vote(p_post_id uuid, p_vote int)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'must be authenticated';
  end if;
  if p_vote not in (1, -1) then
    raise exception 'invalid vote value';
  end if;

  delete from public.votes
   where post_id = p_post_id and user_id = v_user_id;

  insert into public.votes (post_id, user_id, vote)
  values (p_post_id, v_user_id, p_vote)
  on conflict (post_id, user_id)
  do update set vote = excluded.vote, updated_at = now();
end;
$$;

-- ------------------------------------------------------------------
-- feed_posts — global feed used by Top / New (and anonymous For You).
-- ------------------------------------------------------------------
create or replace view public.feed_posts as
select
  p.id,
  p.title,
  p.description,
  p.cover_full,
  p.created_at,
  p.updated_at,
  pr.username                                  as author_username,
  coalesce(pr.avatar_url, '')                  as author_avatar,
  count(v.*) filter (where v.vote =  1)        as likes,
  count(v.*) filter (where v.vote = -1)        as dislikes,
  coalesce(sum(v.vote), 0)                     as score
from public.posts p
join public.profiles pr on pr.id = p.author_id
left join public.votes v on v.post_id = p.id
group by p.id, pr.username, pr.avatar_url;

-- Security hardening: views default to SECURITY DEFINER (run with the
-- *owner's* privileges, bypassing RLS). Flip feed_posts to SECURITY
-- INVOKER so Postgres + RLS evaluate it as the *querying* user.
-- (Requires PostgreSQL 15+ — Supabase is fine.)
alter view public.feed_posts set (security_invoker = on);

-- ------------------------------------------------------------------
-- personal_feed — the heart of "For You".
--
-- Every vote you make teaches the feed about the AUTHOR behind it:
--   like a post   → that author's posts RISE to the top of your wall
--   dislike a post→ that author's posts SINK to the bottom
--   no vote       → neutral, chronological position
--
-- Nothing is ever filtered out — downranked posts are still reachable
-- by scrolling. And the Like↔Dislike cycle is the dial: switch a vote
-- and the author's position updates automatically.
-- ------------------------------------------------------------------
create or replace function public.personal_feed(
  u_id     uuid,
  p_limit  int default 48,
  p_offset int default 0
)
returns table(
  id              uuid,
  title           text,
  description     text,
  created_at      timestamptz,
  author_username text,
  cover_full      text,
  likes           bigint,
  dislikes        bigint,
  score           bigint,
  affinity        bigint
)
language sql
stable
as $$
  with signed as (
    select pp.author_id,
           sum(case when v.vote = 1 then 1 else -1 end)::bigint as affinity
    from public.votes v
    join public.posts pp on pp.id = v.post_id
    where v.user_id = u_id
    group by pp.author_id
  )
  select
    p.id,
    p.title,
    p.description,
    p.created_at,
    pr.username,
    p.cover_full,
    count(v.*) filter (where v.vote = 1),
    count(v.*) filter (where v.vote = -1),
    coalesce(sum(v.vote), 0),
    coalesce(s.affinity, 0)
  from public.posts p
  join public.profiles pr on pr.id = p.author_id
  left join public.votes v on v.post_id = p.id
  left join signed s on s.author_id = p.author_id
  group by p.id, pr.username, p.cover_full, p.created_at, s.affinity
  order by coalesce(s.affinity, 0) desc, p.created_at desc
  limit p_limit offset p_offset;
$$;

-- ------------------------------------------------------------------
-- Hardening: lock down who may call the RPCs.
-- Both require auth anyway (toggle_vote raises unless a session exists;
-- personal_feed is only queried by home.js for a signed-in user), so we
-- revoke PUBLIC and grant to `authenticated` only.
-- ------------------------------------------------------------------
revoke all on function public.toggle_vote(uuid, int) from public;
revoke all on function public.personal_feed(uuid, int, int) from public;
grant execute on function public.toggle_vote(uuid, int) to authenticated;
grant execute on function public.personal_feed(uuid, int, int) to authenticated;