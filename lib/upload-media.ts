"use client";

import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress-image";
import type { Media } from "@/lib/types";

/** Uploads an image / gif / video / HTML animation to the public
 *  `project-images` bucket and returns `{ url, kind }`. Images are compressed to
 *  lightweight WebP first; videos and self-contained HTML files upload as-is (the
 *  HTML gets an explicit `text/html` content-type so the bucket renders it inline
 *  inside a sandboxed iframe). Shared by the media uploader and inline editors. */
export async function uploadMedia(file: File): Promise<Media> {
  // HTML animations are kept inline and rendered via <iframe srcDoc> — never
  // uploaded, so they run as live HTML regardless of how storage would serve
  // them (Supabase serves .html as text/plain, which shows the source instead).
  const isHtml = file.type === "text/html" || /\.html?$/i.test(file.name);
  if (isHtml) {
    return { url: "", kind: "embed", html: await file.text() };
  }
  const kind = file.type.startsWith("video/") ? "video" : "image";
  const upload = kind === "image" ? await compressImage(file) : file;
  const supabase = createClient();
  const ext = upload.name.split(".").pop()?.toLowerCase() || (kind === "video" ? "mp4" : "jpg");
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("project-images")
    .upload(path, upload, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("project-images").getPublicUrl(path);
  return { url: data.publicUrl, kind };
}

export const MEDIA_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime,text/html,.html,.htm";
