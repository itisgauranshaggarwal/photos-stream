-- ============================================================
-- PhotoStream — seed.sql
-- Run this file LAST in: Supabase Dashboard → SQL Editor → Run
-- Adds 2 demo authors + 6 warm demo moments so the feed isn't
-- empty while you build (deletes/re-runs are safe — ON CONFLICT).
-- ============================================================

do $$
declare
  maya_id  uuid := '11111111-1111-1111-1111-111111111111';
  arjun_id uuid := '22222222-2222-2222-2222-222222222222';

  -- small warm SVG placeholders (no storage needed for demo posts)
  svg_lake    text := 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="%23ffb74d"/><stop offset="1" stop-color="%23ff6a3d"/></linearGradient></defs><rect width="800" height="600" fill="url(%23g)"/><text x="400" y="350" font-size="130" text-anchor="middle">🌅</text></svg>';
  svg_cookie  text := 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="%23f2c28a"/><stop offset="1" stop-color="%23b8743d"/></linearGradient></defs><rect width="800" height="600" fill="url(%23g)"/><text x="400" y="350" font-size="130" text-anchor="middle">🍪</text></svg>';
  svg_snow    text := 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="%23d7ecfb"/><stop offset="1" stop-color="%237fb3e0"/></linearGradient></defs><rect width="800" height="600" fill="url(%23g)"/><text x="400" y="350" font-size="130" text-anchor="middle">❄️</text></svg>';
  svg_mount   text := 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="%239adfc4"/><stop offset="1" stop-color="%233c9d82"/></linearGradient></defs><rect width="800" height="600" fill="url(%23g)"/><text x="400" y="350" font-size="130" text-anchor="middle">🏔</text></svg>';
  svg_brunch  text := 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="%23ffe1c2"/><stop offset="1" stop-color="%23f4a261"/></linearGradient></defs><rect width="800" height="600" fill="url(%23g)"/><text x="400" y="350" font-size="130" text-anchor="middle">☕</text></svg>';
  svg_beach   text := 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="%23ffd670"/><stop offset="1" stop-color="%2338b6ff"/></linearGradient></defs><rect width="800" height="600" fill="url(%23g)"/><text x="400" y="350" font-size="130" text-anchor="middle">🏖</text></svg>';
begin
  -- ----------------------------------------------------------------
  -- 1) demo users (the auth trigger makes their profiles too)
  -- ----------------------------------------------------------------
  if not exists (select 1 from auth.users where id = maya_id) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data
    ) values (
      '00000000-0000-0000-0000-000000000000', maya_id,
      'authenticated', 'authenticated', 'maya@photostream.demo',
      crypt('photostream-demo', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Maya Kapoor","user_name":"maya.k"}'::jsonb
    );
  end if;

  if not exists (select 1 from auth.users where id = arjun_id) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data
    ) values (
      '00000000-0000-0000-0000-000000000000', arjun_id,
      'authenticated', 'authenticated', 'arjun@photostream.demo',
      crypt('photostream-demo', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Arjun Kapoor","user_name":"arjun.k"}'::jsonb
    );
  end if;

  -- defensive: profiles exist even if the trigger was skipped
  insert into public.profiles (id, username, display_name)
  values (maya_id,  'maya.k',  'Maya Kapoor'),
         (arjun_id, 'arjun.k', 'Arjun Kapoor')
  on conflict (id) do nothing;

  -- ----------------------------------------------------------------
  -- 2) demo moments (warm placeholders — real photos arrive in M4)
  -- ----------------------------------------------------------------
  insert into public.posts (id, author_id, title, description, cover_full, created_at) values
    ('aaaaaaaa-0000-0000-0000-000000000001', maya_id,
     'Golden hour at the lake',
     'We packed sandwiches and stayed till the sun went down. Best evening this month.',
     svg_lake, now() - interval '2 hours'),
    ('aaaaaaaa-0000-0000-0000-000000000002', maya_id,
     'Grandma''s secret cookies',
     'Third attempt, still not the real thing — but the kitchen smelled amazing.',
     svg_cookie, now() - interval '1 day'),
    ('aaaaaaaa-0000-0000-0000-000000000003', arjun_id,
     'First snow of the year',
     'Woke up to everything white outside. The kids did not go to school happily.',
     svg_snow, now() - interval '2 days'),
    ('aaaaaaaa-0000-0000-0000-000000000004', arjun_id,
     'Trip to the mountains',
     'Four hours of driving for this view. Worth every minute of it.',
     svg_mount, now() - interval '4 days'),
    ('aaaaaaaa-0000-0000-0000-000000000005', maya_id,
     'Sunday brunch, just us',
     'No plans, no rush. Coffee went cold twice and nobody cared.',
     svg_brunch, now() - interval '6 days'),
    ('aaaaaaaa-0000-0000-0000-000000000006', arjun_id,
     'The kids at the beach',
     'They promised to behave. The ocean had other plans.',
     svg_beach, now() - interval '9 days')
  on conflict (id) do nothing;

  raise notice 'PhotoStream seeded: 2 demo users, 6 demo posts.';
end $$;

-- quick check — should return 6 rows
select count(*) as demo_posts from public.posts;