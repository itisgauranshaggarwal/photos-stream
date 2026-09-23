import { el, img, escapeHtml, timeAgo } from "../lib/dom.js";
import { applyImage, attachRefresh } from "../lib/urls.js";
import { toastError } from "./toast.js";

/**
 * Post card used across the feed, profiles and related views.
 * Covers resolve through live signed URLs (M2); vote wiring is M5.
 */
export function renderPostCard(post, onClick = null) {
  const card = el("a", "post-card");
  card.href = `#/post/${post.id}`;
  card.setAttribute("data-link", "");
  if (onClick) card.addEventListener("click", onClick);

  const media = el("div", "media");
  const coverPath = post.cover_url || post.cover_full || "";
  const cover = img("", "cover", escapeHtml(post.title));
  applyImage(cover, coverPath);
  attachRefresh(cover, coverPath);
  media.appendChild(cover);

  const body = el("div", "body");
  body.appendChild(el("div", "title", post.title || "Untitled"));
  if (post.description) {
    body.appendChild(el("div", "desc", escapeHtml(post.description)));
  }

  const meta = el("div", "meta");
  const author = el("div", "author");
  const avatar = el("div", "avatar", (post.author_username || "?").slice(0, 1).toUpperCase());
  const name = el("span", "author-name", "@" + (post.author_username || "user"));
  author.append(avatar, name);
  author.appendChild(el("span", "sep", "·"));
  if (post.created_at) {
    author.appendChild(el("time", null, timeAgo(post.created_at)));
  }

  const THUMB =
    '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>';

  const counts = el("div", "counts");
  counts.innerHTML =
    `<span class="up">${THUMB}${Number(post.likes || 0)}</span>` +
    `<span class="down">${THUMB}${Number(post.dislikes || 0)}</span>`;

  meta.append(author, counts);
  body.appendChild(meta);
  card.append(media, body);

  card.dataset.postId = post.id;
  return card;
}

/** Live-update a rendered card's vote counts (M5 realtime). */
export function patchCardCounts(card, likes, dislikes) {
  if (!card) return;
  const spans = card.querySelectorAll(".counts .up, .counts .down");
  if (spans.length < 2) return;
  spans[0].lastChild.textContent = String(Number(likes || 0));
  spans[1].lastChild.textContent = String(Number(dislikes || 0));
}