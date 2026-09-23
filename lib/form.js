import { el } from "./dom.js";

/**
 * Inline field validation (M6). A hidden error line lives under each
 * field's wrapper; showField points at it with a human hint, and a
 * matching aria-invalid + role=alert make it read clearly to screen
 * readers. clearField wipes it when the user fixes the input.
 */
export function showField(wrap, input, message) {
  if (!wrap) return false;
  let err = wrap.querySelector(".field-error");
  if (!err) {
    err = el("p", "field-error", "");
    err.setAttribute("role", "alert");
    wrap.appendChild(err);
  }
  err.textContent = message || "";
  err.hidden = !message;
  input.setAttribute("aria-invalid", message ? "true" : "false");
  return !message;
}

export function clearField(wrap, input) {
  return showField(wrap, input, "");
}

/** Attach a live "clear on input" listener once per field wrapper. */
export function autoClear(wrap, input) {
  input.addEventListener("input", () => {
    if (input.getAttribute("aria-invalid") === "true") clearField(wrap, input);
  });
}