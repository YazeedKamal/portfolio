import { getProjectBySlug } from "@/lib/data";
import { projectToMarkdown } from "@/lib/content-to-markdown";

// Clean markdown version of a case study for AI agents/crawlers. Reached at the
// public URL `/work/<slug>.md`, which `proxy.ts` rewrites here.

export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(projectToMarkdown(project), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
