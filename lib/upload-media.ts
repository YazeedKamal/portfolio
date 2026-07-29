"use client";

import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress-image";
import type { Media } from "@/lib/types";

/** Uploads an image / gif / video / HTML animation to the public
 *  `project-images` bucket and returns `{ url, kind }`. Images are compressed to
 *  lightweight WebP first; videos and self-contained HTML files upload as-is (the
 *  HTML gets an explicit `text/html` content-type so the bucket renders it inline
 *  inside a sandboxed iframe). Shared by the media uploader and inline editors. */
/** Largest file we accept. Matches the `project-images` / `spotlight-media`
 *  bucket `file_size_limit` — keep the two in sync if you change either. */
export const MAX_MEDIA_BYTES = 100 * 1024 * 1024; // 100 MB

/** Thrown for problems worth showing the user verbatim (too large, wrong type,
 *  bucket rejected it). Callers can render `.message` straight into the UI. */
export class MediaUploadError extends Error {}

export async function uploadMedia(file: File): Promise<Media> {
  // HTML animations are kept inline and rendered via <iframe srcDoc> — never
  // uploaded, so they run as live HTML regardless of how storage would serve
  // them (Supabase serves .html as text/plain, which shows the source instead).
  const isHtml = file.type === "text/html" || /\.html?$/i.test(file.name);
  if (isHtml) {
    return { url: "", kind: "embed", html: await file.text() };
  }
  const kind = file.type.startsWith("video/") ? "video" : "image";
  // Guard before we hit the network so a big video fails instantly with a clear
  // message instead of a slow, cryptic storage rejection. Videos upload as-is;
  // images are compressed first, so only the video path can realistically bust
  // the limit — but we check the original either way to be safe.
  if (file.size > MAX_MEDIA_BYTES) {
    const noun = kind === "video" ? "video" : "image";
    throw new MediaUploadError(
      `This ${noun} is ${(file.size / 1024 / 1024).toFixed(0)} MB — keep it under ${MAX_MEDIA_BYTES / 1024 / 1024} MB.`,
    );
  }
  const upload = kind === "image" ? await compressImage(file) : file;
  const supabase = createClient();
  const ext = upload.name.split(".").pop()?.toLowerCase() || (kind === "video" ? "mp4" : "jpg");
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("project-images")
    .upload(path, upload, { cacheControl: "3600", upsert: false });
  if (error) {
    // Supabase reports an over-limit upload as a 413 / "maximum allowed size"
    // — translate that to the same friendly copy in case the bucket limit is
    // lower than ours.
    if (/maximum allowed size|payload too large|413/i.test(error.message)) {
      throw new MediaUploadError(
        `This ${kind === "video" ? "video" : "image"} is too large — keep it under ${MAX_MEDIA_BYTES / 1024 / 1024} MB.`,
      );
    }
    throw error;
  }
  const { data } = supabase.storage.from("project-images").getPublicUrl(path);
  return { url: data.publicUrl, kind };
}

export const MEDIA_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime,text/html,.html,.htm";
