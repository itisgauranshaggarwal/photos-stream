import { el, a, clear } from "../lib/dom.js";

/**
 * Custom 404 — a misdirected postcard. Reached from any unknown hash
 * route (and as the not-found fallback in the router).
 */
export function mount(container, params) {
  clear(container);
  const state = el("div", "empty-state notfound");
  state.appendChild(el("p", "label info-kicker", "LOST IN THE POST"));
  state.appendChild(el("h1", "notfound-title", "This stamp was never cancelled."));
  state.appendChild(
    el("p", null, "The page you’re after isn’t on the wall — it may have moved, or the address was mistyped.")
  );

  const cta = el("div", "notfound-actions");
  cta.appendChild(a("#/feed", "pill pill-primary btn-cta", "Back to the wall"));
  cta.appendChild(a("#/", "pill pill-ghost", "Home"));
  state.appendChild(cta);
  container.appendChild(state);
}