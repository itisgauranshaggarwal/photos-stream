import { el, clear, a } from "../lib/dom.js";
import { supabase } from "../supabase.js";
import { toastOk, toastError } from "../components/toast.js";
import { getSignedInUser } from "../lib/session.js";

/**
 * Static content pages (M6): About · Contact · Privacy · Terms.
 * Single view keyed by route param; each page is a postcard — an
 * airmail stripe, a dashed stamp, a letter in the postmark voice.
 * Contact posts the message to the `contact_messages` table under
 * the visitor's sign-up email (no backend needed on a $0 stack).
 */

const EMAIL = "itisgauranshaggarwal@gmail.com";

const COPY = {
  about: {
    kicker: "THE STORY IN ONE PICTURE",
    title: "About PhotoStream",
    paragraphs: [
      "PhotoStream is a quiet wall for photos worth keeping — a place to share a day with the people who were there, minus the noise. Your moment is a postcard: the photos up front, the words, the date and the votes on the back.",
      "You can post up to 25 photos per moment along with a title and a short description. Anyone who signs in can like or dislike a moment — exactly once, and it’s always reversible. A dislike never hides anything: it just steadies the volume.",
      "Your For You feed learns from those votes. Posts you like move their author’s wall up; posts you don’t move them down — but nothing is ever banned. The wall never runs out of quiet.",
      "PhotoStream runs on a humble stack (a static site, a free database, and your own photos). It has no ads, no algorithmic feed-sellers, and no data resale. It’s a postcard, not a billboard.",
      "It’s also a hobby project, run openly and in spare time. That means things occasionally glitch, and it means we treat your photos and data with care — but it does not mean we can make hotel-grade promises about them. Details live on the privacy page.",
    ],
  },
  privacy: {
    kicker: "YOUR PAPERS, IN ORDER",
    title: "Privacy Policy",
    paragraphs: [
      "We keep this short on purpose. PhotoStream is a hobby side project, and the only thing we collect is what the app needs to work.",
      "When you create an account we store your username, an optional display name, and your email address as your sign-in key. Your password is never stored by us — it’s encrypted by our sign-in provider and only ever handed back to them.",
      "Photos you post are stored in our cloud storage so they can be shown to the people visiting the wall. Each photo is given a random, unguessable address, which is the only thing that keeps them private-by-default.",
      "We record your votes (like / dislike) and posts so the For You feed and the wall can work. Aggregate counts like “12 likes” are shown publicly; your individual voting history is visible only to you and to whoever runs the server.",
      "We do not sell, rent, or share your data with advertisers. We do not use third-party trackers. Analytics, if ever added, will be privacy-respecting and announced here first.",
      "Now the honest part: PhotoStream is a hobby side project, not a big-business service. We do our reasonable best to keep things safe — we use trusted providers, never touch your password, and keep photos at unguessable addresses — but we can’t claim a guarantee of perfectly secure storage, and we don’t want to pretend otherwise. Please don’t post anything you wouldn’t be comfortable showing the world; treat the wall the way you’d treat a real postcard, because that’s what it is.",
      "You can delete your own posts at any time, and signing out is one click. If you want your whole account gone — photos, votes, everything — email the address below and we’ll remove it within 14 days.",
    ],
  },
  terms: {
    kicker: "THE GROUND RULES",
    title: "Terms & Conditions",
    paragraphs: [
      "By using PhotoStream you agree to be a decent neighbour. Post your own photos or photos you have permission to share, keep titles and descriptions truthful, and treat other people’s moments the way you’d want your own treated.",
      "Don’t upload anything illegal, harassing, hateful, or violent. Don’t post spam, scrape the wall at scale, or try to break the service or its sign-in. We can remove content or accounts that break these rules — or that spam the voting system to rig the feed.",
      "You keep the rights to your photos. You’re only granting PhotoStream the permission to store and display them for the purpose of running the service.",
      "The service is provided “as is”, free of charge, with no warranty. We work on it in spare time; sometimes it will glitch, and occasionally it may have to shut down or change. We’ll try to warn you before big changes.",
      "For anything on these pages, our word is the version that appears on PhotoStream today. These terms may be updated; continuing to use the site means you accept the current version.",
    ],
  },
};

export async function mount(container, params) {
  clear(container);
  const name = params?.name === "contact" ? "contact" : ["about", "privacy", "terms"].includes(params?.name) ? params?.name : "about";

  const page = el("article", "info-page");
  const card = el("div", "info-card");

  const stamp = el("span", "info-stamp", "PS");
  stamp.setAttribute("aria-hidden", "true");
  card.appendChild(stamp);

  let airmail = el("div", "airmail");
  airmail.setAttribute("aria-hidden", "true");
  card.insertBefore(airmail, card.firstChild);

  container.appendChild(page);
  page.appendChild(card);

  if (name === "contact") {
    await renderContact(card);
    return;
  }

  const copy = COPY[name];
  card.appendChild(el("p", "label info-kicker", copy.kicker));
  card.appendChild(el("h1", "info-title", copy.title));
  const body = el("div", "info-body");
  copy.paragraphs.forEach((p, i) => body.appendChild(el("p", i === 0 ? "lead" : null, p)));
  card.appendChild(body);

  const sign = el("footer", "info-sign");
  sign.appendChild(el("span", "label", "The PhotoStream wall"));
  sign.appendChild(el("span", "info-sign-mark", "✔ Postmarked"));
  card.appendChild(sign);
}

async function renderContact(card) {
  const user = await getSignedInUser(supabase);
  const userEmail = user?.email || "";

  card.appendChild(el("p", "label info-kicker", "SIGNED, WITH LOVE"));
  card.appendChild(el("h1", "info-title", "Contact"));

  const body = el("div", "info-body");
  body.appendChild(
    el("p", "lead", "This wall is run by one pair of hands. If you have a suggestion, found a bug, or just want to share how PhotoStream feels — please, write in. Every message lands in my real inbox.")
  );
  const p2 = el("p", null, "");
  const mail = a(`mailto:${EMAIL}`, "info-email", EMAIL);
  p2.appendChild(el("span", null, "For anything urgent, email me directly at "));
  p2.appendChild(mail);
  p2.appendChild(el("span", null, "."));
  body.appendChild(p2);
  card.appendChild(body);

  if (!user) {
    const signin = el("div", "info-form empty-state");
    signin.appendChild(el("p", null, "Sign in to send a message — it lands with your account email attached."));
    const cta = el("div", "empty-actions");
    cta.appendChild(a("#/login", "pill pill-primary btn-cta", "Sign in"));
    signin.appendChild(cta);
    card.appendChild(signin);
    return;
  }

  const form = el("form", "info-form");
  form.setAttribute("novalidate", "");

  const mkField = (id, labelText, type, placeholder, tag = "input") => {
    const wrap = el("div", "field");
    const lb = el("label", null, labelText);
    lb.setAttribute("for", id);
    const input = document.createElement(tag);
    input.className = "input";
    input.id = id;
    if (tag === "input") input.type = type;
    input.placeholder = placeholder;
    const err = el("p", "field-error", "");
    err.setAttribute("role", "alert");
    err.hidden = true;
    wrap.append(lb, input, err);
    return { wrap, input, err };
  };

  const msg = mkField("c-msg", "Your message", "text", "What’s on your mind? A suggestion, a bug, a hello…", "textarea");
  msg.input.rows = 5;
  msg.input.autocomplete = "off";

  const note = el("p", "send-note", "");
  note.appendChild(el("span", "send-note-icon", "→"));
  note.appendChild(el("span", null, `Sending as ${userEmail}`));

  const actions = el("div", "auth-actions");
  const send = el("button", "pill pill-primary pill-wide", "Send message");
  send.type = "submit";
  actions.appendChild(send);

  form.append(msg.wrap, note, actions);
  card.appendChild(form);

  send.addEventListener("click", async (e) => {
    e.preventDefault();
    const text = msg.input.value.trim();
    msg.err.hidden = text.length >= 10;
    msg.err.textContent = text.length >= 10 ? "" : "Write at least a line or two (10+ characters).";
    msg.input.setAttribute("aria-invalid", text.length >= 10 ? "false" : "true");
    if (text.length < 10) {
      toastError("One field needs a fix — check the hint.");
      return;
    }
    if (!supabase) {
      toastError("Supabase not configured yet.");
      return;
    }
    send.disabled = true;
    send.textContent = "Sending…";
    try {
      const { error } = await supabase.from("contact_messages").insert({
        user_id: user.id,
        email: userEmail,
        message: text,
      });
      if (error) throw error;
      msg.input.value = "";
      toastOk("Message sent — thank you, I’ll read it soon!");
    } catch (err) {
      console.error(err);
      toastError(err.message?.includes("contact_messages")
        ? "Message storage missing — run db/11_contact_messages.sql first."
        : "Couldn’t send that. Please try again.");
    } finally {
      send.disabled = false;
      send.textContent = "Send message";
    }
  });
}