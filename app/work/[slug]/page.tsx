import { notFound } from "next/navigation";
import { ProjectHero } from "@/components/project/ProjectHero";
import { ContentBlocks } from "@/components/project/ContentBlocks";
import { ProjectSheet } from "@/components/project/ProjectSheet";
import { SheetOutro } from "@/components/project/SheetOutro";
import { SheetContentReady } from "@/components/project/SheetContentReady";
import { getOtherProjects, getProjectBySlug } from "@/lib/data";

export const revalidate = 0;

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

  return (
    <ProjectSheet>
      <ProjectHero project={project} variant="sheet" />
      <ContentBlocks blocks={project.content ?? []} reveal={false} padded={false} />
      <SheetOutro projects={others} />
      <SheetContentReady />
    </ProjectSheet>
  );
}
