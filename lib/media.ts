/** Media helpers shared by server components and client editors. Pure — no
 *  React, no "use client" — so it's safe to import anywhere. */

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i;

/** A `cover_url` is a plain string with no stored `kind`, so we infer video
 *  from its file extension. Matches the video types allowed by `MEDIA_ACCEPT`. */
export function isVideoUrl(url: string | null | undefined): boolean {
  return !!url && VIDEO_EXT.test(url);
}
