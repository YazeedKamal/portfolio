"use client";

import { useContext } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/types";
import { LINKEDIN_URL } from "@/lib/contact";
import { SheetCloseContext } from "./sheet-close-context";

/** LinkedIn brand glyph — inline so it doesn't depend on Lucide's
 *  (deprecated) brand icons. Inherits color via `currentColor`. */
function LinkedInLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0z" />
    </svg>
  );
}

/**
 * The tail of every project case study inside the bottom sheet: a curated
 * "More projects" grid followed by a contact footer. Presentational and
 * client-safe so it works in the routed sheet AND the admin preview.
 *
 * `interactive` is false in the admin preview, where project cards must not
 * navigate away from the builder.
 */
export function SheetOutro({
  projects,
  interactive = true,
}: {
  projects: Project[];
  interactive?: boolean;
}) {
  // Show at most 3 in the "More projects" grid.
  const shown = projects.slice(0, 3);
  return (
    <section className="@container mt-20">
      {/* Divider splitting the case study from the outro. Full-bleed to the
          whole sheet width (not just the centered content column): `w-screen`
          + the left-1/2 / -translate-x-1/2 trick breaks out of the max-w-4xl
          column. The scroll container clips the horizontal overflow so this
          never adds a horizontal scrollbar. */}
      <div className="relative left-1/2 w-screen -translate-x-1/2 border-t border-border" />

      <div className="pt-20">
      {shown.length > 0 && (
        <div className="mb-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                More usecases
              </h2>
            </div>
            {interactive && <ViewAllLink />}
          </div>

          <div className="grid grid-cols-2 gap-3 @md:grid-cols-3 @md:gap-4">
            {shown.map((project) => (
              <OutroCard key={project.id} project={project} interactive={interactive} />
            ))}
          </div>
        </div>
      )}

      {/* Contact footer */}
      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 text-center sm:p-12">
        {/* Soft radial glow so the footer reads as a distinct, finished end. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 w-[80%] rounded-full bg-foreground/[0.06] blur-3xl"
        />
        <div className="relative">
          <h2 className="mx-auto max-w-xl text-balance text-2xl font-semibold tracking-tight sm:text-4xl">
            I&apos;d love to hear what you&apos;re working on.
          </h2>

          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noreferrer"
            className="mx-auto mt-8 inline-flex items-center gap-2.5 rounded-full bg-[#0A66C2] px-6 py-3 text-sm font-medium text-white transition-transform hover:scale-[1.03] active:scale-95"
          >
            <LinkedInLogo className="h-5 w-5" />
            Connect on LinkedIn
          </a>
        </div>
      </div>
      </div>
    </section>
  );
}

/**
 * "View all" pill. Inside the routed bottom sheet it dismisses the sheet (with
 * its slide-down animation) and lands the homepage on the projects section.
 * When rendered outside the sheet (the full-page /work route, where no close
 * context exists) it falls back to a plain link to `/#work`.
 */
function ViewAllLink() {
  const closeTo = useContext(SheetCloseContext);
  const className =
    "hidden shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground sm:inline-flex";

  if (!closeTo) {
    return (
      <Link href="/#work" className={className}>
        View all
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => closeTo("work")} className={className}>
      View all
      <ArrowUpRight className="h-4 w-4" />
    </button>
  );
}

function OutroCard({
  project,
  interactive,
}: {
  project: Project;
  interactive: boolean;
}) {
  const inner = (
    <>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-card">
        {(project.card_url ?? project.cover_url) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.card_url ?? project.cover_url ?? ""}
            alt={project.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">
            No cover
          </div>
        )}

        <div className="absolute right-3 top-3 inline-flex translate-y-1 items-center gap-1 rounded-full bg-background/80 px-3 py-1.5 text-xs font-medium opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          View
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="mt-4 px-1">
        <h3 className="line-clamp-1 text-base font-semibold tracking-tight">
          {project.title}
        </h3>
        {project.subtitle && (
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
            {project.subtitle}
          </p>
        )}
      </div>
    </>
  );

  if (!interactive) return <div className="group block">{inner}</div>;

  // A normal push so browser Back steps to the previously viewed project. The
  // sheet's close button unwinds the whole chain in one jump (see ProjectSheet)
  // so it still dismisses straight to where the sheet was first opened.
  return (
    <Link href={`/work/${project.slug}`} className="group block">
      {inner}
    </Link>
  );
}
