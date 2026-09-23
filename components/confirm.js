import { el } from "../lib/dom.js";

/**
 * Confirmation dialog for destructive / irreversible actions (M6).
 * Keyboard: Esc closes, focus is trapped, Enter confirms. Returns the
 * dialog node so the caller can remove it after the action resolves.
 */
export function confirmDialog({ title, message, confirmLabel = "Delete", onConfirm, onCancel }) {
  const overlay = el("div", "confirm-overlay");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "confirm-title");
  overlay.setAttribute("aria-describedby", "confirm-msg");

  const box = el("div", "confirm-box");
  const head = el("h2", "confirm-title", title);
  head.id = "confirm-title";
  const msg = el("p", "confirm-msg", message);
  msg.id = "confirm-msg";
  box.append(head, msg);

  const actions = el("div", "confirm-actions");
  const cancelBtn = el("button", "pill", "Cancel");
  cancelBtn.type = "button";
  const confirmBtn = el("button", "pill pill-danger", confirmLabel);
  confirmBtn.type = "button";

  actions.append(cancelBtn, confirmBtn);
  box.appendChild(actions);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  document.body.classList.add("view-locked");

  const close = () => {
    overlay.remove();
    document.body.classList.remove("view-locked");
    document.removeEventListener("keydown", onKey, true);
  };

  function onKey(e) {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      onCancel?.();
    }
    if (e.key === "Tab") {
      const focusables = [cancelBtn, confirmBtn];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  cancelBtn.addEventListener("click", () => {
    close();
    onCancel?.();
  });
  confirmBtn.addEventListener("click", async () => {
    confirmBtn.disabled = true;
    try {
      await onConfirm?.();
    } finally {
      close();
    }
  });
  overlay.addEventListener("mousedown", (e) => {
    if (e.target === overlay) {
      close();
      onCancel?.();
    }
  });
  document.addEventListener("keydown", onKey, true);
  cancelBtn.focus();

  return overlay;
}