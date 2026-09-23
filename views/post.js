import { supabase } from "../supabase.js";
import { el, img, a, clear, escapeHtml, stampedDate } from "../lib/dom.js";
import { applyImage, attachRefresh } from "../lib/urls.js";
import { voteControl } from "../components/votebutton.js";
import { myVoteOn, subscribeVotes } from "../lib/vote.js";

/**
 * Post viewer (M2) — a photostrip on a paper card.
 * Main print + prev/next + thumbnails + keyboard, full-screen lightbox,
 * letterhead (stamp author) and the story on the back: title, description,
 * and the M5 vote control (live via realtime).
 */

const ICON_CHEV_L =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
const ICON_CHEV_R =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';
const ICON_CLOSE =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
export async function mount(container, params) {
  clear(container);
  const id = params.id;
  const view = el("article", "post-view");
  const loading = el("div", "post-loading");
  const skel = el("div", "skeleton", "");
  skel.style.height = "clamp(320px, 62vh, 560px)";
  skel.style.marginBottom = "0";
  loading.appendChild(skel);
  container.appendChild(loading);

  let post = null;
  let photos = [];
  try {
    const [postRes, photosRes] = await Promise.all([
      supabase
        ? supabase.from("feed_posts").select("*").eq("id", id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        ? supabase
            .from("post_photos")
            .select("id, storage_path, thumb_path, position")
            .eq("post_id", id)
            .order("position", { ascending: true })
        : Promise.resolve({ data: [] }),
    ]);
    post = postRes.data;
    photos = (photosRes.data && photosRes.data.length
      ? photosRes.data
      : [{ storage_path: post ? post.cover_full : "" }]
    ).map((ph) => ({ src: ph.storage_path, thumb: ph.thumb_path || "", alt: post?.title || "" }));
  } catch (err) {
    console.error("post view:", err);
    loading.replaceWith(notFound());
    return;
  }
  loading.remove();
  container.appendChild(view);

  if (!post) {
    view.replaceWith(notFound());
    return;
  }

  document.title = `${post.title} — PhotoStream`;

  let myVote = 0;
  try {
    myVote = (await myVoteOn(post.id)) || 0;
  } catch (err) {
    console.warn("post myVote:", err);
  }

  let index = 0;

  const head = el("div", "post-head");
  const avatar = el("a", "avatar stamp", (post.author_username || "?").slice(0, 1).toUpperCase());
  avatar.href = `#/profile/${encodeURIComponent(post.author_username || "")}`;
  avatar.setAttribute("data-link", "");
  const writer = el("div", "post-writer");
  writer.appendChild(
    a(
      `#/profile/${encodeURIComponent(post.author_username || "")}`,
      "post-author",
      "@" + (post.author_username || "user")
    )
  );
  writer.appendChild(el("span", "post-date", stampedDate(post.created_at) || ""));
  head.append(avatar, writer);

  const stage = el("figure", "stage");
  const mainImg = img("", "stage-img", escapeHtml(post.title));
  mainImg.loading = "eager";
  attachRefresh(mainImg, photos[0].src);
  applyImage(mainImg, photos[0].src);
  stage.appendChild(mainImg);

  const count = el("span", "stage-count", "");
  count.setAttribute("aria-live", "polite");
  stage.appendChild(count);

  const prevBtn = el("button", "stage-nav prev");
  prevBtn.type = "button";
  prevBtn.setAttribute("aria-label", "Previous photo");
  prevBtn.innerHTML = ICON_CHEV_L;
  const nextBtn = el("button", "stage-nav next");
  nextBtn.type = "button";
  nextBtn.setAttribute("aria-label", "Next photo");
  nextBtn.innerHTML = ICON_CHEV_R;
  stage.append(prevBtn, nextBtn);

  const plate = el("figcaption", "plate");
  const pos = el("span", "label plate-pos");
  plate.appendChild(pos);

  const body = el("div", "post-body");
  body.appendChild(el("h1", "post-title", post.title || "Untitled"));
  if (post.description) {
    body.appendChild(el("p", "post-desc", post.description));
  }

  const foot = el("div", "post-foot");
  const votes = voteControl({
    postId: post.id,
    likes: Number(post.likes || 0),
    dislikes: Number(post.dislikes || 0),
    myVote,
  });
  foot.appendChild(votes.node);
  body.appendChild(foot);

  const thumbs = el("div", "strip-thumbs");
  photos.forEach((ph, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "thumb-btn";
    btn.setAttribute("aria-label", `Photo ${i + 1}`);
    const t = img("", "thumb", escapeHtml(post.title));
    attachRefresh(t, ph.thumb || ph.src);
    applyImage(t, ph.thumb || ph.src);
    btn.appendChild(t);
    btn.addEventListener("click", () => goto(i));
    thumbs.appendChild(btn);
  });

  view.append(head, stage, plate, body, thumbs);

  if (photos.length < 2) {
    prevBtn.hidden = true;
    nextBtn.hidden = true;
    thumbs.hidden = true;
  }

  /* ---------- lightbox ---------- */
  let lightbox = null;

  function paintLightbox() {
    const lbImg = lightbox.querySelector(".lightbox-img");
    applyImage(lbImg, photos[index].src);
    lightbox.querySelector(".lightbox-pos").textContent = `${index + 1} / ${photos.length}`;
  }

  function openLightbox() {
    lightbox = el("div", "lightbox");
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", post.title || "Photo");
    const lbImg = el("img", "lightbox-img");
    lbImg.alt = post.title || "";
    attachRefresh(lbImg, photos[index].src);
    applyImage(lbImg, photos[index].src);

    const close = el("button", "lightbox-close");
    close.type = "button";
    close.setAttribute("aria-label", "Close fullscreen view");
    close.innerHTML = ICON_CLOSE;

    const prevLb = el("button", "lightbox-nav prev");
    prevLb.type = "button";
    prevLb.setAttribute("aria-label", "Previous photo");
    prevLb.innerHTML = ICON_CHEV_L;
    const nextLb = el("button", "lightbox-nav next");
    nextLb.type = "button";
    nextLb.setAttribute("aria-label", "Next photo");
    nextLb.innerHTML = ICON_CHEV_R;

    const lbPos = el("span", "lightbox-pos", "");
    const lbPosWrap = el("div", "lightbox-bar");
    lbPosWrap.appendChild(lbPos);
    lightbox.append(lbImg, close, prevLb, nextLb, lbPosWrap);

    close.addEventListener("click", closeLightbox);
    prevLb.addEventListener("click", () => { goto(index - 1); paintLightbox(); });
    nextLb.addEventListener("click", () => { goto(index + 1); paintLightbox(); });
    lightbox.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") { goto(index - 1); paintLightbox(); }
      if (e.key === "ArrowRight") { goto(index + 1); paintLightbox(); }
    });

    document.body.classList.add("view-locked");
    document.body.appendChild(lightbox);
    lightbox.focus();
    paintLightbox();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.remove();
    lightbox = null;
    document.body.classList.remove("view-locked");
  }

  /* ---------- navigation ---------- */
  function goto(i) {
    index = (i + photos.length) % photos.length;
    applyImage(mainImg, photos[index].src);
    count.textContent = `${index + 1} / ${photos.length}`;
    pos.textContent = `${index + 1} / ${photos.length}`;
    thumbs.querySelectorAll(".thumb-btn").forEach((b, bi) => {
      b.classList.toggle("is-active", bi === index);
    });
  }

  mainImg.addEventListener("click", openLightbox);
  prevBtn.addEventListener("click", () => goto(index - 1));
  nextBtn.addEventListener("click", () => goto(index + 1));
  view.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") goto(index - 1);
    if (e.key === "ArrowRight") goto(index + 1);
    if (e.key === "Escape") closeLightbox();
  });

  count.textContent = `${index + 1} / ${photos.length}`;
  pos.textContent = `${index + 1} / ${photos.length}`;
  const all = thumbs.querySelectorAll(".thumb-btn");
  all[0]?.classList.add("is-active");
  view.tabIndex = -1;

  /* ---------- realtime vote counts ---------- */
  let unsubscribe = () => {};
  const refresh = async () => {
    try {
      const { data: fresh } = await supabase
        .from("feed_posts")
        .select("likes, dislikes")
        .eq("id", post.id)
        .maybeSingle();
      if (fresh) votes.patch({ likes: fresh.likes, dislikes: fresh.dislikes });
    } catch (err) {
      console.warn("post refresh:", err);
    }
  };
  unsubscribe = subscribeVotes([post.id], refresh);
  const dispose = () => {
    unsubscribe();
  };
  window.addEventListener("hashchange", dispose, { once: true });
}

function notFound() {
  const state = el("div", "empty-state");
  state.appendChild(el("p", null, "This moment isn’t on the wall."));
  const back = a("#/feed", "pill pill-primary btn-cta", "Back to the wall");
  state.appendChild(back);
  return state;
}