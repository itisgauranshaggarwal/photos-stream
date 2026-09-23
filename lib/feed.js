import { supabase } from "../supabase.js";

/**
 * Feed loading + sort logic shared by home, profile and future related views.
 * M2: wire queries; M5: wire the personal_feed RPC. (home.js already has a
 * working draft of both — this module centralizes them.)
 */
export const SORTS = {
  "for-you": { label: "For You", order: "for-you" },
  top: { label: "Top", order: "score.desc" },
  new: { label: "New", order: "created_at.desc" },
};

export async function fetchFeed(sort = "for-you", limit = 48) {
  if (!supabase) throw new Error("Supabase not configured");
  if (sort === "for-you") {
    const { data: s } = await supabase.auth.getSession();
    if (s?.session) {
      const { data, error } = await supabase.rpc("personal_feed", {
        u_id: s.session.user.id,
        p_limit: limit,
        p_offset: 0,
      });
      if (error) throw error;
      return data ?? [];
    }
    const { data, error } = await supabase.from("feed_posts").select("*").limit(limit);
    if (error) throw error;
    return data ?? [];
  }
  const [col, dir] = SORTS[sort].order.split(".");
  const { data, error } = await supabase
    .from("feed_posts")
    .select("*")
    .order(col, { ascending: dir === "asc", nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}