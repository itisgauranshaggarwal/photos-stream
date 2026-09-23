import { el } from "../lib/dom.js";
import { supabase } from "../supabase.js";
import { getSignedInUser } from "../lib/session.js";
import { toggleVote, removeVote, LIKE, DISLIKE } from "../lib/vote.js";
import { toastError } from "./toast.js";

/**
 * M5 vote control — like / dislike as inked marks on the postcard.
 *
 * Three visual states (idle / like-on / dislike-on), optimistic counts with
 * rollback on error, a 300ms debounce on the whole control, and a pop
 * animation on the touched count. Guests get a toast instead of a vote.
 *
 * Returns { node, patch } where patch({likes, dislikes, myVote}) lets the
 * surrounding view sync counts from realtime events.
 */
const THUMB_SVG =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>';

const DEBOUNCE_MS = 300;

export function voteControl({ postId, likes = 0, dislikes = 0, myVote = 0 }) {
  let state = {
    likes: Number(likes) || 0,
    dislikes: Number(dislikes) || 0,
    myVote: myVote === LIKE || myVote === DISLIKE ? myVote : 0,
  };
  let lastTap = 0;
  let busy = false;

  const wrap = el("div", "votebar");
  wrap.setAttribute("role", "group");
  wrap.setAttribute("aria-label", "Vote on this moment");

  function makeBtn(vote) {
    const isLike = vote === LIKE;
    const btn = el("button", `vote ${isLike ? "like" : "dislike"}`);
    btn.type = "button";
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", isLike ? "Vote up" : "Vote down");
    btn.innerHTML = THUMB_SVG;
    const n = el("span", "vote-n", "");
    btn.appendChild(n);
    btn.addEventListener("click", () => tap(vote));
    return btn;
  }

  const likeBtn = makeBtn(LIKE);
  const dislikeBtn = makeBtn(DISLIKE);
  wrap.append(likeBtn, dislikeBtn);

  function render(pop = null) {
    likeBtn.querySelector(".vote-n").textContent = String(state.likes);
    dislikeBtn.querySelector(".vote-n").textContent = String(state.dislikes);
    likeBtn.classList.toggle("is-on", state.myVote === LIKE);
    dislikeBtn.classList.toggle("is-on", state.myVote === DISLIKE);
    likeBtn.setAttribute("aria-pressed", String(state.myVote === LIKE));
    dislikeBtn.setAttribute("aria-pressed", String(state.myVote === DISLIKE));
    if (pop) {
      pop.classList.remove("pop");
      // reflow to restart the animation
      void pop.offsetWidth;
      pop.classList.add("pop");
    }
  }

  function optimistic(vote) {
    const prev = { ...state };
    const was = state.myVote;

    if (was === vote) {
      // removing my vote
      state[vote === LIKE ? "likes" : "dislikes"] -= 1;
      state.myVote = 0;
    } else {
      if (was === LIKE) state.likes -= 1;
      if (was === DISLIKE) state.dislikes -= 1;
      state[vote === LIKE ? "likes" : "dislikes"] += 1;
      state.myVote = vote;
    }
    return prev;
  }

  async function tap(vote) {
    const now = Date.now();
    if (now - lastTap < DEBOUNCE_MS || busy) return;
    lastTap = now;

    const user = await getSignedInUser(supabase);
    if (!user) {
      toastError("Sign in to vote for moments.");
      return;
    }

    const prev = optimistic(vote);
    render();
    busy = true;
    try {
      if (state.myVote === 0) await removeVote(postId);
      else await toggleVote(postId, state.myVote);
    } catch (err) {
      console.error("vote:", err);
      state = prev;
      toastError("Couldn’t save your vote. Try again.");
    } finally {
      busy = false;
    }
    render();
    const bump = likeBtn.querySelector(".vote-n");
    const rev = dislikeBtn.querySelector(".vote-n");
    render(vote === LIKE ? bump : rev);
  }

  function patch(next) {
    if (next) {
      if (typeof next.likes === "number") state.likes = next.likes;
      if (typeof next.dislikes === "number") state.dislikes = next.dislikes;
      if (next.myVote === LIKE || next.myVote === DISLIKE || next.myVote === 0) {
        state.myVote = next.myVote;
      }
      render();
    }
  }

  render();
  return { node: wrap, patch };
}