/**
 * Human-friendly error messages (M6).
 * Supabase/GoTrue errors surface raw text ("relation does not exist",
 * "Failed to fetch", "NetworkError", 500 codes…). Map the common ones
 * to something an owner can act on, and keep the rest honest but calm.
 */

export function friendlyError(err, fallback = "Something went wrong — please try again.") {
  if (!err) return fallback;

  const msg =
    (err.message || err.error_description || err.details || err.hint || "").toString().toLowerCase();
  const codes = err.status || err.code || err.statusCode;

  if (!navigator.onLine || /offline|networkerror|failed to fetch|fetch failed|load failed|the internet connection appears to be offline|typeerror:.*network/i.test(msg)) {
    return "No internet connection. Check your connection and try again.";
  }
  if (/auth\/|invalid login|invalid password|user not found|login attempt|email not confirmed|user_already_exists|already registered|weak password|password.*(too|length)|profile.*required/i.test(msg)) {
    // handled by views with their own, friendlier copy where possible
    return null;
  }
  if (/permission|row-level|rls|policy|not allowed|access denied|forbidden|denied|jwt|insert.*not permitted/i.test(msg)) {
    return "You don’t have permission for that action. If this keeps happening, run the db/*.sql setup scripts.";
  }
  if (/bucket.*(not found|does not exist)|no such key|notfound|such file/i.test(msg)) {
    return "A photo couldn’t be found on the server. It may have been moved or deleted.";
  }
  if (/timeout|timed out|slow|aborted/i.test(msg)) {
    return "That took too long — the network may be slow. Try again in a moment.";
  }
  if (codes === 401 || codes === 403) {
    return "Your session has expired — sign in again.";
  }
  if (codes === 404) {
    return "That item couldn’t be found on the wall.";
  }
  if (codes === 429 || /too many|rate limit/i.test(msg)) {
    return "Too many requests right now — wait a few seconds and try again.";
  }
  if (codes === 500 || /server error|50[0-9]/i.test(msg)) {
    return "The server hiccuped. Try again in a moment.";
  }
  return fallback;
}

/** Supabase auth errors → the message we want to show. */
export function authError(err, fallback = "Couldn’t sign in.") {
  const msg = (err?.message || "").toString().toLowerCase();
  if (/invalid login credentials|invalid password|user not found/i.test(msg)) return "Wrong username or password.";
  if (/email not confirmed|confirm.*email/i.test(msg)) return "Confirm the email we sent first, then sign in.";
  if (/user already registered|already been registered|already registered/i.test(msg)) return "That email already has an account — sign in instead.";
  if (/weak password/i.test(msg)) return "Choose a password with at least 6 characters.";
  return friendlyError(err, fallback);
}