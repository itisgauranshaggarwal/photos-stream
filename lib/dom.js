/** Tiny DOM helpers used across all views. */

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function img(src, className, alt = "") {
  const node = el("img", className);
  node.src = src;
  node.alt = alt;
  node.loading = "lazy";
  node.onerror = () => {
    node.classList.add("img-broken");
    node.onerror = null;
  };
  return node;
}

export function a(href, className, text) {
  const node = el("a", className, text);
  node.href = href;
  node.setAttribute("data-link", "");
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function timeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const s = Math.max(0, (Date.now() - then) / 1000);
  if (s < 60) return "just now";
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h`;
  const d = h / 24;
  if (d < 7) return `${Math.floor(d)}d`;
  const w = d / 7;
  if (w < 6) return `${Math.floor(w)}w`;
  return new Date(then).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Long stamped date — "22 SEP 2026" — used on letterheads and profiles. */
export function stampedDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
    .toUpperCase();
}