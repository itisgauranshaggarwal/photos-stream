/** Loading placeholders rendered while feeds fetch. */

const HEIGHTS = [240, 200, 260, 210, 250, 190, 230, 205];

export function skeletonCard(i = 0) {
  const card = document.createElement("div");
  card.className = "skeleton";
  card.style.height = `${HEIGHTS[i % HEIGHTS.length]}px`;
  return card;
}

export function skeletonGrid(count = 6) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) frag.appendChild(skeletonCard(i));
  return frag;
}