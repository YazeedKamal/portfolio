"use client";

import { createClient } from "@/lib/supabase/client";
import { MediaUploadError } from "@/lib/upload-media";

/** Font files upload raw (no compression) to the same public `project-images`
 *  bucket used for media. Kept well under the bucket size limit. */
const MAX_FONT_BYTES = 5 * 1024 * 1024; // 5 MB

/** Extension → CSS `@font-face` `format()` keyword + upload content-type. */
const FONT_TYPES: Record<string, { format: string; contentType: string }> = {
  woff2: { format: "woff2", contentType: "font/woff2" },
  woff: { format: "woff", contentType: "font/woff" },
  ttf: { format: "truetype", contentType: "font/ttf" },
  otf: { format: "opentype", contentType: "font/otf" },
};

export const FONT_ACCEPT = ".woff2,.woff,.ttf,.otf";

/** Uploads a font file and returns the public URL + its CSS `format` keyword. */
export async function uploadFont(file: File): Promise<{ url: string; format: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const type = FONT_TYPES[ext];
  if (!type) {
    throw new MediaUploadError("Use a .woff2, .woff, .ttf, or .otf font file.");
  }
  if (file.size > MAX_FONT_BYTES) {
    throw new MediaUploadError(
      `This font is ${(file.size / 1024 / 1024).toFixed(1)} MB — keep it under ${MAX_FONT_BYTES / 1024 / 1024} MB.`,
    );
  }

  const supabase = createClient();
  const path = `fonts/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("project-images")
    .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: type.contentType });
  if (error) throw error;

  const { data } = supabase.storage.from("project-images").getPublicUrl(path);
  return { url: data.publicUrl, format: type.format };
}
