import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectHero } from "@/components/project/ProjectHero";
import { ContentBlocks } from "@/components/project/ContentBlocks";
import { ProjectSheet } from "@/components/project/ProjectSheet";
import { SheetOutro } from "@/components/project/SheetOutro";
import { SheetContentReady } from "@/components/project/SheetContentReady";
import { JsonLd } from "@/components/seo/JsonLd";
import { getOtherProjects, getProjectBySlug } from "@/lib/data";
import { projectSummary } from "@/lib/content-to-markdown";
import { SITE, SITE_URL, absoluteUrl } from "@/lib/site";

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };

  const description = projectSummary(project);
  const path = `/work/${project.slug}`;
  // Route the cover through /api/og/cover, which re-encodes it to a 1200×630
  // JPEG — the stored covers are WebP, and WhatsApp/LinkedIn/X/iMessage don't
  // render WebP link previews. Projects without a cover fall back to the
  // branded PNG card.
  const ogImage = project.cover_url
    ? `/api/og/cover?slug=${encodeURIComponent(project.slug)}`
    : `/api/og?title=${encodeURIComponent(project.title)}&subtitle=${encodeURIComponent(
        project.subtitle ?? "",
      )}`;
  const ogImageType = project.cover_url ? "image/jpeg" : "image/png";

  return {
    title: project.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: project.title,
      description,
      url: path,
      images: [{ url: ogImage, width: 1200, height: 630, type: ogImageType }],
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description,
      images: [ogImage],
    },
  };
}

/**
 * Direct load / refresh of `/work/[slug]` — renders the SAME bottom sheet as the
 * intercepted route (opened from a project card). Closing dismisses to the
 * homepage. This keeps the experience consistent instead of falling back to a
 * separate full-page layout.
 */
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [project, others] = await Promise.all([
    getProjectBySlug(slug),
    getOtherProjects(slug),
  ]);

  if (!project) notFound();

  const url = absoluteUrl(`/work/${project.slug}`);
  const description = projectSummary(project);
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: project.title,
      description,
      url,
      ...(project.cover_url ? { image: project.cover_url } : {}),
      dateCreated: project.created_at,
      author: { "@type": "Person", name: SITE.name, url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: project.title, item: url },
      ],
    },
  ];

  return (
    <ProjectSheet>
      <JsonLd data={structuredData} />
      <ProjectHero project={project} variant="sheet" />
      <ContentBlocks blocks={project.content ?? []} reveal={false} padded={false} />
      <SheetOutro projects={others} />
      <SheetContentReady />
    </ProjectSheet>
  );
}
