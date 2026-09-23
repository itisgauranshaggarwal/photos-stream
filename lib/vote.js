import { supabase } from "../supabase.js";
import { getSignedInUser } from "./session.js";

/**
 * Like / Dislike cycle — one switchable vote per user per post.
 * Backed by the rpc <toggle_vote> in Supabase (atomic, RLS-guarded).
 * M5: optimistic UI + 300ms debounce + realtime patch.
 */
export const LIKE = 1;
export const DISLIKE = -1;

export async function toggleVote(postId, vote) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.rpc("toggle_vote", {
    p_post_id: postId,
    p_vote: vote,
  });
  if (error) throw error;
}

/** Clear my vote for a post. toggle_vote always ends with a row, so removal
 *  goes straight to the table (RLS `votes_write` permits deleting own rows). */
export async function removeVote(postId) {
  if (!supabase) throw new Error("Supabase not configured");
  const user = await getSignedInUser(supabase);
  if (!user) throw new Error("Sign in to vote.");
  const { error } = await supabase
    .from("votes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", user.id);
  if (error) throw error;
}

export async function myVoteOn(postId) {
  if (!supabase) return null;
  const user = await getSignedInUser(supabase);
  if (!user) return null;
  const { data, error } = await supabase
    .from("votes")
    .select("vote")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return null;
  return data?.vote ?? null;
}

/** Live vote events. Requires `votes` to be in the realtime publication
 *  (db/09_votes_realtime.sql). Returns an unsubscribe function.
 *  onChange(postId, payload) — payload has `new`/`old` rows (event "*"). */
export function subscribeVotes(postIds, onChange) {
  if (!supabase) return () => {};
  const ids = Array.from(new Set(postIds)).filter(Boolean);
  if (!ids.length) return () => {};
  // Realtime channel names are length-limited — hash the id list.
  let hash = 0;
  const joined = ids.join("|");
  for (let i = 0; i < joined.length; i++) {
    hash = (hash << 5) - hash + joined.charCodeAt(i);
    hash |= 0;
  }
  const tag = `votes-${Math.abs(hash).toString(36)}`;
  const channel = supabase.channel(tag);
  for (const id of ids) {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "votes",
        filter: `post_id=eq.${id}`,
      },
      (payload) => onChange(id, payload)
    );
  }
  channel.subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}