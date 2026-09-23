/**
 * Scroll reveals for the intro landing.
 * Elements opt in with [data-reveal]; optional --d custom property staggers them.
 * Elements with [data-flip] also flip once when they enter the viewport.
 * Reduced-motion: everything shows immediately, no auto-flip.
 */
export function revealAll(root) {
  const items = [...root.querySelectorAll("[data-reveal]")];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!("IntersectionObserver" in window) || reduce) {
    items.forEach((n) => n.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        if (entry.target.hasAttribute("data-flip")) {
          setTimeout(() => entry.target.classList.add("is-flipped"), 500);
        }
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
  );

  items.forEach((n) => io.observe(n));
}
