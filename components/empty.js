import { el, a } from "../lib/dom.js";

/**
 * Shared empty / error state (M6).
 *   emptyState(title, { ctaText, ctaHref, retryLabel, onRetry })
 * Renders a centered note; if onRetry is given a "Try again" pill
 * re-runs it (used for load failures / offline-adjacent errors).
 */
export function emptyState(title, { ctaText, ctaHref, retryLabel = "Try again", onRetry } = {}) {
  const state = el("div", "empty-state");
  state.appendChild(el("p", null, title));

  const actions = el("div", "empty-actions");
  if (ctaHref) {
    actions.appendChild(a(ctaHref, "pill pill-primary btn-cta", ctaText || "Continue"));
  }
  if (onRetry) {
    const retry = el("button", "pill", retryLabel);
    retry.type = "button";
    retry.addEventListener("click", onRetry);
    actions.appendChild(retry);
  }
  if (actions.firstChild) state.appendChild(actions);
  return state;
}