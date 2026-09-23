import { supabase } from "../supabase.js";
import { renderPostCard } from "../components/card.js";
import { skeletonGrid } from "../components/skeleton.js";
import { emptyState } from "../components/empty.js";
import { el, a, clear, stampedDate } from "../lib/dom.js";
import { toastError } from "../components/toast.js";
import { friendlyError } from "../lib/errors.js";

/**
 * Public profile gallery (M3) — a person's wall by username.
 * Big stamp, bio, joined date, then their moments in the masonry.
 */
export async function mount(container, params) {
  clear(container);
  const username = params.username || "";

  const head = el("section", "profile-head");
  const stamp = el("div", "stamp-lg", "");
  const hbox = el("div", "profile-copy");
  const title = el("h1", "profile-title", "");
  const handleEl = el("p", "profile-handle", "");
  const bioEl = el("p", "profile-bio", "");
  const facts = el("div", "profile-facts");
  hbox.append(title, handleEl, bioEl, facts);
  head.append(stamp, hbox);
  container.appendChild(head);

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, display_name, bio, avatar_url, created_at")
      .eq("username", username)
      .maybeSingle();

    if (!profile) {
      const state = el("div", "empty-state");
      state.appendChild(el("p", null, "No one with that name on the wall."));
      state.appendChild(a("#/feed", "pill pill-primary btn-cta", "Back to the wall"));
      head.replaceWith(state);
      return;
    }

    const name = profile.display_name || profile.username;
    stamp.textContent = name.slice(0, 1).toUpperCase();
    title.textContent = name;
    handleEl.textContent = "@" + profile.username;
    bioEl.textContent = profile.bio || "";
    if (profile.bio) bioEl.classList.add("has-bio");

    const joined = stampedDate(profile.created_at);
    if (joined) facts.appendChild(el("span", "fact", `Joined ${joined}`));
  } catch (err) {
    console.error(err);
    toastError(friendlyError(err, "Couldn’t load that profile."));
    return;
  }

  const grid = el("div", "masonry");
  grid.appendChild(skeletonGrid(6));
  container.appendChild(grid);

  try {
    const { data: rows, error } = await supabase
      .from("feed_posts")
      .select("*")
      .eq("author_username", username)
      .order("created_at", { ascending: false, nullsFirst: false })
      .limit(48);
    if (error) throw error;

    if (rows && rows.length) {
      clear(grid);
      rows.forEach((row) => grid.appendChild(renderPostCard(row)));
    } else {
      grid.replaceWith(el("div", "empty-state", "No moments posted yet."));
    }
  } catch (err) {
    console.error(err);
    grid.replaceWith(emptyState(friendlyError(err, "Couldn’t load this wall."), {
      retryLabel: "Try again",
      onRetry: () => mount(container, params),
    }));
  }
}