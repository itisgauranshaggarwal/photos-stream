import { supabase } from "../supabase.js";
import { el, clear, escapeHtml } from "./dom.js";
import { getSignedInUser } from "./session.js";
import { toastOk } from "../components/toast.js";

const ICON_USER =
  '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5"/></svg>';

/**
 * Top-bar auth slot (M3):
 *  - signed out  → "Sign in" link
 *  - signed in   → avatar button that opens a small menu
 *                   (account email, My posts, Sign out)
 */

function closeMenus() {
  document.querySelectorAll(".auth-menu").forEach((m) => m.removeAttribute("open"));
  document.querySelectorAll(".avatar-btn").forEach((b) => b.setAttribute("aria-expanded", "false"));
}

let cleanupFns = [];
function cleanup() {
  cleanupFns.forEach((fn) => fn());
  cleanupFns = [];
}

function accountMenu(user, slot) {
  const meta = user.user_metadata || {};
  const displayName = meta.full_name || user.email || "Account";
  const letter = (meta.full_name || user.email || "?").slice(0, 1).toUpperCase();

  const btn = el("button", "avatar-btn", letter);
  btn.type = "button";
  btn.setAttribute("aria-haspopup", "menu");
  btn.setAttribute("aria-expanded", "false");
  btn.title = displayName;

  const menu = el("div", "auth-menu");
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", "Account");

  const head = el("div", "auth-menu-head");
  head.appendChild(el("span", null, escapeHtml(displayName)));
  if (user.email) head.appendChild(el("span", "auth-menu-sub", escapeHtml(user.email)));
  menu.appendChild(head);

  const myPosts = el("a", "auth-menu-item", "My posts");
  myPosts.href = "#/me";
  myPosts.setAttribute("role", "menuitem");
  myPosts.setAttribute("data-link", "");
  menu.appendChild(myPosts);

  const signOut = el("button", "auth-menu-item auth-menu-signout", "Sign out");
  signOut.type = "button";
  signOut.setAttribute("role", "menuitem");
  signOut.addEventListener("click", async () => {
    closeMenus();
    try {
      await supabase.auth.signOut();
      toastOk("Signed out.");
    } catch (err) {
      console.error(err);
    }
  });
  menu.appendChild(signOut);

  const wrap = el("div", "auth-wrap");
  wrap.append(btn, menu);
  slot.appendChild(wrap);

  const toggle = () => {
    const open = menu.hasAttribute("open");
    closeMenus();
    if (!open) {
      menu.setAttribute("open", "");
      btn.setAttribute("aria-expanded", "true");
    }
  };
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggle();
  });

  const docClick = (e) => {
    if (!wrap.contains(e.target)) closeMenus();
  };
  const docKey = (e) => {
    if (e.key === "Escape") closeMenus();
  };
  const onHash = closeMenus;
  document.addEventListener("click", docClick);
  document.addEventListener("keydown", docKey);
  window.addEventListener("hashchange", onHash);
  cleanupFns.push(() => {
    document.removeEventListener("click", docClick);
    document.removeEventListener("keydown", docKey);
    window.removeEventListener("hashchange", onHash);
  });
}

export async function bindAuthUI() {
  const slot = document.getElementById("auth-slot");
  if (!slot) return;

  if (!supabase) {
    slot.style.display = "none";
    return;
  }
  slot.style.display = "";

  const render = (session) => {
    cleanup();
    clear(slot);
    if (!session?.user) {
      const link = el("a", "icon-btn", "");
      link.href = "#/login";
      link.setAttribute("data-link", "");
      link.setAttribute("aria-label", "Sign in");
      link.title = "Sign in";
      link.innerHTML = ICON_USER;
      slot.appendChild(link);
      return;
    }
    accountMenu(session.user, slot);
  };

  const { data } = await supabase.auth.getSession();
  render(data.session);
  supabase.auth.onAuthStateChange((_event, session) => render(session));
}

/** Guard: redirect to login when there is no live session. Returns user or null. */
export async function requireAuth() {
  return getSignedInUser(supabase);
}