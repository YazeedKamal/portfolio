"use client";

import Link from "next/link";
import { motion, type MotionValue } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/types";

/** Deterministic per-index hover tilt — feels random, stays stable. */
const HOVER_TILTS = [-2.5, 3, -3.5, 2, 4, -2.5, 3.5, -2];

export function ProjectCard({
  project,
  index,
  noEntrance = false,
  metaOpacity,
  hoverTilt = false,
}: {
  project: Project;
  index: number;
  /** Skip the whileInView entrance (used when scroll-scatter drives the motion). */
  noEntrance?: boolean;
  /** Scroll-linked opacity for the title/subtitle row (hidden while scattered). */
  metaOpacity?: MotionValue<number>;
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

          <div className="absolute right-4 top-4 grid h-10 w-10 translate-y-2 place-items-center rounded-full bg-background/80 opacity-0 backdrop-blur transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>
      </div>

      <motion.div
        style={metaOpacity ? { opacity: metaOpacity } : undefined}
        className="mt-4 flex items-baseline justify-between gap-4 px-1"
      >
        <h3 className="text-lg font-medium tracking-tight">{project.title}</h3>
        {project.subtitle && (
          <p className="hidden shrink-0 text-sm text-muted-foreground sm:block">
            {project.subtitle.split(".")[0]}
          </p>
        )}
      </motion.div>
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
