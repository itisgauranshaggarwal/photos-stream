---
version: 1
slug: "views-intro-js"
primary_target: "views/intro.js"
related_targets: ["index.html","styles.css"]
---

# Surface brief — intro/landing (primary: views/intro.js)

## Direction contract

THESIS: Every moment is a postcard — photo front, words back — and the landing is a table of cards you turn over. It refuses the card-grid social feed with pill badges and the centered-hero SaaS intro: the product's own mechanism (photo + words + votes) is dramatized by one flip.

OWN-WORLD: Warm buff paper cards (3px corners, hairline rules, dashed stamp squares holding the author initial, circular dated postmarks, one airmail edge stripe) resting on a neutral table surface. Archivo across 400-700 with italic reserved for the message side; one postal-blue accent (#2E4A96 light / #93B4F0 dark on table #E9E8E4 / #191512); zero gradients, glows, or pills. Dual theme, system-resolved, persisted, toggled in the top bar.

STORY: Visitor lands, reads one plain headline, sees photo-front cards enter fast, scrolls through short reveals, watches one postcard flip to its message side (the signature moment), reads three plain how-it-works lines, and presses the single "View gallery" button that opens the wall. Footer carries the only "Share a moment" CTA.

FIRST VIEWPORT: Split, fits the viewport. Left: two-line H1 ("Some photos deserve more than a camera roll."), one-line sub, scroll cue at the bottom — no CTA button (user-pinned: the button comes at the end). Right: three overlapping photo-front postcards at slight held rotations, entering with a 70ms stagger. Hairline topbar above: brand, For You/Top/New, theme toggle, auth.

FORM: Grounded candidate 6 — postcard correspondence (photo front / message back / stamp / postmark / airmail edge); seed key 4b69590b. Declined-challenger raises, each named for its donor: plate-caption discipline (Sapeur portrait plate) — every photo front carries one ruled identification line beneath the frame; held perspective (grid-horizon) — intro cards sit at slight varied rotations so the wall reads as objects, not a grid; state as material (kiln shelf) — vote results read as an inked mark on the card back, not a chrome counter; dated small caps (provenance ribbon) — all timestamps set as stamped small-cap dates; lens-settle hover (phosphor terminal) — photos answer the cursor with a quiet brightness lift, never a zoom. Competitive alternate kept in reserve: HyperCard stack's browse/author affinity (edit-in-place lands with M4).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Scope

Intro landing + gallery shell (topbar, footer, tabbar, theme toggle) + feed polish. Visitor mode: Experience (landing) / Operate (gallery). Audience: friends and family sharing everyday photos. Job: understand the wall and enter it. Action: press View gallery. Proof: the flip demo and the photo strip. Constraints: footer-only Share CTA, dual theme, sub-second animation budget, no AI-slop patterns, existing routes/auth/DB untouched.
