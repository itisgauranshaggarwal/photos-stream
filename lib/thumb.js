import { THUMB_EDGE } from "./compress.js";

/**
 * Thumbnail generator (M4). 480px WebP used in feed cards to keep
 * bandwidth tiny while originals stay full-res for the photostrip.
 */
export async function makeThumbnail(file, quality = 0.8) {
  return compressThumbViaCanvas(file, THUMB_EDGE, quality);
}

async function compressThumbViaCanvas(file, edge, quality) {
  // M4 implementation.
  throw new Error("makeThumbnail: wired in M4");
}