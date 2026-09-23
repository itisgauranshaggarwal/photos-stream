-- ============================================================
-- PhotoStream — 06_diagnose.sql (single-table version)
-- Run this WHOLE file in Supabase → SQL Editor → Run.
-- Only ONE result grid appears. Copy the ENTIRE table and
-- paste it back to the assistant.
-- ============================================================

with d as (
  select
    (select count(*) from storage.buckets where id = 'photos')                                   as bucket_photos,
    (select count(*) from pg_policies
       where schemaname = 'storage' and tablename = 'objects'
         and cmd = 'INSERT' and policyname like 'photos_%')                                      as storage_insert_policy,
    (select count(*) from pg_policies
       where schemaname = 'storage' and tablename = 'objects'
         and cmd = 'DELETE' and policyname like 'photos_%')                                      as storage_delete_policy,
    (select count(*) from pg_proc where proname = 'email_for_login')                             as email_for_login_rpc,
    (select count(*) from pg_policies
       where schemaname = 'public' and tablename = 'posts' and cmd = 'INSERT')                   as posts_insert_policy,
    (select count(*) from public.profiles)                                                       as profiles,
    (select count(*) from public.profiles p join auth.users u on u.id = p.id)                    as matched_profiles,
    (select count(*) from public.posts)                                                          as real_post_rows
)
select 'B1 bucket_photos'                item, d.bucket_photos            found from d
union all select 'B2 storage_insert_policy'   , d.storage_insert_policy       from d
union all select 'B3 storage_delete_policy'   , d.storage_delete_policy       from d
union all select 'B4 email_for_login_rpc'     , d.email_for_login_rpc         from d
union all select 'B5 posts_insert_policy'     , d.posts_insert_policy         from d
union all select 'C1 matched_profiles'        , d.matched_profiles            from d
union all select 'C2 real_post_rows'          , d.real_post_rows              from d;