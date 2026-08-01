"use client";

import { useRef, useState, useTransition } from "react";
import {
  Circle,
  Loader2,
  Minus,
  Plus,
  Shapes,
  Square,
  Trash2,
  Upload,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress-image";
import { uploadSvg, SVG_ACCEPT } from "@/lib/upload-svg";
import {
  addFooterLogo,
  removeFooterLogo,
  updateFooterLogo,
} from "@/app/admin/actions";
import type { FooterLogo, FooterLogoShape } from "@/lib/types";

const ACCEPT = `${SVG_ACCEPT},image/png,image/webp,image/avif`;

const SHAPES: { value: FooterLogoShape; label: string; Icon: typeof Circle }[] = [
  { value: "free", label: "Free", Icon: Shapes },
  { value: "circle", label: "Circle", Icon: Circle },
  { value: "square", label: "Square", Icon: Square },
];

/** Turns a picked file into a URL: SVGs become inline data URLs (no bucket),
 *  raster images are compressed and uploaded to the project-images bucket. */
async function fileToUrl(file: File): Promise<string> {
  const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
  if (isSvg) return (await uploadSvg(file)).url;

  const upload = await compressImage(file);
  const supabase = createClient();
  const ext = upload.name.split(".").pop() ?? "png";
  const path = `footer-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("project-images")
    .upload(path, upload, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return supabase.storage.from("project-images").getPublicUrl(path).data.publicUrl;
}

export function FooterLogosManager({
  initialLogos,
}: {
  initialLogos: FooterLogo[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [logos, setLogos] = useState<FooterLogo[]>(initialLogos);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  async function handleFiles(files: FileList) {
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const url = await fileToUrl(file);
        const logo: FooterLogo = {
          id: crypto.randomUUID(),
          url,
          size: 46,
          shape: "free",
          count: 3,
          label: file.name.replace(/\.[^.]+$/, "").slice(0, 60),
        };
        const res = await addFooterLogo(logo);
        if (res?.error) throw new Error(res.error);
        setLogos((prev) => [...prev, logo]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  function patchLogo(id: string, patch: Partial<FooterLogo>) {
    setLogos((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    start(async () => {
      await updateFooterLogo(id, patch);
    });
  }

  function remove(id: string) {
    setLogos((prev) => prev.filter((l) => l.id !== id));
    start(async () => {
      await removeFooterLogo(id);
    });
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">
            Upload SVGs (or PNGs) that tumble in the homepage footer and scatter
            away from the cursor. Set a size and shape for each.
          </p>
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-foreground/5 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {busy ? "Uploading…" : "Upload"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {logos.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
          No logos yet — the footer shows only geometric shapes.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {logos.map((logo) => (
            <li
              key={logo.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center"
            >
              {/* Preview */}
              <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-card p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.url}
                  alt={logo.label ?? ""}
                  className="h-full w-full object-contain"
                />
              </span>

              {/* Size */}
              <label className="flex flex-1 items-center gap-2 text-xs text-muted-foreground">
                <span className="w-8 shrink-0">Size</span>
                <input
                  type="range"
                  min={20}
                  max={96}
                  step={2}
                  value={logo.size}
                  onChange={(e) =>
                    patchLogo(logo.id, { size: Number(e.target.value) })
                  }
                  className="w-full accent-[var(--foreground)]"
                  aria-label={`Size for ${logo.label ?? "logo"}`}
                />
                <span className="w-8 shrink-0 text-right tabular-nums text-foreground">
                  {logo.size}
                </span>
              </label>

              {/* Count (how many copies tumble) */}
              <div className="flex shrink-0 items-center gap-1 rounded-full border border-border p-0.5">
                <button
                  type="button"
                  onClick={() =>
                    patchLogo(logo.id, { count: Math.max(1, logo.count - 1) })
                  }
                  title="Fewer copies"
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span
                  title="Copies"
                  className="w-8 text-center text-sm tabular-nums"
                >
                  ×{logo.count}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    patchLogo(logo.id, { count: Math.min(20, logo.count + 1) })
                  }
                  title="More copies"
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Shape */}
              <div className="flex shrink-0 items-center gap-1 rounded-full border border-border p-0.5">
                {SHAPES.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => patchLogo(logo.id, { shape: value })}
                    title={label}
                    aria-pressed={logo.shape === value}
                    className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${
                      logo.shape === value
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-foreground/5"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => remove(logo.id)}
                title="Remove logo"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
