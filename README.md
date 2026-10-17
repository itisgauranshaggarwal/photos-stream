# 📸 PhotoStream

A **"YouTube for photos"** — post up to 25 photos with a title + description; anyone can **Like/Dislike**; your **For You** feed learns from your votes (liked authors rise, disliked authors sink but are never banned).

Plain **HTML/CSS/JS** SPA + **Supabase** (Postgres + Auth + Storage) + **Cloudflare Pages** (free, unlimited static bandwidth). Full plan: `../Project_Report_PhotoStream.md`.

## 🚀 How to run

```bash
# 1. install dependencies (once)
npm install

# 2. copy env template and fill in your real Supabase keys
copy .env.example .env        # (Windows)
# or: cp .env.example .env    # (macOS / Linux / WSL)

# 3. start the dev server
npm run dev
```

Then open the printed URL (usually **http://localhost:5173**).

## 🔑 Get your Supabase keys (free)

1. Go to **supabase.com** → create an account → **New project** (pick a region near you; remember the DB password).
2. Wait for provisioning (~2 min), then open **Settings → API**.
3. Copy **Project URL** and **anon public key** into `.env`:
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJ...
   ```
4. Restart `npm run dev`.

> Without valid keys the app still boots, but shows a config banner and the feed stays empty. No keys are committed to git (`.env` is git-ignored).

## 🗃 Set up the database (M1)

Open **Supabase → your project → SQL Editor → New query**, then run each file below **in order** (copy-paste the whole file → **Run**):

1. `db/01_schema.sql` — tables (profiles, posts, photos, votes) + signup trigger
2. `db/02_rpc_and_views.sql` — vote toggle + Top/New feeds + personal "For You" feed
3. `db/03_rls.sql` — security rules (read public, write own)
4. `db/seed.sql` — 2 demo authors + 6 demo moments (feed won't be empty)

Each run should end with **"Success. No rows returned"** (seed ends with a count).

Then create the photo bucket once:
**Storage → New bucket → Name `photos` → Private → Save.**

**Required follow-up SQL (do NOT skip — the app will break without these):**
5. `db/04_storage.sql` — storage insert/delete policies so users can upload to their own folder
6. `db/05_login.sql` — `email_for_login` RPC (username-first sign-in resolves the hidden email)
7. `db/07_storage_read.sql` — **read policy on `photos`; without it, signed URLs fail and every uploaded photo shows as a broken/alt-text block**
8. `db/06_diagnose.sql` — optional; runs an all-green health check (bucket, policies, RPC, profiles)

**Supabase Authentication settings that are required (owner already set):**
- **Confirm email → OFF** (sign-ups get an instant session; no verification link)
- Email provider ON; **Google/Phone remain OFF** (never configured — ignore the Google Cloud console entirely)

Finally refresh the app — the demo feed should appear. ✅ M1 test passed when `npm run dev` shows the 6 demo cards.

## 🧪 Checks

```bash
npm run check   # syntax-checks the JS entry files
npm run build   # production build → dist/
npm run preview # serve the production build locally
```

## 🗂 Layout

```
photos-stream/
  index.html          app shell (topbar, view, footer, mobile tabbar, toasts, theme toggle)
  styles.css          design system — postcard correspondence, dual dark/light theme
  main.js             hash router + bootstrap (intro at #/, feed at #/feed)
  supabase.js         Supabase client singleton (config guard)
  lib/                session (getSignedInUser), dom, auth, theme, reveal, urls, feed, vote, compress
  views/              intro, home, post, upload, me, profile, login, password (#/set-password)
  components/         card, votebutton, toast, skeleton
  db/                 01_schema, 02_rpc_and_views, 03_rls, seed, 04_storage, 05_login, 06_diagnose, 07_storage_read, 09_votes_realtime
  .env.example        template — copy to .env and fill
```

## 🗺 Milestones

- [x] **M0** scaffold + dev server + design system
- [x] **M1** Supabase schema + RLS + seed (`db/*.sql`, run in SQL Editor)
- [x] **M2** feed + post viewer
- [x] **M3** auth + profile (username-first: email is a hidden sign-in key, new `db/05_login.sql`)
- [x] **M4** upload + quality WebP compressor + storage
- [x] **M5** votes + personal feed
- [x] **M6** polish + responsive (done) + deploy to Cloudflare Pages