import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 Proxy (formerly Middleware). Two concerns:
 *  1. `/work/<slug>.md` → rewritten to the raw markdown route handler
 *     (`app/raw/work/[slug]/route.ts`) so AI agents/crawlers can read a clean
 *     markdown version of each case study. A dynamic segment can't literally be
 *     named `[slug].md`, so the rewrite bridges the public `.md` URL. Normal
 *     `/work/<slug>` page loads pass straight through.
 *  2. `/admin/*` → Supabase session refresh + guard (existing behaviour).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/work/")) {
    if (pathname.endsWith(".md")) {
      const slug = pathname.slice("/work/".length, -".md".length);
      if (slug && !slug.includes("/")) {
        const url = request.nextUrl.clone();
        url.pathname = `/raw/work/${slug}`;
        return NextResponse.rewrite(url);
      }
    }
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    // Admin routes (session refresh + guard) and work routes (.md rewrite).
    "/admin/:path*",
    "/work/:path*",
  ],
};
