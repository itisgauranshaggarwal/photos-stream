# PhotoStream — Design System

**Direction:** Postcard correspondence (impeccable seed `4b69590b`, assigned grounded candidate 6).
Every moment is a postcard: photo front, words back. The gallery is a table of paper
cards — stamp squares, plate captions, dated small caps, one airmail stripe — resting
on a neutral table. Dark table = night viewing room; light table = day catalogue page.

## Tokens

| Token | Dark | Light |
|---|---|---|
| `--table` (page) | `#191512` | `#e9e8e4` |
| `--fg` / `--muted` / `--line` | `#ede6d8` / `#a79e90` / `rgba(237,230,216,.14)` | `#1c1a17` / `#5f5b53` / `rgba(28,26,23,.16)` |
| `--accent` (on table) | `#93b4f0` | `#2e4a96` |
| `--paper` / `--ink` (cards, constant) | `#efe9dc` / `#211c16` | `#fcfbf8` / `#211c16` |
| `--accent-ink` (on paper) | `#2e4a96` | `#2e4a96` |
| `--like` / `--dislike` | `#2f6b44` / `#a33b2e` | same |

Theme: system-resolved on first visit, persisted to `localStorage.ps-theme`,
toggled in the top bar (`lib/theme.js` + inline pre-paint script).

## Type

Archivo (Google Fonts), one family for every role.
Display 700, tracking −0.03em; UI 600; body 400; message side italic.
Functional text floor: 11px.

## Geometry

Shape lock — soft-not-pill: postcard/card `3px`, photo-in-paper `2px`,
every control `6px`. Avatars are stamp squares (dashed accent, −4°);
postmarks and round toggles are the only circles.

## Motion

Transform/opacity only, ease-out (`cubic-bezier(.23,1,.32,1)`), reveals 450ms with
60–70ms stagger, flip 550ms, UI 150ms. All gated by `prefers-reduced-motion`
(`lib/reveal.js`, global reduced-motion rule).

## Routes

`#/` intro landing → "View gallery" → `#/feed` (For You), `#/top`, `#/new`.
"Share a moment" exists in exactly one place: the global footer.

## Raster provenance

Landing demo photos: `https://picsum.photos/seed/{ps-hero-lake, ps-hero-kitchen,
ps-hero-street, ps-flip-lake, ps-strip-1..6}/WxH` — Lorem Picsum stock
(deterministic seeds). No AI-generated imagery; no user photos yet (M4).
Feed imagery comes from user uploads (Supabase `photos` bucket) via seed data.
