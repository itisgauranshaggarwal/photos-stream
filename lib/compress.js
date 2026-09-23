/**
 * Client-side photo compression: any image → WebP, downscaled to a
 * sane edge, so uploads stay light and postcards load fast.
 */

const SUPPORTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export function isImageFile(file) {
  return file && file.type && SUPPORTED.includes(file.type);
}

/**
 * Downscale (if needed) and re-encode a file as WebP.
 * @returns {Promise<{ blob: Blob, w: number, h: number } | null>}
 */
export async function compressImage(file, maxEdge = 1920, quality = 0.82) {
  try {
    const bmp = await createImageBitmap(file);
    let { width: w, height: h } = bmp;
    const scale = Math.min(1, maxEdge / Math.max(w, h));
    if (scale < 1) {
      w = Math.max(1, Math.round(w * scale));
      h = Math.max(1, Math.round(h * scale));
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (file.type === "image/png") ctx.clearRect(0, 0, w, h);
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (!blob) return null;
    return { blob, w, h };
  } catch (err) {
    console.error("compress:", err);
    return null;
  }
}