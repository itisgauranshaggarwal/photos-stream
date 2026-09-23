# 📸 PhotoStream — Project Report & Build Documentation (v2 plan)

| Field | Value |
|---|---|
| **Project name** | PhotoStream |
| **Version** | 4.0 — build-status update (supersedes parts of the v2/3 plan below) |
| **Date** | 2026-09-22 |
| **Type** | Web application — photo publishing, discovery & **personalized feed** |
| **Build cost** | **$0.00/month** |
| **Audience** | Beginners + any agentic AI (executable build brief) |

**Revision note (v3):** design pivoted from dark neomorphism → **light, Pinterest-inspired** white-on-gray UI with coral (#e60023) accent. Added a personalized feed; image-quality-first compressor; a full Known Issues & Fixes section; and the vanilla stack (below). Requirements were incorporated.

**Revision note (v4 — READ FIRST):** the plan below was executed. The design pivot changed AGAIN during build — the shipped UI is the **postcard-correspondence world** (paper cards, postal blue, Archivo, dual theme), NOT the Pinterest/coral design of §11. Auth shipped as **username-first (email + password, email hidden)** — magic-link and Google were **dropped by owner decision**; phone OTP was evaluated and rejected (~$0.01/SMS, not free). **§0 below is the current truth** for any new context window; treat §10/§11/§14 as historical plan where they conflict.

Stack: **vanilla HTML/CSS/JS SPA**; hosting Vercel → **Cloudflare Pages**; added a **personalized feed** (posts you like/dislike affect what shows up in your feed).

---

## 0. BUILD STATUS (v4 — current truth, for continuing work)

**Repo/path:** `D:\Star\Tuff Stuff 💪\5. Ai Automation and Orchestration\agentic codes\photos-stream` (git repo; commit only when owner asks).
**Commands:** `npm run dev` (5173) · `npm run build` · `npm run check` (node --check all files) · `npm run preview` (4173). Verify with: `npm run check && npm run build` + preview HTTP 200.

### 0.1 DONE (code-complete & verified this session)

**M0 scaffold** — Vite + vanilla ESM; `supabase.js` client singleton (`persistSession: true`); `.env`/`.env.example` carry real project (`aychfjzhvarbpdgdcqgf.supabase.co`) + valid anon key.

**M1 database** — `db/01_schema.sql` (profiles/posts/post_photos/votes + `handle_new_user` trigger reads `user_name`/`full_name` metadata), `db/02_rpc_and_views.sql` (`toggle_vote`, `personal_feed`, `feed_posts` view), `db/03_rls.sql`, `db/seed.sql` (6 demo posts using `data:` covers, no post_photos rows), **private bucket `photos`**. **Owner confirmed all run.**

**M2 feed + viewer** — `views/home.js` masonry feeds (`#/feed` For You · `#/top` · `#/new`), `components/card.js` (stamp avatar → profile, plate caption, dated small caps, signed-URL covers via `lib/urls.js`: 55-min cache, `applyImage`, `attachRefresh` re-fetch on error). `views/post.js` photostrip: ←/→ nav, `1 / N` counter, thumbnails, full lightbox (ESC/arrows), letterhead, not-found state, single-cover fallback.

**M3 auth (username-first — superseded the plan's §10)** — `views/login.js`: Sign in ("Username or email" + password; username resolved via `db/05_login.sql` `email_for_login` security-definer RPC) / Sign up (username `^[a-z0-9_.]{2,20}$` auto-lowercased, optional display name, email = hidden key, password ≥6 ×2, live duplicate check, passes `user_name`+`full_name` to signUp for the trigger) / Forgot → `resetPasswordForEmail` → `views/password.js` at `#/set-password` (PASSWORD_RECOVERY → `updateUser`). Confirm-email was turned OFF by owner → instant sessions. **Google/magic-link/phone: removed.** Top bar: person **icon** (was a text pill, owner request) → dropdown menu (display name + email sub, My posts, Sign out) in `lib/auth.js` (outside-click/Esc/hashchange close, listener cleanup on re-render). `views/me.js` wall: stamp-lg header, manage rows, inline "Sure?" delete (storage + rows), empty wall; `views/profile.js` public gallery.

**M4 upload (code-complete)** — `lib/compress.js` (any image → WebP, long edge ≤1920, q0.82, PNG alpha preserved, null on failure). `views/upload.js` (route `#/upload`, also serves `#/edit/:id`): title ≤120, desc ≤2000, 1–25 photo grid with live tiles + remove, compress → upload to `photos/<uid>/<uuid>.webp` → insert `posts` (`cover_full` = first path) + `post_photos` (1-based positions) → toast → land on `#/post/:id`. Edit mode: owner check, load existing tiles with signed URLs, remove deletes storage + row immediately, append new photos after max position. Storage policies shipped as `db/04_storage.sql` (authenticated insert/delete own folder) — **owner confirmed run**.

**Design (superseded §11)** — `styles.css` v5 **postcard world**: dual theme via `html[data-theme]` + `lib/theme.js` (localStorage); dark `#191512` / light `#e9e8e4`; paper cards `#efe9dc`/`#fcfbf8`, ink `#211c16`; accent postal blue `#2e4a96` (light) / `#93b4f0` (dark); airmail `repeating-linear-gradient` (deliberate; `impeccable detect` keeps 1 advisory, 0 anti-patterns); Archivo only font; radii post 3/img 2/ctl 6; stamp avatars (dashed square −4°); **functional text floor 11px** (raised from 10/9.5 to pass detect). Intro landing `views/intro.js` + `lib/reveal.js` (IntersectionObserver reveals, auto-flip demo, reduced-motion gated); footer holds the **single** "Share a moment" CTA (owner decision; empty-feed keeps one contextual button — disclosed, no objection); motion: transform/opacity only, ease-out `cubic-bezier(0.23,1,0.32,1)`, 450ms reveals / 550ms flip / 150ms UI. Impeccable direction: seed key `4b69590b`, candidate 6 = postcard correspondence; brief at `.impeccable\surfaces\views-intro-js.md`; declined-challenger disciplines donated (plate caption, held rotation, inked votes, dated small caps, brightness hover); HyperCard kept as reserve alternate. `DESIGN.md` records it.

**Fixes this session (owner-reported bugs)** — toast error/ok colors were light-on-light → now `--dislike`/`--like` (readable both themes); guest/anonymous access **removed** (login page, menu, docs) per owner; "Sign in" text pill → person icon; `stampedDate` centralized in `lib/dom.js` (was missing → would have thrown); leftover junk exports removed; auth.js document-listener leak fixed.

**Docs** — `README.md` (M0–M5 ticked), `PRODUCT.md` ("M0–M3 done… M4–M6 pending" then M4 added), `DESIGN.md`, `db/06_diagnose.sql` (single-table Supabase diagnostic — owner ran it: **all green**: bucket, both storage policies, RPC, posts policy, 3/3 profiles matched, 6 seed posts).

**M5 votes + personal feed (code-complete)** — `components/votebutton.js` (`voteControl(): {node, patch}` — three states idle/like-on/dislike-on, optimistic counts with rollback on error, 300ms debounce, guest → "Sign in to vote." toast, `votePop` animation respecting `prefers-reduced-motion`, thumb SVG rotated for dislike, `is-on.like`/`is-on.dislike` colors from design tokens). `lib/vote.js` (`toggleVote` RPC wrapper, `removeVote` — direct table delete because `toggle_vote` only sets 1/-1 and always leaves a row; `myVoteOn` hardened via `getSignedInUser`; `subscribeVotes(postIds, cb)` realtime channel with per-post `postgres_changes` filters + unsubscribe). Wired into `views/post.js` (replaces static vmarks; fetches `myVote` on view load; subscribes realtime → refetch `feed_posts` row → `vote.patch`; disposes on `hashchange`). Feed cards: `patchCardCounts()` + `views/home.js` `watchCounts()` — realtime bucket for visible post ids, refetches counts and patches `.counts` text live (cards stay non-interactive display; voting is on the post viewer). **`db/09_votes_realtime.sql`** adds `votes` to the `supabase_realtime` publication (idempotent) — **owner ran it, votes user-tested & working.** `personal_feed` affinity reshuffle already wired via `home.js loadFeed` + RPC. `check`+`build` green.

**M6 polish + responsive (code-complete, M7 partial folded in)** — the full owner-requested polish sweep. **Info pages** `views/info.js` (About / Contact / Privacy / Terms) redesigned as **postcards** (airmail stripe, dashed "PS" stamp, ink-on-paper letter body, signature foot). **Contact page** works: signed-in visitors write a message that is saved to the new **`contact_messages` table** (`db/11_contact_messages.sql`) keyed to their account + sign-up email; owner-setup **`db/12_contact_email_resend.sql`** adds a `notify_contact_email` trigger that posts each new row to the Resend API (`pg_net` + Vault secret `RESEND_API_KEY`) so messages land in the owner's inbox; direct contact email `itisgauranshaggarwal@gmail.com` is shown with "suggestions, bugs, share your experience" copy; guests see a sign-in prompt. **Footer** fixed: About/Contact/Privacy/Terms previously had zero styling (raw default links — the "odd one out"); both link groups now share `.footer-nav` styling, stacked as labeled "Browse" / "Info" columns. Privacy page now states honestly that PhotoStream is a hobby side project with best-effort (not guaranteed) storage security. **Custom 404** `views/notfound.js` ("This stamp was never cancelled.") + router fallback for unknown hashes and any view crash. **Human-friendly errors** `lib/errors.js` (`friendlyError` remaps Supabase messages, `authError` for sign-in flows) wired into every view's load/save path with **retry** (emptyState `onRetry` re-mounts the view). **Empty states** `components/empty.js` (title + CTA/retry). **Confirmation dialogs** `components/confirm.js` (`confirmDialog`: focus trap, Esc/Enter, overlay-click cancel, `view-locked` scroll lock) — my-posts delete now confirms first. **Inline form validation** `lib/form.js` (`showField`/`autoClear`: per-field `.field-error` + `aria-invalid` + `role=alert`) on sign in / sign up / reset / set-password / upload (title + ≥1 photo) / contact. **Loading states** post-view ad-hoc skeleton (feed grids already had `skeletonGrid`). **Offline handling** offline banner (`#net-banner` + `bootNetworkBanner()`, "online" event). **Accessibility** skip-link, `aria-live`/`role=alert` toasts+errors, labelled buttons/figure controls. **SEO basics** (a downpayment on M7): per-route `<title>`/description/Open Graph in `main.js applyMeta`, canonical + OG meta seeds in `index.html`, `public/robots.txt` + `public/sitemap.xml`. **Responsive** footer info links wrap + confirm dialog stacks on small screens. Plus two latent bugs fixed: `canonical href="/"` made **Vite build crash** (`EISDIR` — Vite tries to read `/` as an asset) → changed to absolute `https://photostream.site/`; and the **`set-password` route key** was missing from the VIEWS map (reset landing would've hit the 404 fallback) → added. Fixed contact page showing About's copy on all four info routes (router now passes `name` in params). **`db/10_reset_for_deploy.sql`** added — run per owner instruction to wipe all accounts + demo/test content for a fresh launch. `check`+`build` green (74 modules), `dist/` ships `robots.txt` + `sitemap.xml`.

### 0.2 Bugs found & fixed this session (owner-tested)

1. **Share-a-moment bounce → FIXED (owner confirmed ✅).** Guard read a cached session while live auth showed a user. Root cause: stale `sb-<ref>-auth-token` localStorage + cached-session desync. Fix: new **`lib/session.js` → `getSignedInUser(supabase)`** — 3× `getSession()` then 3× `getUser()` (server-validated access token) with 350ms spacing, returns user or null. Wired into `views/upload.js` guard + `requireAuth()` (`lib/auth.js`, so `me.js` benefits). Owner tested: **"It worked!"** → reached New-moment screen, uploaded photos.
2. **Uploaded photos show alt text in feed cards → FIXED (owner confirmed ✅ after running db/07).** After upload, the post card appeared but the image area showed breakage. Verified via REST debug (anon key, same as app): the stored `cover_full` path is `c1f131a9‑…/9cd…webp` (no `photos/` prefix — consistent everywhere, correct bucket-relative form), and `createSignedUrl` for that REAL object returned **`NoSuchKey`**. Root cause: `db/04_storage.sql` added only **insert/delete** policies on `storage.objects`; **there is no SELECT policy**, and RLS hides every object for read → signed-URL creation (a read) fails → `signedUrl()` falls back to the raw path → broken `<img>` → alt text. **Fix: `db/07_storage_read.sql`** (public `SELECT` policy on `photos`; paths are UUID-guarded so this is effectively "public only by known path"). Also added a `console.warn("[urls] sign failed…")` diagnostic in `lib/urls.js`. `check`+`build` green. **Owner ran `db/07` and confirmed photos render.**

### 0.3 REMAINING (not started)

- **M6 deploy** — Cloudflare Pages (preset None, `npm run build`, `dist`, two env vars), add `*.pages.dev` origin to Supabase URL Configuration, real-phone E2E, §18 keepalive workflow. (Code-side polish is done; only the deploy steps remain.)
- **M7 SEO (free)** — partially folded into M6 (per-route meta/OG + `robots.txt` + `sitemap.xml` already shipped). Still to do: clean URLs / `_redirects`, JSON-LD, Google Search Console (DNS-TXT verify) + Bing, Core Web Vitals (`width`/`height`, lazy-load). Full checklist in §14 M7.
- **M8 contributions (optional, fees)** — Stripe; attribution via Cloudflare Pages Function + `contributions` table; OFF by default. Full checklist in §14 M8.
- **Deferred** `lib/thumb.js` 480px thumbs — big egress win (see §0.1 capacity note $/user math). Not blocking any milestone.

### 0.4 Owner-side setup — DONE vs. TODO

**DONE by owner:** ran `db/01–03` + `seed.sql` (M1), created private `photos` bucket, ran `db/04_storage.sql`, ran `db/05_login.sql`, ran `db/06_diagnose.sql` (all green), ran **`db/07_storage_read.sql`** (photo rendering unblocked), ran **`db/09_votes_realtime.sql`** (realtime publication — votes tested & working), **Confirm email → OFF**, providers Google/Phone OFF (never configured; owner told to ignore Google Cloud console).
**Owner-side TODO (next):** Contact email delivery: run **`db/12_contact_email_resend.sql`** in the SQL editor (emails each new Contact message to `itisgauranshaggarwal@gmail.com` via Resend — the current Contact page only *stores* messages in the `contact_messages` table, it does not email them). Two prerequisites per the file header: enable the `pg_net` + `supabase_vault` extensions, then `select vault.create_secret('re_XXX', 'RESEND_API_KEY');` with a free Resend API key (test `from` = `onboarding@resend.dev`; switch to a verified domain later). Then M6 deploy steps — create the Cloudflare Pages project (preset None, build `npm run build`, output `dist`, env vars `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`), add the `*.pages.dev` origin to Supabase → Authentication → URL Configuration, then real-phone E2E (§18). **Fresh-launch wipe:** when saying "go deploy", also run **`db/10_reset_for_deploy.sql`** in the SQL editor first (wipes every account + post + storage file for an empty wall).
**Status note (M6):** `npm run check` + `npm run build` green (74 modules); `dist/` includes `robots.txt` + `sitemap.xml`. Owner should `npm run preview` and walk the polish sweep (About/Contact/Privacy/Terms links in footer, offline toggle via DevTools, a delete confirmation, empty-wall state, invalid-form hints).

### 0.5 Cost/pricing decisions (settled, 2026 rates)

App = **$0/mo** today: Supabase Free (500MB DB, 1GB storage, 50k MAU, 5GB egress) + Cloudflare Pages (unlimited static bandwidth, 500 builds/mo). Google OAuth would've been $0 but **dropped**. Phone OTP never free (~$0.01–0.05/SMS + $1.15/mo Twilio number) → **dropped**. Email+password = free. Scaling path: Supabase **Pro $25/mo** (8GB DB, 100GB storage, 100k MAU, 250GB egress; overage $0.00325/MAU, $0.09/GB, $0.021/GB storage). Free projects pause after ~7 days idle → §G keep-alive workflow.

### 0.6 Verification harness (run after any change)

`npm run check && npm run build` → then preview server returns HTTP 200. `impeccable detect views/*.js` → target 0 anti-patterns (airmail-stripe advisory is accepted-by-design). Per-file `node --check` list lives in `package.json` (`check` script) — **add any new file there**.



---

## 1. Executive Summary

PhotoStream is a **“YouTube for photos.”** Users sign up, create **posts** of **1–25 photos** with a **title** and **description**, and publish to a public feed. Signed-in users can **Like** or **Dislike** any post — exactly **one vote per user**, switchable (the Like↔Dislike cycle). No comments in v1.

**The personal feed (new requirement):** every vote teaches the feed about you.
- Posts you **dislike** → posts *by that author* are pushed **to the bottom** of your **For You** feed.
- Posts you **like** → that author’s posts are **brought to the top**.
- Nothing is **banned** — down-ranked posts still exist, reachable by scrolling.
- Because tastes are derived from your votes, the Like↔Dislike cycle keeps your feed honest: switch a dislike to a like and the effect reverses automatically.

**Design (revised requirement):** “**light, Pinterest-inspired**” — white cards on soft gray, coral accent, rounded geometry, search bar in the top bar, masonry feed, mobile bottom bar. Mobile-First, responsive on phone/tablet/desktop. (Dark neomorphism was tried and dropped in v3.)

**Tech (decided — see §5.3 for reasoning):** pure **HTML + CSS + JavaScript (ES modules)** frontend, optional **Vite** for the dev server only, **Supabase** for database + auth + image storage, **Cloudflare Pages** for free hosting (unlimited static bandwidth).

Everything runs on **free tiers. The bill is $0.**

---

## 2. Project Vision

> “Anyone can publish a story told in photos. The community decides — by liking or disliking — which photos deserve attention, and **your feed quietly learns from your votes** so you always see more of what you like and less of what you don’t. Simple to post, simple to vote, simple to discover — no comments, no noise.”

---

## 3. Goals & Non-Goals (v1 scope)

### 3.1 Goals (v1 MUST have)
- [x] Anonymous visitors browse public feed and open any post.
- [x] Email magic-link + Google sign-in (passwordless).
- [x] Create a post: title (required), description (optional), 1–25 photos (required).
- [x] Photostrip viewer: thumbnails → full-screen click-through.
- [x] **Like/Dislike cycle:** exactly 1 vote/user/post, switchable, removable.
- [x] **Personalized feed (For You):** liked-author posts rise; disliked-author posts sink but are never banned; updates automatically when you vote.
- [x] Global sort tabs unaffected: **Top** (net score) and **New** (chronological).
- [x] Profile pages (public gallery) and own-post management (edit/delete).
- [x] **Image-quality-first compressor:** high quality output (WebP), tiny files (storage-smart), EXIF-rotation handled, thumbnails auto-generated.
- [x] **Design:** light Pinterest-style (white cards, coral accent), responsive mobile → desktop.
- [x] Responsive: build as website v1; PWA/native app path defined for v2.

### 3.2 Non-Goals (explicitly OUT of v1)
- ✗ Comments, replies, chat.
- ✗ Follows, notifications, DMs.
- ✗ Tags / hashtags / content search (title-search = stretch; see §20).
- ✗ Video.
- ✗ Reports/moderation dashboard (delete-own only).
- ✗ Native mobile app (v2 — see §9.6 PWA-ready note).
- ✗ Monetization / ads.

---

## 4. Target Users

| Persona | Need |
|---|---|
| Casual poster | Publish a photo set + title in under 60 seconds, no comment trolls. |
| Hobbyist photographer | A clean, judgment-based gallery (Like/Dislike), scores respected. |
| Scroller | Ad-free, image-first feed that learns what they like — “like a great album of photos you follow”. |
| Side-project learner | A real, deployed, $0 full-stack app built with plain web tech. |

---

## 5. Tech Stack & Free-Tier Limits

### 5.1 Chosen stack (final — do not deviate without updating this doc)

| Layer | Technology | Why |
|---|---|---|
| Frontend | **Plain HTML5 + CSS3 + Vanilla JS (ES modules)** | Zero framework failure modes; user’s explicit preference when unsure; still top-notch via crafted CSS |
| Dev server / bundler *(optional)* | **Vite** | Instant hot-reload dev; production output is plain static files |
| Backend-as-a-service | **Supabase** (Postgres + Auth + Storage) | SQL vote math, RLS security, image storage, all free |
| Hosting | **Cloudflare Pages** | **Unlimited free static bandwidth** (critical for photos); Git auto-deploy; custom domains |
| Repo | **GitHub** | Free, CI integration with Pages |
| Imagery | Canvas API → **WebP** (fallback JPEG) | ~80–90% smaller than original PNG/JPEG at near-identical quality |
| Icons | Inline **SVG** (hand-written) | No dependency; crisp on all screens |

### 5.2 Free-tier limits (must respect)

| Resource | Supabase Free | Keep-away constraint |
|---|---|---|
| Database size | 500 MB | Text rows only — photos never live here |
| Storage | 1 GB | WebP + 1600px cap keeps feed-light (~1.5 MB per 5-photo post) |
| Bandwidth | 5 GB / month | Offloaded: frontend on Cloudflare (unlimited); only image bytes + API hit Supabase |
| Auth users | 50,000 MAU | Far beyond v1 |
| Realtime | 200 concurrent | Only used for vote-count updates |

| Resource | Cloudflare Pages (Free) | Constraint |
|---|---|---|
| Bandwidth | **Unlimited** | Images can be served from Pages cache → spares Supabase bandwidth |
| Requests | Unlimited | Static assets only + API via Supabase direct |
| Builds | Unlimited (with Git) / 500 direct uploads | Fine |

> The clever split: **frontend HTML/JS runs on Cloudflare (unlimited)**; **only API calls and photo bytes hit Supabase**. This is why we chose Pages + vanilla, not Vercel + serverless.

### 5.3 Why plain HTML/CSS/JS (owner decision, locked)

- Next.js/React AI builds **kept failing** for you. The failure surface is almost always the toolchain: server components, cookies, middleware, build-time vs runtime, stale-lockfile hell.
- This app’s entire “backend” is **Supabase SDK calls + SQL** — the frontend is a thin client. There is nothing a framework adds that we need; everything a framework *can* break, we avoid.
- Outcome: fewer moving parts → higher chance it **works first time**, and a **human can read every file top to bottom**.
- Vite is optional sugar (nice dev server). The build output is still plain static files you could host anywhere.

---

## 6. System Architecture

```
                    BROWSER (mobile / tablet / desktop)
┌──────────────────────────────────────────────────────────────┐
│  Static app from Cloudflare Pages:  *.pages.dev              │
│   index.html · styles.css · main.js (ESM) · view/*.js        │
│   - Hash router (#/ #/post/id #/upload ...)                  │
│   - Feed, viewer, upload, profile, login                     │
│   - Canvas compressor (WebP) + thumbnail generator           │
│   - @supabase/supabase-js CDN (ESM)                          │
└──────────────┬──────────────┬────────────────────────────────┘
               │ API calls    │ Image uploads / signed URLs
               ▼              ▼
        ┌────────────────────────────┐
        │        SUPABASE            │
        │  Postgres  (profiles,      │
        │   posts, photos, votes)    │
        │   RLS + RPCs               │
        │  Auth (magic-link/Google)  │
        │  Storage bucket "photos"   │
        │   photos/<user>/<post>/…   │
        └────────────────────────────┘
                  ▲
                  │ GitHub push → Cloudflare auto-build+deploy

Key flows:
1. Browse  → Supabase SELECT via RLS (no login needed).
2. Upload  → client compresses to WebP + thumbnail → storage.upload() →
             RLS checks ownership → posts/photos rows.
3. Vote    → supabase.rpc("toggle_vote", {post_id, vote}) → transaction.
4. Feed    → "For You": rpc("personal_feed") → affinity-ranked.
             "Top"/"New": ordinary SQL views.
5. Live    → Realtime channel "votes" patch delta counts in open tabs.
```

### 6.1 Responsibilities
- **Postgres:** profiles, posts, photo rows (paths only), votes. Never image bytes.
- **Storage:** images in one private `photos` bucket; access via signed URLs.
- **Cloudflare Pages:** serves UI files (cache-first, immutable hashed assets).
- **Browser:** does all compression/resizing to protect storage & bandwidth.

---

## 7. Data Model (Database Schema)

### 7.1 Entities
```
profiles 1 ──── * posts 1 ──── * post_photos
                 posts 1 ──── * votes
```

### 7.2 DDL — run in Supabase SQL Editor, in order.

```sql
-- ============================================================
-- 01_profiles.sql
-- ============================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique not null,
  display_name text,
  bio          text not null default '',
  created_at   timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'user_name',
             'user_' || substr(replace(new.id::text, '-', ''), 1, 10)),
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New User')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 02_posts.sql
-- ============================================================
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  cover_full  text not null default '',   -- signed URL refreshed at read time
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_posts_created on public.posts (created_at desc);
create index idx_posts_author  on public.posts (author_id);

-- ============================================================
-- 03_post_photos.sql
-- ============================================================
create table if not exists public.post_photos (
  id           bigint generated always as identity primary key,
  post_id      uuid not null references public.posts (id) on delete cascade,
  storage_path text not null,                  -- photos/<user>/<post>/<i>.webp
  thumb_path   text not null default '',       -- …/<i>_thumb.webp
  position     int  not null default 0,
  created_at   timestamptz not null default now(),
  unique (post_id, position)
);
create index idx_photos_post on public.post_photos (post_id, position);

-- ============================================================
-- 04_votes.sql
-- ============================================================
create table if not exists public.votes (
  post_id   uuid not null references public.posts (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  vote      smallint not null check (vote in (1, -1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (post_id, user_id)          -- THE one-vote rule
);
create index idx_votes_post on public.votes (post_id);

create or replace function public.touch_post()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger trg_posts_touch before update on public.posts
  for each row execute procedure public.touch_post();

-- ============================================================
-- 05_rpc_and_views.sql
-- ============================================================
-- Vote toggle: atomic delete-then-insert = safe Like↔Dislike cycle.
create or replace function public.toggle_vote(p_post_id uuid, p_vote int)
returns void language plpgsql security definer set search_path = public as $$
declare v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'must be authenticated'; end if;
  if p_vote not in (1, -1) then raise exception 'invalid vote'; end if;

  delete from public.votes where post_id = p_post_id and user_id = v_user_id;
  insert into public.votes (post_id, user_id, vote)
  values (p_post_id, v_user_id, p_vote)
  on conflict (post_id, user_id)
  do update set vote = excluded.vote, updated_at = now();
end;
$$;

-- Global feed (used by Top / New; and as fallback for anonymous users).
create or replace view public.feed_posts as
select
  p.id, p.title, p.description, p.cover_full, p.created_at, p.updated_at,
  pr.username as author_username,
  coalesce(pr.avatar_url, '') as author_avatar,
  count(v.*) filter (where v.vote =  1) as likes,
  count(v.*) filter (where v.vote = -1) as dislikes,
  coalesce(sum(v.vote), 0)              as score
from public.posts p
join public.profiles pr on pr.id = p.author_id
left join public.votes v on v.post_id = p.id
group by p.id, pr.username, pr.avatar_url;

------------------------- PERSONAL FEED (core feature) ------------------------
-- Affinity: for a user u, how much net-positive/negative they feel about
-- EACH author, derived purely from u's own votes (like = +1, dislike = -1).
--
--   +N → liked their posts → their NEW posts rise to the top
--   -N → disliked their posts → their NEW posts sink to the bottom
--   0  → neutral → chronological position (still fully present: NOT banned)
create or replace function public.personal_feed(
  u_id    uuid,
  p_limit int default 48,
  p_offset int default 0
)
returns table(
  id uuid, title text, description text, created_at timestamptz,
  author_username text, cover_full text,
  likes bigint, dislikes bigint, score bigint, affinity bigint
) language sql stable as $$
  with signed as (
    select pp.author_id,
           sum(case when v.vote = 1 then 1 else -1 end)::bigint as affinity
    from public.votes v
    join public.posts pp on pp.id = v.post_id
    where v.user_id = u_id
    group by pp.author_id
  )
  select
    p.id, p.title, p.description, p.created_at,
    pr.username, p.cover_full,
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
```

> **Why “avoided but never banned”?** `ORDER BY affinity DESC` front-loads
> authors you like, chronologically fills the middle (affinity 0), and sinks
> authors you dislike to the bottom. Nothing gets filtered out — scroll far
> enough and every post is reachable. The Like↔Dislike cycle *is* the dial:
> switch a vote and the author’s position updates on the next feed query.

### 7.3 Row Level Security (RLS)

```sql
alter table public.profiles    enable row level security;
alter table public.posts       enable row level security;
alter table public.post_photos enable row level security;
alter table public.votes       enable row level security;

create policy "profiles_read"    on public.profiles for select using (true);
create policy "profiles_update"  on public.profiles for update using (auth.uid() = id);

create policy "posts_read"       on public.posts   for select using (true);
create policy "posts_insert"     on public.posts   for insert with check (auth.uid() = author_id);
create policy "posts_update"     on public.posts   for update using (auth.uid() = author_id);
create policy "posts_delete"     on public.posts   for delete using (auth.uid() = author_id);

create policy "photos_read"      on public.post_photos for select using (true);
create policy "photos_insert"    on public.post_photos for insert
  with check (exists (select 1 from public.posts where id = post_id and author_id = auth.uid()));
create policy "photos_delete"    on public.post_photos for delete
  using (exists (select 1 from public.posts where id = post_id and author_id = auth.uid()));

create policy "votes_read"       on public.votes for select using (true);
create policy "votes_write"      on public.votes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Storage bucket `photos` is **private**; uploads require a signed JWT; paths are
namespaced `photos/{user_id}/{post_id}/{i}` so users only touch their own folder
(check paths in the Storage policy):
```sql
-- Storage policy "authenticated can only upload to own folder"
-- condition: (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1])
```

---

## 8. Backend Logic — Invariants That Must Hold

1. **One vote per user per post** — PK `(post_id, user_id)` + `toggle_vote`.
2. **A post always has ≥ 1 photo** — enforced before the post row exists (validate file list = 1..25 client side, double-checked by route).
3. **Compression is mandatory, not optional** — a quality slider chooses three WebP presets (§11); every byte uploaded is already compressed.
4. **`cover_full`** = signed URL refreshed on read; feed also stores `thumb` paths for cards.
5. **Feed semantics**
   - **For You** → `personal_feed(uuid)` (affinity by author; see §7.2). Anonymous → falls back to `feed_posts` by recency.
   - **Top** → `ORDER BY score DESC, created_at DESC`.
   - **New** → `ORDER BY created_at DESC`.
6. **Orphan cleanup** — deleting a post deletes `post_photos` rows (cascade) and then `storage.remove()` of the whole `photos/{user}/{post}/` folder (deterministic path, one call, no listing).
7. **Signed URLs** expire after 1 h; any `<img>` that fails to load re-fetches a fresh URL on error (keeps albums working indefinitely).

---

## 9. Image Pipeline — “Top-Quality Compression”

The #1 storage risk was raw uploads. We solve it with a **quality-preserving compressor** that runs **in the browser**, before upload.

### 9.1 Pipeline steps (per chosen file)
1. **Decode** with EXIF-respect: `createImageBitmap(file, { imageOrientation: 'from-image' })` → auto-rotates phone photos. Fallback: `Image` + `drawImage` (older Safari).
2. **Downscale** long edge to `MAX = 1600 px` (display viewer max ~1200 px, retina-safe without paying for 12 MP). Feed cards use a separate **thumbnail**.
3. **Encode WebP** via `canvas.toBlob('image/webp', q)`.
   - Quality slider: **High q=0.90 · Medium q=0.78 · Low q=0.60**.
4. **Quality guard:** if any step throws or the buffer is empty (e.g. HEIC browser can’t decode), show an inline friendly error: *“This file type can’t be opened in your browser — please convert to JPG/PNG and retry.”* Never upload the original blindly if WebP fails — **fall back once to `image/jpeg` q=0.85**.
5. **Thumbnail:** a second pass at **480 px long edge**, WebP q=0.80 (~15–35 KB). Feed cards always load thumbs.

### 9.2 Expected sizes (conservative)
| Input (typical phone) | Output WebP (q0.78) | Thumb |
|---|---|---|
| 4 MP JPEG (~2.5 MB) | ~180–260 KB | ~20–35 KB |
| 12 MP JPEG (~4 MB) | ~300–450 KB | ~25–40 KB |

→ **~1.5 MB per 5-photo post** vs ~20 MB raw. 1 GB free storage ≈ **500+ full posts**. Bandwidth stays tiny because the feed almost always serves thumbs.

### 9.3 Progress UX
Upload screen shows per-file row: `file name ▸ compressing ▸ uploaded ✓` with live byte-reduction (`2.4 MB → 210 KB`). Nice-to-have that also proves the compressor works.

---

## 10. Authentication Flow

1. `/login`: email → `supabase.auth.signInWithOtp({ email })` magic link, or Google via `signInWithOAuth({ provider: 'google' })`.
2. Hash contains session → `supabase.auth.getSession()`; profile auto-created by trigger.
3. Guard: routes `#/upload` and `#/me` check session client-side and redirect with a toast.
4. Nav swaps Login ⇄ avatar dropdown once authed.

---

## 11. Design System — “Light Pinterest-style” (v3 revision)

The aesthetic: **white cards floating on soft gray, coral accent (#e60023), rounded geometry, a top-bar search field, and a masonry feed** — Pinterest-inspired, mobile-first, built with CSS only. (Dark “black neomorphism” was the original v2 direction, built in `styles.css`, then replaced in v3.)

### 11.1 Design tokens (`styles.css`)
```css
:root {
  /* palette */
  --bg:        #f2f2f3;   /* soft gray page */
  --surface:   #ffffff;   /* white cards & chrome */
  --surface-2: #f7f7f8;
  --line:      #ececef;
  --text:      #201a20;
  --text-dim:  #5f5f63;
  --accent:    #e60023;   /* Pinterest red */
  --accent-2:  #b8001d;
  --like:      #1d9c3f;   /* vote up green */
  --dislike:   #e60023;   /* vote down red */

  /* elevation */
  --shadow-1: 0 1px 3px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.05);
  --shadow-2: 0 2px 6px rgba(0,0,0,.08), 0 10px 24px rgba(0,0,0,.1);
  --shadow-fab: 0 6px 16px rgba(230,0,35,.35);

  /* geometry */
  --r-lg: 18px; --r-md: 14px; --r-sm: 10px; --r-pill: 999px;

  /* type */
  --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          "Helvetica Neue", Arial, sans-serif;
}
```

### 11.2 Recipes
- **Card:** `background:var(--surface); border-radius:var(--r-lg); box-shadow:var(--shadow-1);` hover → lift + `--shadow-2`, cover image scales to 1.04.
- **Active/hover chip** on cards: small dark pill ”View post” fading in top-right on hover.
- **Pill buttons:** `border-radius:var(--r-pill)`; primary = coral `--accent` with `--shadow-fab`.
- **Top bar:** white, sticky, `backdrop-filter:blur(12px)`, hairline bottom border, centered **search field** (signature Pinterest element).
- **Search field:** gray pill (#ebebee) → white + coral ring on focus.
- **Mobile bottom bar:** white frosted, floating coral **＋ round FAB** above it.

### 11.3 Components (hand-written, framework-free)
`avatar · pill-button · card · post-card · votebutton · toast · skeleton ·
modal (fullscreen photostrip) · fab (upload, mobile) · topbar · tabbar (mobile) ·
chips (sort tabs) · input · upload-row · stat-badge`

### 11.4 Motion (subtle, respectful)
- `card:hover` → `translateY(-2px)` + stronger shadow; cover scales 1.04.
- Press → scale 0.97.
- Vote toggle → a tiny pop on the count numeral.
- Skeletons use a soft shimmer sweep.
- `@media (prefers-reduced-motion: reduce)` disables all transitions.

### 11.5 Responsive layout
| Breakpoint | Feed columns | Nav |
|---|---|---|
| < 480 px (phone) | 2 (portrait cards) | top bar + **bottom white bar** (Home · Top · New · ➕ round FAB · Me) |
| 480–719 px (phone/tablet) | 2 | bottom bar is the primary nav |
| 720–1079 px (tablet) | 3 | desktop top bar: logo · search · chips · buttons |
| ≥ 1080 px (desktop) | 4, max-w 1360 | full top bar |

Masonry via CSS `columns` + `break-inside:avoid` (safe, no JS).

---

## 12. Pages / Routes (hash router — zero server config)

| Route | View | Auth |
|---|---|---|
| `#/` | **For You** feed (personalized) + sort chips (New / Top) | Public |
| `#/post/{id}` | Photostrip viewer + title/desc + vote buttons + author card | Public · vote=Auth |
| `#/upload` | Multi-file (1–25) with live compressor previews | Auth |
| `#/edit/{id}` | Same form; change desc/title, delete photos, add photos | Owner |
| `#/profile/{username}` | User gallery + bio | Public |
| `#/me` | My posts list + edit/delete + sign out | Auth |
| `#/login` | Magic-link + Google | Public |

> Hash routing: static hosts need zero redirect config, deep links always work,
> and an agent can’t misconfigure rewrites. (Clean URLs = documented v2 upgrade.)

---

## 13. API Surface (client → Supabase, no custom server)

| Call | What it does | Needs |
|---|---|---|
| `supabase.auth.*` | sign in/out, session | — |
| `supabase.rpc('personal_feed', { u_id })` | For You | auth (or fallback query) |
| `supabase.from('feed_posts').select().order(…)` | Top / New / anon feed | — |
| `supabase.rpc('toggle_vote', { p_post_id, p_vote })` | Like/Dislike | auth |
| `supabase.from('post_photos').select()` | photostrip paths | — |
| `storage.from('photos').upload(…)` | images + thumbs | auth + policy |
| `storage.from('photos').createSignedUrl(path, 3600)` | live URLs | — |
| `storage.from('photos').remove([...path])` | delete post folder | auth + RLS chain |

> By using the **public anon key client-side with RLS as the only trust anchor**,
> there is no custom backend to deploy, scale, or break.

---

## 14. Build Roadmap — Milestones (beginner + AI-agent executable)

Each milestone ends with a ✅ verifiable test. Work in repo `photos-stream`.

### M0 — Accounts & scaffold (≈ 30 min)
1. GitHub repo `photos-stream`. Sign up for **Supabase** (project → region near you) and **Cloudflare Pages**.
2. Scaffold files (this layout is final):
   ```
   photos-stream/
     index.html
     styles.css
     main.js            # bootstrap + hash router
     supabase.js        # client singleton
     views/  (home.js, post.js, upload.js, me.js, profile.js, login.js)
     components/ (votebutton.js, card.js, toast.js, skeleton.js)
     lib/ (compress.js, thumb.js, urls.js, auth.js, feed.js, vote.js)
     .env               # NEVER commit
   ```
3. `npm init -y && npm i -D vite` then `npm run dev` (Vite serves statics + proxies nothing; purely DX).
4. `.env` → `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`; load via `import.meta.env`.

**✅ Test:** `npm run dev` serves a styled placeholder page at localhost:5173.

### M1 — Database + RLS + seed (≈ 1 h)
1. Run SQL files 01→04 + RLS block (§7) in the SQL Editor. Verify no errors.
2. Create private `photos` bucket.
3. Enable providers: Email (magic-link, no SMTP) and Google (OAuth client).
4. Seed:
   ```sql
   -- pretend two authors
   insert into public.posts (author_id, title, description)
   select id, 'Hello PhotoStream', 'seeded' from public.profiles limit 1;

   -- fake covers so layout is testable (browser shows skeleton/gradient until
   -- real uploads exist) — acceptable for M1/M2 only.
   ```

**✅ Test:** seeded posts appear in Table Editor; anonymous RLS `select` works; an unauthenticated `insert` fails.

### M2 — Feed + post viewer (≈ 2.5 h)
1. `supabase.js` singleton; `lib/urls.js` (signed URL refresh-on-error).
2. `main.js` hash router; `home.js` masonry via `columns`; card renders thumb + title + author + 👍/👎.
3. `post.js` viewer: modal photostrip (swipe/next-prev, fullscreen), description, author link.
4. Sort chips: For You (rpc) · New · Top. Anonymous For You = New fallback.

**✅ Test:** click card → photostrip opens; chips change ordering; thumbs lazy-load.

### M3 — Auth + profile (≈ 1.5 h)
1. `login.js` magic-link + Google; `auth.js` session monitor → nav swap.
2. `me.js` my posts (edit/delete/sign-out) — delete removes storage folder (one call §8.6).
3. `profile.js` public gallery by username.

**✅ Test:** sign up with a real email; profile row auto-created; `#/upload` redirects when logged out.

### M4 — Upload + compressor + storage (≈ 3.5 h, the meat)
1. `lib/compress.js` per §9 (WebP, q slider, EXIF-aware, JPEG fallback, 1600 px cap).
2. `lib/thumb.js` 480 px thumbnail pass.
3. Upload form: picker (accept=`image/*`, multiple) → rows with preview → live compress → **upload both files** to
   `photos/{user_id}/{post_id}/{i}.webp` + `…/{i}_thumb.webp` → insert post + photo rows → set `cover_full` + `cover` thumb.
4. Validation: 1–25 files, title required ≤ 120, desc ≤ 2000.
5. Edit flow reuses it (re-upload changed items; allow deleting down to 1 photo).

**✅ Test:** upload 5 phone photos → Storage shows 10 small files; post appears in feed first position; a 48 MP JPEG lands ≤ 480 KB.

### M5 — Votes + personal feed (≈ 2 h) — DONE
1. `votebutton.js` three states (like / dislike / idle), optimistic UI, 300 ms click debounce, toast for guests.
2. Trial: call `toggle_vote`; reload persists; Like→Dislike→vote-removed all work.
3. `personal_feed` in `For You`: like Author A’s post → A’s future posts rise; dislike Author B → B’s sink to bottom but remain reachable.
4. Realtime patch: subscribe `votes` changes for visible post ids → update counts live.

**✅ Build state:** code-complete + `check`/`build` green (see §0.1 M5). Owner still needs to run `db/09_votes_realtime.sql` for the live-count patch, and §18 two-account E2E remains a manual step (no browser tool here).
**Cross-check (report §18 QA item 3):** like author A → A's posts rise on next For You load; dislike B → B's sink but reachable; Top/New unaffected (queries never touch `personal_feed`).

### M6 — Polish + responsive + deploy (≈ 2 h)
1. Full §11 design pass: frosted bar, pill tabs, bottom tabbar < 640 px, skeleton loading, empty states, error boundary, favicon, `prefers-reduced-motion`. — **DONE (this session)**: skip-link, offline banner, skeleton, empty states w/ retry, error boundary (friendly messages), confirmation dialogs, inline field validation, custom 404, About/Contact/Privacy/Terms, per-route meta/OG, `robots.txt` + `sitemap.xml`, responsive footer/dialog.
2. `npm run build` (vite → `dist/`), inspect dist, no console errors on mobile (dev-tools device emulator) + Safari/Chrome. — **DONE** (`check`+`build` green, 74 modules).
3. Push to GitHub → Cloudflare Pages: Framework preset **None**, build `npm run build`, output `dist`, add the two env vars.
4. Supabase → Authentication → URL Configuration: add `https://<project>.pages.dev` as redirect/allowed origin for Google.

**✅ Test:** deploy URL works end-to-end on a real phone — browse, sign in, upload, vote, personal-feed reshuffle, delete post.

### M7 — Search presence (SEO) — FREE (≈ 2 h)
The app is a hash-routed SPA, and Google historically does *not* index `#/…` fragments well. Do these in this order **after** M6 is live:

1. **Custom domain first** (Cloudflare Pages → Custom domains, e.g. `photos.stream` or `photos.example.dev`). Search engines trust a real domain far more than `<project>.pages.dev`.
2. **`public/robots.txt`** — allow all bots, point at the sitemap (Vite copies `public/` into `dist/` as-is):
   ```
   User-agent: *
   Allow: /
   Sitemap: https://YOUR-DOMAIN/sitemap.xml
   ```
3. **`public/sitemap.xml`** — list the stable pages (home, login, top, new, upload). Per-post URLs: see step 7 (clean-URL conversion).
4. **Meta + structured data in `index.html`**: unique per-route `<title>` (already in `main.js`), add `meta description`, `meta og:title/og:description/og:image` (best: the post's cover), `link rel="canonical"`, and a `JSON-LD` `ItemList`/`ImageObject` block. Fill the `<meta>` tags dynamically per route in `main.js`/`views/` (the title map already updates `<title>`).
5. **Google Search Console** (free, no code): add property → verify via **DNS TXT record** (put it in Cloudflare DNS) → wait for verification → **URL Inspection** tool, "Request indexing" on the homepage → later submit the sitemap at **Sitemaps**.
6. **Bing Webmaster Tools** (free): import from Google Search Console, or verify directly + submit sitemap. Bing also powers Edge/Copilot discovery.
7. **Clean URLs for real indexing** (the one product change): add a static `public/_redirects` so `POST /:id` style paths rewrite to `#/post/:id` (`/* /index.html 200`), switch links to clean paths, and regenerate the sitemap listing every published post (generate it on build from a Supabase REST query, or hand-list the first N posts). This is the documented "clean URLs = v2 upgrade" from §12/§17 becoming real SEO work — without it, post pages stay invisible to Google.
8. **Core Web Vitals pass** for ranking signal: keep WebP sizes in check, add `width`/`height` to `<img>` (prevents layout shift), `loading="lazy"` on below-the-fold covers, keep the 3rd-party surface tiny (Supabase only).

**✅ Test:** `site:YOUR-DOMAIN` shows pages in Google; homepage + a post page pass Google's **URL Inspection "Test Live URL"**; Lighthouse ≥ 90 performance/SEO on mobile.

### M8 — Contributions / tips (OPTIONAL, adds fees — not $0) 
Owner interest: a small "keep this wall going" contribution on posts. **There is no monthly fee**, but Stripe takes ~**2.9% + $0.30 per transaction** (US), so it is *not* $0 — the project's core "no money out" promise stays true only if tips stay off by default.

1. **Decide distribution model first:** (a) tips go to *you* (site owner) — one Stripe account, trivial; or (b) tips go to the *post author* — needs **Stripe Connect Express** (free to open, ~$0.25/payout) so each author gets their own payouts.
2. **Stripe account** (free) → get publishable + restricted/secret keys. Add `VITE_STRIPE_PUBLISHABLE` to `.env.example` (frontend key is safe; secret key stays server-side only).
3. **No-backend option:** a per-button **Stripe Payment Link** — create links per author (model a: in the app, on each `#/post/:id` show a "Contribute" button that opens the author's link). Zero code, no webhook; you get an email per payment but no per-post attribution into the DB.
4. **Attributed option (better):** add a small **Cloudflare Pages Function** (`functions/charge.js`, free tier) that takes `{post_id, amount}` → server-side fetches the author's/Stripe Connect account → `stripe.checkout.sessions.create({ metadata: { post_id } })` → returns the Checkout URL; the browser redirects to Stripe. Webhook (`webhook.js`, also a Pages Function) records the payment into a new `contributions` table (post_id, author_id, amount_cents, created_at).
5. **UI:** "Contribute" on the post page (small, not a duplicate CTA); a subtle "Thanks to 3 contributors" line on posts that have them. Respect the design rules — no glow/pill spam, keep it quiet.
6. **DBA/setup:** create `db/08_contributions.sql` (table + RLS: read public, write via webhook with `service_role` only) — *your choice to run*; it pairs with step 4.

**✅ Test (if enabled):** clicking Contribute on your own post opens Stripe; a $2 tip to your post records a row and shows the "thanks" line; author's (or your) Stripe dashboard shows the payout minus fees.

> **Gate:** M8 stays OFF by default and does not change the $0 promise (hosting, traffic, storage all still free). Turn it on only after M7 is live and real people are using the site.

---

## 15. Testing Strategy

| Level | Tool | Gate |
|---|---|---|
| JS syntax | `node --check` per file (or Vite build) | build passes |
| DB invariants | Executed SQL + spot checks in Table Editor | PK uniqueness; RLS deny/allow |
| Browser | Manual checklist (§18) + dev-tools device emulator | each must pass |
| Deployed smoke | pages.dev URL after M6 | full §18 on real phone |

---

## 16. Deployment Guide (exact steps)

1. **Repo:** create GitHub `photos-stream`; push M0 files.
2. **Cloudflare Pages:** New Project → Connect to GitHub → repo → preset **None** → Build command `npm run build` → output `dist` → env vars `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` → **Save & Deploy**.
3. Enable **pull-request previews** (auto) — every PR gets a URL.
4. **Supabase redirects:** Authentication → URL Configuration → add `https://photos-stream.pages.dev` and the preview origin.
5. **Custom domain (optional):** Pages → Custom domains → add; no server config needed; add that origin to Supabase allowlist too.
6. **Rollback:** Pages → Deployments → view older → “Rollback to this deployment” (instant).

---

## 17. Free-Tier Limitations & Exit Ramp

| Trigger | Symptom | Move |
|---|---|---|
| Storage ~ 1 GB or bandwidth ~ 5 GB/mo | Thumbs break / quota errors | Compress harder (1440px, q0.7) → upgrade Supabase plan ($10/mo = 100 GB storage) |
| Auth > 50k MAU | Auth throttled | Paid Auth tier |
| Personal feed slow on huge post counts | >0.5 s queries | Materialize affinity into a `feed_signals` table + index; then a periodic refresh |
| Want clean URLs / SSR SEO | Hash in URL | Add a light server (Cloudflare Functions) or move to a static SSG |
| Native app | — | v2: wrap the same API in a PWA manifest + service worker, then Capacitor/Tauri shell (§9.6) |

**Data portability:** everything is Postgres + plain files in an S3-compatible bucket — no proprietary format. `pg_dump` + bucket copy = clean exit any time.

---

## 18. Known Issues & Fixes (pre-flight risk review — user requested)

| # | Issue | Likelihood | Fix baked into design |
|---|---|---|---|
| 1 | **HEIC (iPhone) fails to decode** in Canvas on many browsers | High | Detect decode error → inline “convert to JPG/PNG” guidance; JPEG fallback attempt; never silent-fail |
| 2 | **EXIF rotation** makes phone photos sideways | High | `createImageBitmap(…,{imageOrientation:'from-image'})` + caption-aware draw |
| 3 | **Huge originals (48 MP)** blow up memory mid-compress | Medium | Downscale in 2 passes; cap decode at 4096px source; release `imageBitmap.close()` |
| 4 | **Very old Safari → no WebP** | Low (2026) | One fallback pass to JPEG q=0.85; pipeline is file-type agnostic |
| 5 | **Signed URLs expire on an open tab** (1 h) | Medium | `<img onerror>` → re-fetch fresh signed URL (§8.7) |
| 6 | **Hate-vote bots / vote spam** | Medium | Vote button 300 ms debounce; RPC is idempotent/atomic; v2 rate-limit per IP |
| 7 | **Rapid blank/duplicate uploads** | Medium | Disable submit while busy; per-file status rows; max-25 hard check client+DB |
| 8 | **Someone deletes a post while a viewer is open** | Low | Viewer refetch → “this post was removed” graceful state |
| 9 | **Feed feels identical to Top (no aff signal yet)** | High (early) | UX copy on For You tab explains “likes tune your feed”; it diverges after 1–2 votes |
| 10 | **Storage quota surprises** | Medium | Upload screen shows a compact “storage left” read number (sum of sizes client-side); warn at ≤ 20 MB free |
| 11 | **Profile username collision from trigger** | Low | `user_<hash>` + `on conflict do nothing`; edit username page in v2 |
| 12 | **Google OAuth blocked in some regions** | Medium | Magic-link email always works as fallback |
| 13 | **Free Supabase project pauses after ~7 days inactivity** | Medium | GitHub Actions cron (free) daily calls `GET /rest/v1/feed_posts?select=id&limit=1` with anon key → keeps project awake (§G ) |
| 14 | **Cache serves stale photos after edit** | Low | Upload paths include `?v=<timestamp>`; signed URLs are unique per refresh |
| 15 | **Feed personalization identity attack (many burner accounts)** | Low | Not security-critical (tastes are per-account); documented, v2 adds device fingerprint |
| 16 | **Limited SEO vs server-rendered site** | Medium | SPA + hash routes: Google indexes JS-rendered pages today; per-route `<title>`/OG tags updated in JS; full SSG listed in §17 |
| 17 | **I pressed Like then instantly Dislike** (race) | Low | Optimistic UI + RPC atomicity; server state is always correct, UI reconciles |
| 18 | **`vite` ship-worry for non-dev users** | Low | `dist/` is plain static; can be dragged to Pages without Node in future |

**§G — keep-alive action (`.github/workflows/keepalive.yml`):**
```yaml
name: keepalive
on:
  schedule: [{ cron: "0 */12 * * *" }]
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl -sf -o /dev/null -H "apikey: ${{ secrets.SUPABASE_ANON }}" \
          "${{ secrets.SUPABASE_URL }}/rest/v1/feed_posts?select=id&limit=1"
```

---

## 19. Timeline (part-time, realistic)

```
M0 scaffold/accounts    0.5 d
M1 DB + RLS + seed     1.0 d
M2 feed + viewer       2.5 d
M3 auth + profile      1.5 d
M4 upload/compressor   3.5 d   ← biggest
M5 votes + personal feed 2.0 d
M6 polish + deploy     2.0 d
M7 SEO / search        2.0 d   ← go-live visibility (FREE)
M8 contributions       1.5 d   ← optional, fees apply
──────────────────────────────
Total ≈ 16.5 working days; M0–M5 ≈ 3.5 weeks part-time
```

---

## 20. Decision Log (recorded choices)

| Question | Decision | Why |
|---|---|---|
| Framework | **None (vanilla JS ESM)** | Your explicit preference; failure-surface minimization (§5.3) |
| Hosting | **Cloudflare Pages** | Unlimited free static bandwidth — nothing else matches for photos |
| “That kind of post avoided” meaning | Dislike → that **author’s** posts sink to bottom; Like → rise; nothing banned; votes *are* the dial (§7.2) | Matches “avoided, not banned; not merely less likely” literally |
| Personal feed signal unit | **Author affinity** (since v1 has no tags) | Tags are the v2 upgrade → affinity per-tag |
| Top/New tabs | Global, **unaffected** by personal tastes | Keeps discovery neutral |
| Image formats | **WebP primary, JPEG fallback**; thumbnails 480px | Quality + storage + bandwidth (§9) |
| Vote model | Single switchable vote per user | The requested Like/Dislike cycle |
| Routing | **Hash router** | Zero static-host config; also the classic silent killer of AI builds |
| Comment system | Out of v1 | Scope lock (§3.2) |
| Search | Stretch (title, `pg_trgm`) | v2 |
| PWA/app | v2: manifest + SW → Capacitor/Tauri shell | Website first, per request |

---

## 21. Definition of Done (v1 release)

- [ ] All ✅ tests in §14 milestones pass **on the deployed `pages.dev` URL**.
- [ ] `npm run build` exits clean; zero console errors on mobile + desktop.
- [ ] Canonical user path works on a real phone: browse → login → upload a 5-photo set → Like/Dislike cycle → **feed visibly reshuffles** (liked author’s posts rise, disliked author’s sink but still scroll-visible) → edit → delete.
- [ ] A raw 12 MP JPEG uploads as ≤ 450 KB WebP with no perceptible quality loss at default “Medium”.
- [ ] A fresh beginner (or agent) can follow §14 alone and rebuild the app.
- [ ] Total monthly cost: **$0.00**.

---

*Build order is strict M0 → M6. Do not skip M1 (SQL/RLS) or the M4 compression gate.*