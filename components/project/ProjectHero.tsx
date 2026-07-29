import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Project } from "@/lib/types";
import { isVideoUrl } from "@/lib/media";

export function ProjectHero({
  project,
  variant = "page",
}: {
  project: Project;
  /** "page" = standalone route (fixed back button + navbar clearance);
   *  "sheet" = rendered inside the bottom sheet (no back button, tight top). */
  variant?: "page" | "sheet";
}) {
  const inSheet = variant === "sheet";

  return (
    <>
      {/* Solid pill button, pinned top-left at the navbar's height and kept
          fixed while scrolling. Uses `bg-foreground` so it's black in light
          mode and stays visible (inverted) in true-black dark mode. Only the
          standalone page shows it — the sheet has its own close controls. */}
      {!inSheet && (
        <Link
          href="/#work"
          className="fixed left-4 top-4 z-50 inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-[transform,opacity] hover:opacity-90 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to work</span>
        </Link>
      )}

      <header
        className={
          inSheet
            ? "w-full" // full-bleed within the sheet's own 24px padding
            : "mx-auto w-full max-w-5xl px-6 pt-32"
        }
      >
        <h1
          className={`max-w-3xl text-balance text-[22px] font-semibold leading-tight tracking-tight sm:text-2xl ${
            inSheet ? "" : "mt-8"
          }`}
        >
          {project.title}
        </h1>

        {project.cover_url && (
          <div className="mt-8 overflow-hidden rounded-[2rem] border border-border bg-card">
            {isVideoUrl(project.cover_url) ? (
              <video
                src={project.cover_url}
                muted
                loop
                autoPlay
                playsInline
                className="aspect-[16/9] w-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.cover_url}
                alt={project.title}
                fetchPriority="high"
                decoding="async"
                className="aspect-[16/9] w-full object-cover"
              />
            )}
          </div>
        )}
      </header>
    </>
  );
}
