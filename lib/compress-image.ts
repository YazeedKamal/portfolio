/**
 * Client-side image compression run before every upload.
 *
 * Downscales oversized images and re-encodes them to WebP so uploads stay
 * high-quality but light on the page. Runs entirely in the browser (canvas),
 * mirroring the crop/encode pattern already used in `AvatarUploader`.
 *
 * Tune the two knobs below to trade quality vs. weight.
 */
const MAX_DIMENSION = 2000; // longest edge, in px
const WEBP_QUALITY = 0.85; // 0..1 — high quality, much smaller than the source

/**
 * Compresses an image `File` to a lighter WebP `File`. Non-images, animated
 * GIFs and SVGs are returned untouched (to preserve animation / vector data).
 * If compression doesn't actually shrink the file, the original is returned.
 */
export async function compressImage(file: File): Promise<File> {
  // Only touch bitmap images. GIFs may be animated (canvas would flatten them
  // to a single frame) and SVGs are vector — leave both as-is.
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/gif" ||
    file.type === "image/svg+xml"
  ) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Decoding failed (unsupported/corrupt) — upload the original untouched.
    return file;
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
  );

  // Fall back to the original if encoding failed, or if it wasn't already
  // resized and the WebP came out no smaller than the source.
  if (!blob || (scale === 1 && blob.size >= file.size)) {
    return file;
  }

  const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([blob], name, { type: "image/webp" });
}
