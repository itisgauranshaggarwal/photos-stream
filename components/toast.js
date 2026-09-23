/** Global toast notifications (used everywhere). */

const LAYER_ID = "toasts";

export function toast(message, type = "info") {
  const layer = document.getElementById(LAYER_ID);
  if (!layer) return;

  const node = document.createElement("div");
  node.className = `toast${type === "error" ? " toast-error" : type === "ok" ? " toast-ok" : ""}`;
  node.textContent = message;
  layer.appendChild(node);

  setTimeout(() => {
    node.style.transition = "opacity .3s ease, transform .3s ease";
    node.style.opacity = "0";
    node.style.transform = "translateY(8px)";
    setTimeout(() => node.remove(), 320);
  }, 3200);
}

export const toastError = (m) => toast(m, "error");
export const toastOk = (m) => toast(m, "ok");