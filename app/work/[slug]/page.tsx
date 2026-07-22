import { notFound } from "next/navigation";
import Link from "next/link";
import { ProjectHero } from "@/components/project/ProjectHero";
import { ContentBlocks } from "@/components/project/ContentBlocks";
import { getProjectBySlug } from "@/lib/data";

export const revalidate = 0;

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) notFound();

  return (
    <main className="flex-1 pb-32">
      <ProjectHero project={project} />
      <ContentBlocks blocks={project.content ?? []} />

      <div className="mx-auto w-full max-w-3xl px-6">
        <div className="border-t border-border pt-10 text-center">
          <Link
            href="/#work"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-foreground/5"
          >
            See more work
          </Link>
        </div>
      </div>
    </main>
  );
}
