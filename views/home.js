import { supabase } from "../supabase.js";
import { renderPostCard, patchCardCounts } from "../components/card.js";
import { skeletonGrid } from "../components/skeleton.js";
import { emptyState } from "../components/empty.js";
import { el, clear, escapeHtml } from "../lib/dom.js";
import { subscribeVotes } from "../lib/vote.js";
import { friendlyError } from "../lib/errors.js";

/**
 * Home feed. Single nav is the top bar (desktop) / bottom bar (mobile) —
 * the page itself renders a warm greeting, no duplicate sort chips.
 *
 * Sort modes:
 *   for-you → rpc personal_feed (M5) / recency fallback when logged out
 *   top     → ORDER BY score DESC
 *   new     → ORDER BY created_at DESC
 */
const SUBTITLES = {
  "for-you": "Share a little of your day — the small moments deserve the wall too.",
  top: "The moments the community loved the most, up top.",
  new: "Freshly shared moments, just as they arrived.",
};

const GREETINGS = ["Good morning", "Good afternoon", "Good evening"];

function greeting() {
  const h = new Date().getHours();
  return GREETINGS[h < 12 ? 0 : h < 18 ? 1 : 2];
}

function todayLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function mount(container, params) {
  const sort = ["top", "new"].includes(params.sort) ? params.sort : "for-you";
  clear(container);

  /** Who am I? (only used to personalize the greeting; not required) */
  let who = "there";
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user) {
      who = escapeHtml(
        data.session.user.user_metadata?.full_name ||
        data.session.user.email?.split("@")[0] ||
        "friend"
      );
    }
  }

  const masthead = el("section", "masthead");

  const labelRow = el("div", "masthead-label");
  labelRow.appendChild(el("span", "label", todayLabel().toUpperCase()));
  masthead.appendChild(labelRow);

  const title = el("h1", "masthead-title");
  title.innerHTML = `${greeting()}, <em>${who}</em>.`;
  masthead.appendChild(title);

  masthead.appendChild(el("p", "masthead-sub", SUBTITLES[sort]));
  container.appendChild(masthead);

  if (!supabase) {
    container.appendChild(
      el("div", "empty-state", "Configure Supabase in .env to load the feed (see README).")
    );
    return;
  }

  const grid = el("div", "masonry");
  grid.appendChild(skeletonGrid(6));
  container.appendChild(grid);

  try {
    const rows = await loadFeed(sort);
    if (rows && rows.length) {
      clear(grid);
      rows.forEach((row, i) => {
        const card = renderPostCard(row);
        card.style.animationDelay = `${Math.min(i, 8) * 30}ms`;
        grid.appendChild(card);
      });
      watchCounts(grid, rows);
    } else {
      grid.replaceWith(emptyFeed());
    }
  } catch (err) {
    console.error(err);
    grid.replaceWith(emptyState(friendlyError(err, "Couldn’t load the feed."), {
      retryLabel: "Try again",
      onRetry: () => mount(container, params),
    }));
  }
}

/** Live patch of card vote counts (M5 realtime). */
function watchCounts(grid, rows) {
  const cardById = new Map();
  const ids = [];
  rows.forEach((row) => {
    if (!row || !row.id) return;
    ids.push(row.id);
    const card = grid.querySelector(`.post-card[data-post-id="${row.id}"]`);
    cardById.set(row.id, card);
  });
  if (!ids.length) return;

  let needsRefresh = new Set();
  const unsubscribe = subscribeVotes(Array.from(new Set(ids)), async (id) => {
    if (!cardById.has(id)) return;
    needsRefresh.add(id);
    if (needsRefresh.size === 1) {
      await new Promise((r) => setTimeout(r, 120));
      const batch = Array.from(needsRefresh);
      needsRefresh = new Set();
      for (const pid of batch) {
        try {
          const { data, error } = await supabase
            .from("feed_posts")
            .select("id, likes, dislikes")
            .eq("id", pid)
            .maybeSingle();
          if (error) continue;
          if (data) patchCardCounts(cardById.get(pid), data.likes, data.dislikes);
        } catch (err) {
          console.warn("feed patch:", err);
        }
      }
    }
  });

  window.addEventListener("hashchange", unsubscribe, { once: true });
}

async function loadFeed(sort) {
  if (sort === "for-you") {
    const { data: s } = await supabase.auth.getSession();
    if (s?.session) {
      const { data, error } = await supabase.rpc("personal_feed", {
        u_id: s.session.user.id,
        p_limit: 48,
        p_offset: 0,
      });
      if (error) throw error;
      return data;
    }
    const { data, error } = await supabase
      .from("feed_posts")
      .select("*")
      .limit(48);
    if (error) throw error;
    return data;
  }

  const order = sort === "top" ? "score.desc" : "created_at.desc";
  const [col, dir] = order.split(".");
  const { data, error } = await supabase
    .from("feed_posts")
    .select("*")
    .order(col, { ascending: dir === "asc", nullsFirst: false })
    .limit(48);
  if (error) throw error;
  return data;
}

function emptyFeed() {
  const state = el("div", "empty-state");
  state.appendChild(el("p", null, "No moments yet — be the first to share one."));
  const cta = el("a", "pill pill-primary btn-cta", "Share a moment");
  cta.href = "#/upload";
  cta.setAttribute("data-link", "");
  state.appendChild(cta);
  return state;
}