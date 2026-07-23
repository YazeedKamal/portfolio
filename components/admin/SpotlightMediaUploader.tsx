"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type MediaValue = { url: string; type: "image" | "video" } | null;

export function SpotlightMediaUploader({
  value,
  onChange,
}: {
  value: MediaValue;
  onChange: (value: MediaValue) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    const type = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : null;
    if (!type) {
      setError("Choose an image or video file.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("The file must be smaller than 100 MB.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || (type === "video" ? "mp4" : "jpg");
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("spotlight-media")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("spotlight-media").getPublicUrl(path);
      onChange({ url: data.publicUrl, type });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">Photo or video</span>
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-dashed border-border bg-background">
        {value ? (
          <>
            {value.type === "video" ? (
              <video src={value.url} controls playsInline className="h-full w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value.url} alt="" className="h-full w-full object-cover" />
            )}
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/85 shadow-sm backdrop-blur transition-colors hover:bg-background"
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
            className="grid h-full w-full place-items-center text-muted-foreground transition-colors hover:bg-foreground/5 disabled:opacity-60"
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
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = "";
        }}
      />
      {value ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-2 hover:underline disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          Replace media
        </button>
      ) : null}
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Images, MP4, WebM or MOV · up to 100 MB.</p>
      {error ? <p role="alert" className="mt-2 text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
