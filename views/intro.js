import { el, img, a, clear } from "../lib/dom.js";
import { revealAll } from "../lib/reveal.js";

/**
 * Intro landing — postcard world.
 * Hero → flip demo → how it works → strip → climax CTA.
 * The single "View gallery" button opens #/feed.
 * "Share a moment" lives in the global footer only.
 */

function postcardFront(seed, caption, rotated) {
  const wrap = el("div", "stack-item");
  wrap.setAttribute("data-reveal", "");
  const holder = el("div", "stack-rot");
  holder.style.setProperty("--r", rotated);

  const card = el("div", "postcard");
  const stripe = el("div", "airmail");
  stripe.setAttribute("aria-hidden", "true");
  card.appendChild(stripe);

  const photo = img(
    `https://picsum.photos/seed/${seed}/900/700`,
    "pc-img",
    ""
  );
  photo.loading = "lazy";
  card.appendChild(photo);

  const cap = el("div", "pc-caption");
  cap.appendChild(el("span", null, caption));
  card.appendChild(cap);

  holder.appendChild(card);
  wrap.appendChild(holder);
  return wrap;
}

function flipSection() {
  const section = el("section", "landing-sec");
  section.id = "two-sides";
  const inner = el("div", "sec-inner flip-grid");

  const copy = el("div", "flip-copy");
  copy.setAttribute("data-reveal", "");
  const h2 = el("h2", "sec-title", "Every moment has two sides.");
  copy.appendChild(h2);
  copy.appendChild(
    el("p", "sec-support", "The photo out front. The words, the date and the votes behind it.")
  );

  const stage = el("div", "flip-stage");
  stage.setAttribute("data-reveal", "");
  stage.setAttribute("data-flip", "");
  stage.style.setProperty("--d", "90ms");

  const btn = el("button", "flip-card");
  btn.type = "button";
  btn.setAttribute("aria-label", "Turn the postcard over");

  const innerEl = el("span", "flip-inner");

  const front = el("span", "flip-face flip-front postcard");
  const photo = img("https://picsum.photos/seed/ps-flip-lake/900/700", "pc-img", "");
  front.appendChild(photo);
  const fcap = el("span", "pc-caption");
  fcap.appendChild(el("span", null, "maya.k · 22 SEP"));
  front.appendChild(fcap);

  const back = el("span", "flip-face flip-back");
  const postmark = el("span", "postmark");
  postmark.setAttribute("aria-hidden", "true");
  postmark.appendChild(el("b", null, "PS"));
  postmark.appendChild(el("i", null, "22 SEP"));
  back.appendChild(postmark);

  const message = el(
    "p",
    "handnote",
    "“Sunday at the lake — the kids wouldn’t stay out of the water.”"
  );
  back.appendChild(message);

  const votes = el("span", "back-votes", "12 likes · 2 dislikes");
  back.appendChild(votes);

  const address = el("span", "address-lines");
  address.setAttribute("aria-hidden", "true");
  address.append(el("i", null, ""), el("i", null, ""), el("i", null, ""));
  back.appendChild(address);

  innerEl.append(front, back);
  btn.appendChild(innerEl);
  stage.appendChild(btn);
  stage.appendChild(el("p", "flip-hint", "Tap to turn it over."));

  btn.addEventListener("click", () => {
    stage.classList.toggle("is-flipped");
  });

  inner.append(copy, stage);
  section.appendChild(inner);
  return section;
}

function stepsSection() {
  const section = el("section", "landing-sec");
  const inner = el("div", "sec-inner");

  const h2 = el("h2", "sec-title", "How the wall works");
  h2.setAttribute("data-reveal", "");
  inner.appendChild(h2);

  const list = el("div", "steps");
  const steps = [
    ["Post a moment", "Up to twenty-five photos, a title, and a few words about it."],
    ["Vote on what you see", "Like what moves you, dislike what doesn’t — your For You wall quietly follows."],
    ["No ads, no noise", "Just the wall, free to keep."],
  ];

  steps.forEach(([title, desc], i) => {
    const row = el("div", "step");
    row.setAttribute("data-reveal", "");
    row.style.setProperty("--d", `${i * 70}ms`);
    row.appendChild(el("div", "step-title", title));
    row.appendChild(el("div", "step-desc", desc));
    list.appendChild(row);
  });
  inner.appendChild(list);

  section.appendChild(inner);
  return section;
}

function stripSection() {
  const section = el("section", "landing-sec");
  const inner = el("div", "sec-inner");
  const strip = el("div", "strip");

  for (let i = 1; i <= 6; i++) {
    const holder = el("div", "strip-item");
    holder.setAttribute("data-reveal", "");
    holder.style.setProperty("--d", `${i * 60}ms`);
    const photo = img(
      `https://picsum.photos/seed/ps-strip-${i}/640/480`,
      "strip-img",
      ""
    );
    holder.appendChild(photo);
    strip.appendChild(holder);
  }

  inner.appendChild(strip);
  section.appendChild(inner);
  return section;
}

function climaxSection() {
  const section = el("section", "landing-sec climax-sec");
  const inner = el("div", "sec-inner");
  const block = el("div", "climax");
  block.setAttribute("data-reveal", "");

  block.appendChild(el("h2", "climax-title", "The wall is open."));
  const cta = a("#/feed", "pill pill-primary climax-cta", "View gallery");
  block.appendChild(cta);

  inner.appendChild(block);
  section.appendChild(inner);
  return section;
}

export async function mount(container) {
  clear(container);

  const hero = el("section", "hero");

  const copy = el("div", "hero-copy");
  const h1 = el("h1", "hero-title", "Some photos deserve more than a camera roll.");
  h1.setAttribute("data-reveal", "");
  copy.appendChild(h1);

  const sub = el(
    "p",
    "hero-sub",
    "Share them with the people who were there — twenty-five at a time, with words attached."
  );
  sub.setAttribute("data-reveal", "");
  sub.style.setProperty("--d", "70ms");
  copy.appendChild(sub);

  const cue = el("div", "scroll-cue");
  cue.setAttribute("aria-hidden", "true");
  cue.innerHTML =
    '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg><span>Scroll</span>';
  copy.appendChild(cue);

  const stack = el("div", "hero-stack");
  stack.appendChild(postcardFront("ps-hero-lake", "maya.k · 22 SEP", "-4deg"));
  stack.appendChild(postcardFront("ps-hero-kitchen", "dev.r · 21 SEP", "3deg"));
  stack.appendChild(postcardFront("ps-hero-street", "lena.p · 19 SEP", "-1.5deg"));
  stack.lastChild.style.setProperty("--d", "140ms");

  hero.append(copy, stack);
  container.appendChild(hero);

  container.appendChild(flipSection());
  container.appendChild(stepsSection());
  container.appendChild(stripSection());
  container.appendChild(climaxSection());

  revealAll(container);
}
