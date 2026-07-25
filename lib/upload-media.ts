"use client";

import { createClient } from "@/lib/supabase/client";
import type { Media } from "@/lib/types";

/** Uploads an image / gif / video to the public `project-images` bucket and
 *  returns `{ url, kind }`. Shared by the media uploader and the inline
 *  canvas editors. */
export async function uploadMedia(file: File): Promise<Media> {
  const kind = file.type.startsWith("video/") ? "video" : "image";
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || (kind === "video" ? "mp4" : "jpg");
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("project-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("project-images").getPublicUrl(path);
  return { url: data.publicUrl, kind };
}

export const MEDIA_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime";
