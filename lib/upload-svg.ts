"use client";

import { MediaUploadError } from "@/lib/upload-media";

/** SVGs are stored inline as a base64 data URI inside the headline design —
 *  NOT uploaded to storage — so there's no bucket mime gate to fight, and they
 *  render via <img> (which never executes scripts inside the SVG). Kept small
 *  since the markup lives in the `hero_title_rich` JSON. */
const MAX_SVG_BYTES = 256 * 1024; // 256 KB

export const SVG_ACCEPT = ".svg,image/svg+xml";

/** Reads an SVG file and returns it as an inline `data:` URL usable as an img src. */
export async function uploadSvg(file: File): Promise<{ url: string }> {
  const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
  if (!isSvg) throw new MediaUploadError("Use an .svg file.");
  if (file.size > MAX_SVG_BYTES) {
    throw new MediaUploadError(
      `This SVG is ${(file.size / 1024).toFixed(0)} KB — keep it under ${MAX_SVG_BYTES / 1024} KB.`,
    );
  }

  const text = await file.text();
  // UTF-8 safe base64 (handles non-ASCII characters in the SVG markup).
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const base64 = btoa(binary);
  return { url: `data:image/svg+xml;base64,${base64}` };
}
