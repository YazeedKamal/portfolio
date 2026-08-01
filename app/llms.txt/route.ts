import { getPublishedProjects, getSiteSettings } from "@/lib/data";
import { SITE, SITE_URL, absoluteUrl } from "@/lib/site";
import { htmlToPlainText, projectSummary } from "@/lib/content-to-markdown";

// The llms.txt convention: a single markdown file at /llms.txt giving AI agents
// a clean overview of the site plus links to per-page markdown. See
// https://llmstxt.org. Cross-referenced with the per-project `/work/<slug>.md`
// documents (served via `proxy.ts` → `app/raw/work/[slug]/route.ts`).

export const revalidate = 3600;

export async function GET() {
  const [projects, settings] = await Promise.all([
    getPublishedProjects(),
    getSiteSettings(),
  ]);

  const bio =
    htmlToPlainText(settings.about_body ?? "") ||
    settings.hero_subtitle?.trim() ||
    SITE.tagline;

  const lines: string[] = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.role}. ${bio}`,
    "",
    "## Projects",
    "",
  ];

  for (const p of projects) {
    const summary = projectSummary(p, 140);
    const link = absoluteUrl(`/work/${p.slug}.md`);
    lines.push(`- [${p.title}](${link})${summary ? ` — ${summary}` : ""}`);
  }

  lines.push(
    "",
    "## Links",
    "",
    `- [Portfolio home](${SITE_URL})`,
    `- [About](${absoluteUrl("/about")})`,
    `- [LinkedIn](${SITE.linkedin})`,
    "",
  );

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
