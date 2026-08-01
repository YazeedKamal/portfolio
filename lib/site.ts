import { LINKEDIN_URL } from "@/lib/contact";

/**
 * Single source of truth for the site's public URL and author identity — reused
 * by metadata (`app/layout.tsx`), the sitemap/robots/manifest, JSON-LD, the
 * generated OG images and the AI-agent markdown surface (`llms.txt` + `.md`).
 */

// Production origin. On Vercel this resolves automatically from the platform
// env; set NEXT_PUBLIC_SITE_URL once a custom domain is added to override it.
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

export const SITE = {
  name: "Yazeed Kamal",
  shortName: "Yazeed",
  role: "Senior Product Designer",
  /** Fallback tagline used when live site settings have no hero/about copy. */
  tagline:
    "Product designer crafting calm, considered digital products — selected work and case studies.",
  linkedin: LINKEDIN_URL,
} as const;

/** Absolute URL for a site-relative path (e.g. "/work/foo" → "https://…/work/foo"). */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
