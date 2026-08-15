import { NextResponse } from "next/server";
import sharp from "sharp";
import { getProjectBySlug } from "@/lib/data";
import { isVideoUrl } from "@/lib/media";
import { SITE, SITE_URL } from "@/lib/site";

// Social-preview thumbnail for a project. It re-encodes the SAME image shown on
// the homepage card (`card_url`, falling back to `cover_url`) into a 1200×630
// JPEG. Those images are stored as WebP, which most link-preview crawlers
// (WhatsApp, LinkedIn, X, iMessage) do NOT render — so shared links showed a
// blank thumbnail. JPEG at 1200×630 is the size + format every platform supports.
//
// It only ever fetches images we stored ourselves (resolved by slug from the
// database), never a caller-supplied URL, so it can't be abused as an open image
// proxy. Falls back to the branded PNG card when a project has no usable image.

export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

/** Branded fallback card (PNG, universally supported) with the project title. */
function brandedCard(title?: string | null, subtitle?: string | null): NextResponse {
  const url = new URL("/api/og", SITE_URL);
  if (title) url.searchParams.set("title", title);
  if (subtitle) url.searchParams.set("subtitle", subtitle);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) return brandedCard(SITE.name, SITE.role);

  const project = await getProjectBySlug(slug);
  // Match the homepage card: prefer the uploaded card thumbnail, fall back to
  // the cover. Skip videos — sharp can't rasterise them.
  const source = [project?.card_url, project?.cover_url].find(
    (url): url is string => !!url && !isVideoUrl(url),
  );
  if (!source) return brandedCard(project?.title, project?.subtitle);

  try {
    const res = await fetch(source, { cache: "no-store" });
    if (!res.ok) return brandedCard(project?.title, project?.subtitle);

    const input = Buffer.from(await res.arrayBuffer());
    const jpeg = await sharp(input)
      .resize(WIDTH, HEIGHT, { fit: "cover" })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();

    return new NextResponse(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control":
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return brandedCard(project?.title, project?.subtitle);
  }
}
