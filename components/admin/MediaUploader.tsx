"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress-image";
import { MAX_MEDIA_BYTES } from "@/lib/upload-media";
import type { Media } from "@/lib/types";

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime";

/**
 * Uploads an image / gif / video to the public `project-images` bucket and
 * returns `{ url, kind }`. Images and gifs render as <img>, videos as a muted
 * autoplay <video>. Reuses the Spotlight uploader pattern.
 */
export function MediaUploader({
  value,
  onChange,
  label = "Media",
  aspect = "aspect-[16/9]",
}: {
  value: Media | null;
  onChange: (value: Media | null) => void;
  label?: string;
  aspect?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    const kind = file.type.startsWith("video/")
      ? "video"
      : file.type.startsWith("image/")
        ? "image"
        : null;
    if (!kind) {
      setError("Choose an image, gif or video file.");
      return;
    }
    if (file.size > MAX_MEDIA_BYTES) {
      setError(`The file must be smaller than ${MAX_MEDIA_BYTES / 1024 / 1024} MB.`);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const upload = kind === "video" ? file : await compressImage(file);
      const supabase = createClient();
      const ext = upload.name.split(".").pop()?.toLowerCase() || (kind === "video" ? "mp4" : "jpg");
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("project-images")
        .upload(path, upload, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("project-images").getPublicUrl(path);
      onChange({ url: data.publicUrl, kind, caption: value?.caption });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {label ? <span className="mb-1.5 block text-sm font-medium">{label}</span> : null}
      <div
        className={`relative ${aspect} w-full overflow-hidden rounded-2xl border border-dashed border-border bg-background`}
      >
        {value ? (
          <>
            {value.kind === "video" ? (
              <video
                src={value.url}
                muted
                loop
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value.url} alt="" className="h-full w-full object-cover" />
            )}
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-2 top-2 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-background/85 shadow-sm backdrop-blur transition-colors hover:bg-background"
              aria-label="Remove media"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="grid h-full w-full cursor-pointer place-items-center text-muted-foreground transition-colors hover:bg-foreground/5 disabled:opacity-60"
          >
            {busy ? (
              <span className="flex flex-col items-center gap-2 text-sm">
                <Loader2 className="h-6 w-6 animate-spin" />
                Uploading…
              </span>
            ) : (
              <span className="flex flex-col items-center gap-2 text-sm">
                <ImagePlus className="h-6 w-6" />
                Choose media
              </span>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
      {value ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground underline-offset-2 hover:underline disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          Replace media
        </button>
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Image, GIF, MP4 or WebM · up to 100 MB.
        </p>
      )}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}
