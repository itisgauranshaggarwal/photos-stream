import { supabase } from "../supabase.js";
import { renderPostCard } from "../components/card.js";
import { skeletonGrid } from "../components/skeleton.js";
import { confirmDialog } from "../components/confirm.js";
import { emptyState } from "../components/empty.js";
import { el, a, clear, escapeHtml, stampedDate } from "../lib/dom.js";
import { toastOk, toastError } from "../components/toast.js";
import { friendlyError } from "../lib/errors.js";
import { requireAuth } from "../lib/auth.js";

/**
 * "My posts" — your wall with edit/delete management + sign out (M3).
 * Deleting removes the post row (cascades photo rows + votes) and the
 * Storage folder in one go; photo rows aren't seeded so no storage to
 * bother for demo moments.
 */
export async function mount(container, params) {
  clear(container);

  const user = await requireAuth();
  if (!supabase || !user) {
    window.location.hash = "#/login";
    toastError("Sign in to see your wall.");
    return;
  }

  const head = el("section", "me-head");
  const stamp = el("div", "stamp-lg", "");
  head.appendChild(stamp);

  const hbox = el("div", "me-copy");
  const title = el("h1", "me-title", "Your wall");
  hbox.appendChild(title);
  const sub = el("p", "me-sub", "Loading your moments…");
  hbox.appendChild(sub);

  const signOut = el("button", "row-btn me-signout", "Sign out");
  signOut.type = "button";
  signOut.addEventListener("click", async () => {
    try {
      await supabase.auth.signOut();
      toastOk("Signed out.");
    } catch (err) {
      console.error(err);
      toastError("Couldn’t sign out.");
    }
  });

  head.append(stamp, hbox, signOut);
  container.appendChild(head);

  const grid = el("div", "masonry");
  grid.appendChild(skeletonGrid(4));
  container.appendChild(grid);

  let username = "";
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, display_name, bio, avatar_url, created_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      username = profile.username || "";
      stamp.textContent = (profile.display_name || profile.username || "?").slice(0, 1).toUpperCase();
      sub.textContent = profile.display_name
        ? `${escapeHtml(profile.display_name)} · @${escapeHtml(profile.username)}`
        : `@${escapeHtml(profile.username)}`;
    } else {
      title.textContent = "No profile yet";
      sub.textContent = "Sign out and back in to create one.";
      grid.remove();
      return;
    }
  } catch (err) {
    console.error(err);
    toastError(friendlyError(err, "Couldn’t load your profile."));
    return;
  }

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
      rows.forEach((row) => {
        const item = el("div", "manage-item");
        item.appendChild(renderPostCard(row));

        const manage = el("div", "manage-row");
        const edit = a(`#/edit/${row.id}`, "row-btn", "Edit");
        manage.appendChild(edit);

        const del = el("button", "row-btn row-danger", "Delete");
        del.type = "button";
        del.addEventListener("click", () => {
          confirmDialog({
            title: "Delete this moment?",
            message: "The photos and votes go with it. This can’t be undone.",
            confirmLabel: "Delete",
            onConfirm: () => deletePost(row.id, item),
          });
        });
        manage.appendChild(del);

        item.appendChild(manage);
        grid.appendChild(item);
      });
    } else {
      grid.replaceWith(emptyWall());
    }
  } catch (err) {
    console.error(err);
    grid.replaceWith(emptyState(friendlyError(err, "Couldn’t load your moments."), {
      retryLabel: "Try again",
      onRetry: () => mount(container, params),
    }));
  }
}

function emptyWall() {
  const state = el("div", "empty-state");
  state.appendChild(el("p", null, "Nothing on your wall yet — post the first moment."));
  state.appendChild(a("#/upload", "pill pill-primary btn-cta", "Share a moment"));
  return state;
}

async function deletePost(id, item) {
  try {
    const { data: photos } = await supabase
      .from("post_photos")
      .select("storage_path, thumb_path")
      .eq("post_id", id);

    const paths = (photos || []).flatMap((p) => [p.storage_path, p.thumb_path].filter(Boolean));
    if (paths.length) {
      const { error } = await supabase.storage.from("photos").remove(paths);
      if (error) console.warn("storage remove:", error.message);
    }

    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) throw error;
    item.remove();
    toastOk("Moment deleted.");
  } catch (err) {
    console.error(err);
    toastError(friendlyError(err, "Couldn’t delete that moment."));
  }
}