"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Uploads an image to the `project-images` bucket and returns its public URL.
 * Shows the current image with a replace/remove affordance.
 */
export function ImageUploader({
  value,
  onChange,
  label = "Image",
  aspect = "aspect-[16/9]",
  bucket = "project-images",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  aspect?: string;
  bucket?: "project-images" | "avatars";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <div className={`relative ${aspect} w-full overflow-hidden rounded-2xl border border-dashed border-border bg-background`}>
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="grid h-full w-full place-items-center text-muted-foreground transition-colors hover:bg-foreground/5"
          >
            {busy ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <span className="flex flex-col items-center gap-2 text-sm">
                <ImagePlus className="h-6 w-6" />
                Click to upload
              </span>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Replace image
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
