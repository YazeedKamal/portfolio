"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Camera, Check, Loader2, Trash2, X, ZoomIn, ZoomOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { setAvatar } from "@/app/admin/actions";

/** Crops the selected area of an image to a 512x512 square blob. */
async function cropToBlob(imageSrc: string, area: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const SIZE = 512;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    area.x, area.y, area.width, area.height,
    0, 0, SIZE, SIZE,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Crop failed"))),
      "image/jpeg",
      0.92,
    );
  });
}

export function AvatarUploader({ initialUrl }: { initialUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialUrl);

  // Crop modal state
  const [source, setSource] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  function pickFile(file: File) {
    setError(null);
    const url = URL.createObjectURL(file);
    setSource(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }

  function closeModal() {
    if (source) URL.revokeObjectURL(source);
    setSource(null);
  }

  async function saveCrop() {
    if (!source || !croppedArea) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await cropToBlob(source, croppedArea);
      const supabase = createClient();
      const path = `avatar-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { cacheControl: "3600", contentType: "image/jpeg" });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const res = await setAvatar(data.publicUrl);
      if (res?.error) throw new Error(res.error);

      setAvatarUrl(data.publicUrl);
      closeModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  function removeAvatar() {
    start(async () => {
      const res = await setAvatar(null);
      if (!res?.error) setAvatarUrl(null);
    });
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4">
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-foreground text-sm font-bold text-background">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            "Y"
          )}
        </span>
        <div>
          <p className="text-sm font-medium">Profile photo</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Shown in the navbar. Crop it before saving.
          </p>
          {error && !source && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {avatarUrl && (
          <button
            type="button"
            onClick={removeAvatar}
            disabled={pending}
            title="Remove photo"
            className="rounded-full border border-border p-2.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-foreground/5"
        >
          <Camera className="h-4 w-4" />
          {avatarUrl ? "Change" : "Upload"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) pickFile(file);
          e.target.value = "";
        }}
      />

      {/* Crop modal */}
      {source && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-surface-elevated shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h3 className="text-sm font-semibold">Crop your photo</h3>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Cancel"
                className="rounded-full p-1.5 text-muted-foreground hover:bg-foreground/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative h-72 w-full bg-black/90">
              <Cropper
                image={source}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="flex items-center gap-3">
                <ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  aria-label="Zoom"
                  className="w-full accent-[var(--foreground)]"
                />
                <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-foreground/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveCrop}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {busy ? "Saving…" : "Save photo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
