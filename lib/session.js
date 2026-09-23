/**
 * Session helper — resolve the signed-in user for protected views.
 *
 * getSession() can return null when the cached session object is out of
 * sync with live auth state (e.g. after a raced restore). getUser()
 * validates the current access token against the GoTrue server, so the
 * guard can never disagree with what the avatar menu shows.
 */

export async function getSignedInUser(supabase) {
  if (!supabase) return null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) return session.user;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) return user;
    } catch (err) {
      console.warn("[session] auth check failed, retrying:", err);
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  return null;
}