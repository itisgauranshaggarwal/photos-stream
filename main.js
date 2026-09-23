/**
 * PhotoStream — entry point.
 * Hash router: zero server config, works on any static host.
 *
 * Routes:
 *   #/            Intro landing (default)
 *   #/feed        For You feed
 *   #/top         Top feed (global score)
 *   #/new         New feed (chronological)
 *   #/post/:id    Post viewer
 *   #/upload      Upload form
 *   #/edit/:id    Edit own post
 *   #/profile/:username  Public gallery
 *   #/me          My posts
 *   #/login       Sign in / up (username-first)
 *   #/set-password  New password (reset link landing)
 *   #/about       About · #/contact Contact · #/privacy Privacy · #/terms Terms
 *   anything else → branded 404
 */
import { isConfigured, showConfigWarningIfMissing } from "./supabase.js";
import { bindAuthUI } from "./lib/auth.js";
import { initTheme } from "./lib/theme.js";
import { clear } from "./lib/dom.js";

import * as intro from "./views/intro.js";
import * as home from "./views/home.js";
import * as post from "./views/post.js";
import * as upload from "./views/upload.js";
import * as me from "./views/me.js";
import * as profile from "./views/profile.js";
import * as login from "./views/login.js";
import * as password from "./views/password.js";
import * as info from "./views/info.js";
import * as notfound from "./views/notfound.js";

const TITLES = {
  intro: "PhotoStream — Photos worth sending",
  home: "For You — PhotoStream",
  top: "Top — PhotoStream",
  new: "New — PhotoStream",
  post: "Post — PhotoStream",
  upload: "Upload — PhotoStream",
  edit: "Edit — PhotoStream",
  profile: "Profile — PhotoStream",
  me: "My posts — PhotoStream",
  login: "Sign in — PhotoStream",
  "set-password": "Set a new password — PhotoStream",
  about: "About — PhotoStream",
  contact: "Contact — PhotoStream",
  privacy: "Privacy Policy — PhotoStream",
  terms: "Terms & Conditions — PhotoStream",
  notfound: "Page not found — PhotoStream",
};

const NOT_FOUND = { name: "notfound", params: {} };

/** Convert location.hash → { name, params }. */
export function parseHash(hash = location.hash) {
  const raw = hash.replace(/^#/, "") || "/";
  const parts = raw.split("/").filter(Boolean);
  if (parts.length === 0) return { name: "intro", params: {} };

  const [a, b] = parts;
  switch (a) {
    case "feed":  return { name: "home", params: { sort: "for-you" } };
    case "top":  return { name: "home", params: { sort: "top" } };
    case "new":  return { name: "home", params: { sort: "new" } };
    case "post":   return b ? { name: "post", params: { id: b } } : NOT_FOUND;
    case "upload": return { name: "upload", params: {} };
    case "edit":   return b ? { name: "edit", params: { id: b } } : NOT_FOUND;
    case "profile":return b ? { name: "profile", params: { username: b } } : NOT_FOUND;
    case "me":   return { name: "me", params: {} };
    case "login":return { name: "login", params: {} };
    case "set-password": return { name: "set-password", params: {} };
    case "about":   return { name: "about", params: {} };
    case "contact": return { name: "contact", params: {} };
    case "privacy": return { name: "privacy", params: {} };
    case "terms":   return { name: "terms", params: {} };
    default:     return NOT_FOUND;
  }
}

const VIEWS = { intro, home, post, upload, me, profile, login, password, "set-password": password, edit: upload, about: info, contact: info, privacy: info, terms: info, notfound };

/** Meta description per route (SEO + social preview basics). */
const DESCRIPTIONS = {
  intro: "PhotoStream — a quiet wall for photos worth keeping. Share moments with the people who were there.",
  home: "Your For You feed — moments from the PhotoStream wall, tuned by the likes and dislikes you leave.",
  top: "The moments the PhotoStream community loved the most, up top.",
  new: "Freshly shared moments from the PhotoStream wall, just as they arrived.",
  post: "A moment on the PhotoStream wall — photos, words and dates on a postcard.",
  upload: "Share a moment — post up to 25 photos with a title and a short description.",
  edit: "Edit your moment — update the photos, title and description.",
  profile: "A PhotoStream wall — one person’s shared moments.",
  me: "Your PhotoStream wall — manage and delete the moments you posted.",
  login: "Sign in to PhotoStream — or create an account and start sharing moments.",
  "set-password": "Set a new password for your PhotoStream account.",
  about: "About PhotoStream — the story behind the quiet wall for photos worth keeping.",
  contact: "Contact PhotoStream — feedback, account removal requests, or just to say hello.",
  privacy: "PhotoStream’s Privacy Policy — what we collect, why, and how it’s handled.",
  terms: "PhotoStream’s Terms & Conditions — the rules of the road for the wall.",
  notfound: "That page isn’t on the PhotoStream wall.",
};

function applyMeta(route) {
  const title = TITLES[route.name] || "PhotoStream";
  const desc = DESCRIPTIONS[route.name] || DESCRIPTIONS.intro;
  document.title = title;
  setMeta("name", "description", desc);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", desc);
  setMeta("property", "og:type", "website");
}

function setMeta(key, name, content) {
  let node = document.head.querySelector(`meta[${key}="${name}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(key, name);
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
}

async function router() {
  const route = parseHash();
  const container = document.getElementById("view");
  clear(container);
  container.className = route.name === "intro" ? "view view-intro" : "view";
  applyMeta(route);

  // active chip / tabbar highlighting
  const activeKey = route.name === "home" ? route.params.sort || "for-you" : route.name;
  document.querySelectorAll("[data-nav]").forEach((n) =>
    n.classList.toggle("is-active", n.dataset.nav === activeKey)
  );
  document.querySelectorAll("[data-nav-1],[data-nav-2],[data-nav-3],[data-nav-4]").forEach((n) => {
    const key = n.dataset.nav1 || n.dataset.nav2 || n.dataset.nav3 || n.dataset.nav4;
    n.classList.toggle("is-active", key === activeKey);
  });

  window.scrollTo(0, 0);
  const view = VIEWS[route.name] || notfound;
  try {
    await view.mount(container, { ...route.params, name: route.name });
  } catch (err) {
    console.error("view error:", route.name, err);
    clear(container);
    notfound.mount(container, {});
  }
}

function bootNetworkBanner() {
  const banner = document.getElementById("net-banner");
  if (!banner) return;
  const update = () => {
    const offline = !navigator.onLine;
    banner.hidden = !offline;
    banner.setAttribute("aria-hidden", String(!offline));
  };
  window.addEventListener("offline", update);
  window.addEventListener("online", () => {
    update();
    const evt = new CustomEvent("net-online");
    window.dispatchEvent(evt);
  });
  update();
}

function boot() {
  if (!isConfigured) {
    document.querySelector("#view")?.appendChild(Object.assign(document.createElement("div"), {
      className: "empty-state",
      textContent: "Waiting for Supabase credentials…",
    }));
  }
  if (!location.hash) {
    history.replaceState(null, "", "#/");
  }
  showConfigWarningIfMissing();
  initTheme();
  bindAuthUI();
  bootNetworkBanner();
  router();
  window.addEventListener("hashchange", router);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}