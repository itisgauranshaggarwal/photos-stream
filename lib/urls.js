import { supabase } from "../supabase.js";

/**
 * Signed-URL lifecycle helper (M2).
 * Supabase storage URLs expire after 1 h. We cache them, refresh on a
 * documented budget, and pass through anything that is not a storage
 * path (http(s) covers, seed data: URIs) untouched.
 */

const TTL_MS = 55 * 60 * 1000; // just under Supabase's 1h default
const cache = new Map(); // path -> { url, expiresAt }

function isRemote(src) {
  return /^(https?:|data:)/.test(src || "");
}

/**
 * Resolve an image source:
 *   - remote/data URLs → as-is
 *   - storage paths     → signed URL (cached, refreshed on expiry)
 */
export async function signedUrl(storagePath) {
  if (!storagePath || isRemote(storagePath)) return storagePath;

  const hit = cache.get(storagePath);
  if (hit && hit.expiresAt > Date.now()) return hit.url;
  if (!supabase) return storagePath;

  const { data, error } = await supabase.storage
    .from("photos")
    .createSignedUrl(storagePath, 3600);
  if (error || !data?.signedUrl) {
    console.warn(`[urls] sign failed for "${storagePath}":`, error);
    return storagePath;
  }

  const url = data.signedUrl;
  cache.set(storagePath, { url, expiresAt: Date.now() + TTL_MS });
  return url;
}

/** Drop a path from the cache so the next resolution refetches. */
export function revoke(storagePath) {
  cache.delete(storagePath);
}

/** Resolve a source and drop it into an <img>. */
export async function applyImage(imgEl, storagePath) {
  if (!imgEl || !storagePath) return;
  imgEl.src = await signedUrl(storagePath);
}

/**
 * Attach an onerror handler that transparently re-requests a fresh signed
 * URL once (expired-URL recovery). Two failures → mark the image broken.
 */
export function attachRefresh(imgEl, storagePath) {
  if (!imgEl || !storagePath || isRemote(storagePath)) return;
  imgEl.addEventListener("error", async () => {
    if (imgEl.dataset.refreshAttempt) {
      imgEl.classList.add("img-broken");
      return;
    }
    imgEl.dataset.refreshAttempt = "1";
    revoke(storagePath);
    const fresh = await signedUrl(storagePath);
    if (fresh && fresh !== storagePath) imgEl.src = fresh;
  });
}