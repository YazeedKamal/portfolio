import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Project } from "@/lib/types";

export function ProjectHero({ project }: { project: Project }) {
  return (
    <header className="mx-auto w-full max-w-5xl px-6 pt-32">
      <Link
        href="/#work"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to work
      </Link>

      <h1 className="mt-8 max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
        {project.title}
      </h1>
      {project.subtitle && (
        <p className="mt-5 max-w-2xl text-balance text-xl text-muted-foreground">
          {project.subtitle}
        </p>
      )}

      {project.cover_url && (
        <div className="mt-12 overflow-hidden rounded-[2rem] border border-border bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.cover_url}
            alt={project.title}
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      )}
    </header>
  );
}
