# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: friends and family in small private-ish circles who want to share everyday photos with each other and browse what others shared. They are not professional photographers; they visit casually, often on a phone, to catch up on moments.

Secondary: the project owner (a beginner developer) who maintains the app by following milestone docs.

## Product Purpose

PhotoStream is a "YouTube for photos": post up to 25 photos per moment with a title and description; anyone signed in can Like or Dislike; the For You feed learns from those votes (liked authors rise, disliked authors sink but are never banned). Success means visitors sign in, share moments, and come back to browse the wall.

## Positioning

The meaningful difference a neighboring product could not truthfully copy: a feed that ranks by personal affinity derived from votes while never banning anyone, delivered on a $0 hosting stack (Cloudflare Pages + Supabase free tier) that a beginner can maintain.

## Operating Context

- Hash-router SPA served by Vite (dev) and Cloudflare Pages (production, static only).
- Supabase project configured: Postgres, Auth (username-first: email+password with a hidden email key; magic link/Google off), private Storage bucket `photos`.
- Milestones M0–M6 code-side done (scaffold, design iterations, schema/RPC/RLS/seed SQL, storage bucket with upload/edit/read policies, username-first auth, live feed + post viewer with photostrip, account menu + sign out, my wall with delete, public profile galleries, upload + on-device WebP compressor, Like/Dislike votes with optimistic UI + realtime counts + personal-feed affinity, full polish sweep: info pages, custom 404, friendly errors + retry, inline form validation, confirmation dialogs, offline banner, accessibility, per-route meta/OG + robots/sitemap). M6 deploy + M7 SEO/GSC/Bing pending.
- Demo content exists from `db/seed.sql` (2 demo authors, 6 demo moments with placeholder images).

## Capabilities and Constraints

- Post: 1–25 photos, title, description. Votes: one like-or-dislike cycle per user per post (toggle/switch). Feeds: For You (personal), Top (global score), New (chronological). Routes: intro/landing, feeds, post viewer, upload/edit, profile, my posts, login.
- Photos stored as WebP/JPEG/PNG/AVIF, max 5 MB each; no SVG/HEIC uploads.
- No paid services, no backend beyond Supabase, no build framework beyond Vite.
- Open/undecided: profile editing, comments, notifications, finer per-author affinity weights (current: ±1 per vote).

## Brand Commitments

- Name: PhotoStream.
- Voice: warm, plainspoken, short. Concrete labels ("Share a moment", "View gallery"). No marketing hype words, no emoji as icons.
- User-set binding constraints from the current brief: a first-impression intro page with scroll animations that ends in a "View gallery" action leading to the gallery; a premium photo-gallery feel people return to; exactly one "Share a moment" CTA location (footer only); both dark and light themes with a toggle; animations fast enough never to bore; no generic/"AI slop" patterns.

## Evidence on Hand

- `README.md` (run steps, Supabase setup), `../Project_Report_PhotoStream.md` (full build plan), `db/*.sql` (schema, RPCs, RLS, seed), demo seed content in the database.
- Absences that future work must not fabricate: no real user photos, no testimonials, no press, no usage metrics, no pricing.

## Product Principles

1. Photos are the product; the interface recedes so the images lead.
2. The feed shapes itself around the viewer but never punishes an author out of sight.
3. Everything must stay runnable on free tiers and maintainable by a beginner.
4. Say things plainly; a boring truthful label beats a clever one.
5. Motion is used sparingly and never blocks content.

## Accessibility & Inclusion

Baseline expectations (inferred, not yet audited): keyboard focus visible, WCAG AA text contrast in both themes, `prefers-reduced-motion` respected, semantic landmarks and alt text on photos. No product-specific assistive requirement confirmed yet.
