"use client";

import { MediaUploadError } from "@/lib/upload-media";

/** SVGs are stored inline as a base64 data URI inside the headline design —
 *  NOT uploaded to storage — so there's no bucket mime gate to fight, and they
 *  render via <img> (which never executes scripts inside the SVG). Kept small
 *  since the markup lives in the `hero_title_rich` JSON. */
const MAX_SVG_BYTES = 256 * 1024; // 256 KB

export const SVG_ACCEPT = ".svg,image/svg+xml";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Trim the SVG's `viewBox` to the tight bounding box of its actual content so
 * it "takes the size of the element" — uploaded SVGs often carry whitespace
 * (padding baked into the viewBox), which otherwise renders as empty space
 * above/around the graphic when placed in the headline. Measured by rendering
 * the SVG off-screen and reading `getBBox()`. Returns the original markup
 * untouched if anything goes wrong (parse error, no measurable content, or
 * running without a DOM).
 */
function tightenSvgViewBox(text: string): string {
  if (typeof document === "undefined") return text;
  try {
    const doc = new DOMParser().parseFromString(text, "image/svg+xml");
    if (doc.querySelector("parsererror")) return text;
    const svg = doc.documentElement;
    if (!svg || svg.namespaceURI !== SVG_NS || svg.localName !== "svg") return text;

    // Render off-screen (not display:none — getBBox needs a render tree).
    const holder = document.createElement("div");
    holder.style.cssText =
      "position:absolute;left:-99999px;top:-99999px;width:0;height:0;overflow:hidden;";
    const live = document.importNode(svg, true) as unknown as SVGSVGElement;
    holder.appendChild(live);
    document.body.appendChild(holder);

    let box: DOMRect | null = null;
    try {
      box = live.getBBox();
    } finally {
      document.body.removeChild(holder);
    }
    if (!box || box.width <= 0 || box.height <= 0) return text;

    // Small padding so strokes/round caps at the edges aren't clipped.
    const pad = Math.max(box.width, box.height) * 0.02;
    const vb = [box.x - pad, box.y - pad, box.width + pad * 2, box.height + pad * 2]
      .map((n) => Math.round(n * 1000) / 1000)
      .join(" ");
    svg.setAttribute("viewBox", vb);
    // Drop intrinsic dimensions so the tight viewBox drives the aspect ratio
    // (we size via CSS height + width:auto when rendering).
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    return new XMLSerializer().serializeToString(svg);
  } catch {
    return text;
  }
}

/** Reads an SVG file and returns it as an inline `data:` URL usable as an img src. */
export async function uploadSvg(file: File): Promise<{ url: string }> {
  const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
  if (!isSvg) throw new MediaUploadError("Use an .svg file.");
  if (file.size > MAX_SVG_BYTES) {
    throw new MediaUploadError(
      `This SVG is ${(file.size / 1024).toFixed(0)} KB — keep it under ${MAX_SVG_BYTES / 1024} KB.`,
    );
  }

  const text = tightenSvgViewBox(await file.text());
  // UTF-8 safe base64 (handles non-ASCII characters in the SVG markup).
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const base64 = btoa(binary);
  return { url: `data:image/svg+xml;base64,${base64}` };
}
