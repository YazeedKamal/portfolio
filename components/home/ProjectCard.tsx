"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/types";

/** Deterministic per-index hover tilt — feels random, stays stable. */
const HOVER_TILTS = [-2.5, 3, -3.5, 2, 4, -2.5, 3.5, -2];

export function ProjectCard({
  project,
  index,
  noEntrance = false,
  settled = true,
  hoverTilt = false,
}: {
  project: Project;
  index: number;
  /** Skip the whileInView entrance (used when scroll-scatter drives the motion). */
  noEntrance?: boolean;
  /** True once the card has landed in the grid — enables the meta overlay
   *  (visible on hover on desktop, always visible on mobile). While the card
   *  is still floating in the hero the overlay stays hidden. */
  settled?: boolean;
  /** Add the playful random tilt on hover (only while floating in the hero). */
  hoverTilt?: boolean;
}) {
  const tilt = HOVER_TILTS[index % HOVER_TILTS.length];

  const card = (
    <Link href={`/work/${project.slug}`} className="group block">
      <div
        // Playful tilt + zoom only while floating in the hero — pure CSS so
        // it can't fight the scroll-driven framer transforms. Settled grid
        // cards keep a plain hover (arrow chip only).
        style={{ ["--tilt" as string]: `${tilt}deg` }}
        className={`transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          hoverTilt
            ? "group-hover:[transform:rotate(var(--tilt))_scale(1.03)]"
            : ""
        }`}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-card">
          {project.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.cover_url}
              alt={project.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground">
              No cover
            </div>
          )}

          <div
            className={`absolute right-4 top-4 z-20 items-center gap-1.5 rounded-full bg-background/80 px-3.5 py-2 text-sm font-medium backdrop-blur transition-all duration-500 ${
              settled
                ? "inline-flex translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                : "hidden"
            }`}
          >
            Show details
            <ArrowUpRight className="h-4 w-4" />
          </div>

          {/* Meta overlay — sits over the cover with a soft dark gradient.
              Hidden until the card lands; on desktop it reveals on hover,
              on mobile it stays visible once the cards settle into the grid. */}
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-5 pb-5 pt-16 transition-opacity duration-300 ${
              settled
                ? "opacity-100 md:opacity-0 md:group-hover:opacity-100"
                : "opacity-0"
            }`}
          >
            <h3 className="line-clamp-2 text-lg font-semibold tracking-tight text-white">
              {project.title}
            </h3>
            {project.subtitle && (
              <p className="line-clamp-1 text-sm text-white/80">
                {project.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );

  if (noEntrance) return card;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: (index % 2) * 0.08, ease: [0.16, 1, 0.3, 1] }}
    >
      {card}
    </motion.div>
  );
}
