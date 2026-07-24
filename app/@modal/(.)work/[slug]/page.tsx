import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ProjectHero } from "@/components/project/ProjectHero";
import { ContentBlocks } from "@/components/project/ContentBlocks";
import { ProjectSheet } from "@/components/project/ProjectSheet";
import { ProjectSheetSkeleton } from "@/components/project/ProjectSheetSkeleton";
import { SheetContentReady } from "@/components/project/SheetContentReady";
import { getProjectBySlug } from "@/lib/data";

export const revalidate = 0;

/**
 * Intercepted `/work/[slug]` — when navigated to from within the app (e.g. a
 * project card on the homepage) it renders as a bottom sheet over the current
 * page. A hard load / refresh falls through to the full page at
 * `app/work/[slug]/page.tsx`.
 *
 * The sheet shell renders immediately so it opens without waiting on data; the
 * project fetch is streamed inside a Suspense boundary behind a skeleton.
 */
export default async function ProjectModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <ProjectSheet>
      <Suspense fallback={<ProjectSheetSkeleton />}>
        <ProjectSheetContent slug={slug} />
      </Suspense>
    </ProjectSheet>
  );
}

async function ProjectSheetContent({ slug }: { slug: string }) {
  const project = await getProjectBySlug(slug);

  if (!project) notFound();

  return (
    <>
      <ProjectHero project={project} variant="sheet" />
      <ContentBlocks blocks={project.content ?? []} reveal={false} padded={false} />
      <SheetContentReady />
    </>
  );
}
