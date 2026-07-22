"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { Hero } from "@/components/home/Hero";
import { ProjectCard } from "@/components/home/ProjectCard";
import { Reveal } from "@/components/ui/Reveal";
import type { Project } from "@/lib/types";

// Every project card floats in the hero: at most 4 on the sides, ALL the
// rest in the centered bottom row (spacing adapts to the count).

/**
 * Deterministic per-index scatter recipes (no Math.random — stable across
 * renders). "Organized random": gentle alternating tilts and near-uniform
 * sizes — organic but deliberate.
 *
 * Desktop sides hold AT MOST four cards (two per side); everything beyond
 * that flows into a small centered row at the bottom of the hero.
 */
const DESKTOP_SIDE_SEEDS = [
  // Clustered low, around the hero CTA button — tight vertical spread,
  // pulled well inward from the screen edges.
  { side: "left" as const, yFrac: 0.56, xOff: 0.08, rot: -5, scale: 0.36 },
  { side: "right" as const, yFrac: 0.58, xOff: 0.08, rot: 5, scale: 0.38 },
  // Lower pair leans further inward, toward the CTA button.
  { side: "left" as const, yFrac: 0.78, xOff: 0.14, rot: 4, scale: 0.38 },
  { side: "right" as const, yFrac: 0.8, xOff: 0.14, rot: -4, scale: 0.36 },
];

/** Bottom overflow row: spacing around center, soft stagger + tilt.
 *  yFrac keeps the mini cards fully visible above the fold; xStep keeps the
 *  row huddled tightly together around the center. */
const BOTTOM_ROW = { yFrac: 0.9, xStep: 0.13, rots: [2, -3], scale: 0.34 };

/**
 * Mobile: up to 4 STATIC cover cards hugging the screen edges (2 left,
 * 2 right) in an organized-random layout — no scroll binding, so touch
 * scrolling stays native-smooth. The grid below reveals normally.
 * top = % of hero height; negative x bleeds slightly off-screen.
 */
const MOBILE_SIDE_SEEDS = [
  { side: "left" as const, top: 60, x: "-9vw", rot: -8, w: "31vw" },
  { side: "right" as const, top: 66, x: "-10vw", rot: 9, w: "33vw" },
  { side: "left" as const, top: 81, x: "-7vw", rot: 6, w: "33vw" },
  { side: "right" as const, top: 87, x: "-8vw", rot: -5, w: "31vw" },
];

const ease = [0.16, 1, 0.3, 1] as const;

type Scatter = { dx: number; dy: number; rot: number; scale: number };

export function HomeShowcase({
  projects,
  showAvailable,
  heroTitle,
  heroSubtitle,
  heroHighlight,
}: {
  projects: Project[];
  showAvailable: boolean;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroHighlight: string | null;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [scatters, setScatters] = useState<(Scatter | null)[]>([]);
  const rangeRef = useRef(1);
  const reduced = useReducedMotion();

  // 0 = scattered in the hero, 1 = settled in grid (desktop only —
  // mobile shows the static side cards instead).
  const raw = useMotionValue(0);
  const settle = useSpring(raw, { stiffness: 110, damping: 26, mass: 0.6 });

  // Drive progress from window scroll (stable listener, range via ref).
  useEffect(() => {
    const onScroll = () => {
      raw.set(Math.min(1, Math.max(0, window.scrollY / rangeRef.current)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [raw]);

  // Measure grid slots + viewport → compute each card's scatter delta.
  useEffect(() => {
    function measure() {
      if (!gridRef.current) return;
      // Mobile: static side cards in the hero, plain grid — no scroll binding.
      if (reduced || window.innerWidth < 768) {
        setScatters([]);
        return;
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const gridTop = gridRef.current.getBoundingClientRect().top + window.scrollY;
      // Fully settled a bit before the grid reaches mid-viewport.
      rangeRef.current = Math.max(1, gridTop - vh * 0.45);
      // Sync progress to the current position without animating.
      raw.jump(Math.min(1, Math.max(0, window.scrollY / rangeRef.current)));
      settle.jump(raw.get());

      const margin = vw * 0.03;
      // Every card scatters.
      const n = cardRefs.current.filter(Boolean).length;
      // Sides hold at most 4 cards, and always in pairs; ALL the rest go to
      // a centered bottom row.
      const sideCount = n >= 4 ? 4 : n - (n % 2);
      const bottomCount = n - sideCount;
      // Bottom-row spacing shrinks as the count grows so every card stays
      // on-screen (they overlap like a hand of cards when crowded).
      const bottomStep =
        bottomCount > 1
          ? Math.min(BOTTOM_ROW.xStep, 0.6 / (bottomCount - 1))
          : 0;

      const compute = (i: number): Scatter | null => {
        const el = cardRefs.current[i];
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        // Card center: x in viewport coords (no horizontal scroll),
        // y in document coords.
        const cardCX = rect.left + rect.width / 2;
        const cardCY = rect.top + rect.height / 2 + window.scrollY;

        let targetCX: number;
        let targetCY: number;
        let rot: number;
        let scale: number;

        if (i >= sideCount) {
          // Overflow row at the bottom, spread evenly around center.
          const j = i - sideCount;
          targetCX = vw * (0.5 + (j - (bottomCount - 1) / 2) * bottomStep);
          targetCY = vh * (BOTTOM_ROW.yFrac + (j % 2) * 0.015);
          rot = BOTTOM_ROW.rots[j % BOTTOM_ROW.rots.length];
          scale = BOTTOM_ROW.scale;
        } else {
          // Edge-hugging cards, balanced left/right pairs (max 2 per side).
          const seed = DESKTOP_SIDE_SEEDS[i];
          const miniW = rect.width * seed.scale;
          targetCX =
            seed.side === "left"
              ? margin + miniW / 2 + vw * seed.xOff
              : vw - margin - miniW / 2 - vw * seed.xOff;
          // At scroll 0 the hero viewport == document coords.
          targetCY = vh * seed.yFrac;
          rot = seed.rot;
          scale = seed.scale;
        }

        return {
          dx: targetCX - cardCX,
          dy: targetCY - cardCY,
          rot,
          scale,
        };
      };

      setScatters(Array.from({ length: n }, (_, i) => compute(i)));
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [reduced, projects.length, raw, settle]);

  return (
    <>
      <div className="relative">
        <Hero
          showAvailable={showAvailable}
          title={heroTitle}
          subtitle={heroSubtitle}
          highlight={heroHighlight}
        />
        <MobileSideCards projects={projects} />
      </div>

      <section id="work" className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-24">
        <Reveal>
          <div className="mb-12 flex items-end justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                Selected work
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Projects
              </h2>
            </div>
            <p className="hidden max-w-xs text-right text-sm text-muted-foreground sm:block">
              A handful of things I&apos;m proud of. Tap any to read the story.
            </p>
          </div>
        </Reveal>

        {projects.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border py-24 text-center text-muted-foreground">
            No projects yet — add your first from the admin dashboard.
          </div>
        ) : (
          <div ref={gridRef} className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {projects.map((project, i) => (
              <div
                key={project.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
              >
                <ScatterCard
                  // Remount when the measured delta changes so the motion
                  // transforms are created with fresh values (no stale
                  // closures — resize/measure is rare, remount is cheap).
                  key={
                    scatters[i]
                      ? `s:${Math.round(scatters[i]!.dx)},${Math.round(scatters[i]!.dy)}`
                      : "plain"
                  }
                  project={project}
                  index={i}
                  scatter={scatters[i] ?? null}
                  settle={settle}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function ScatterCard({
  project,
  index,
  scatter,
  settle,
}: {
  project: Project;
  index: number;
  scatter: Scatter | null;
  settle: MotionValue<number>;
}) {
  const x = useTransform(settle, (p) => (scatter ? scatter.dx * (1 - p) : 0));
  const y = useTransform(settle, (p) => (scatter ? scatter.dy * (1 - p) : 0));
  const rotate = useTransform(settle, (p) => (scatter ? scatter.rot * (1 - p) : 0));
  const scale = useTransform(settle, (p) =>
    scatter ? scatter.scale + (1 - scatter.scale) * p : 1,
  );
  // Title/subtitle stay hidden while the card floats; fade in as it lands.
  const metaOpacity = useTransform(settle, [0.85, 1], [0, 1]);

  // Playful hover tilt only while floating — once settled in the grid,
  // hover falls back to the plain zoom.
  const [floating, setFloating] = useState(() => !!scatter && settle.get() < 0.9);
  useMotionValueEvent(settle, "change", (p) => {
    setFloating(!!scatter && p < 0.9);
  });

  // No scatter (mobile / reduced motion / pre-measure): plain card with its
  // regular whileInView entrance.
  if (!scatter) return <ProjectCard project={project} index={index} />;

  return (
    <motion.div style={{ x, y, rotate, scale }}>
      <ProjectCard
        project={project}
        index={index}
        noEntrance
        metaOpacity={metaOpacity}
        hoverTilt={floating}
      />
    </motion.div>
  );
}

/**
 * Mobile-only: up to 4 static cover cards on the screen edges (2 left,
 * 2 right), organized-random tilts, slightly bleeding off-screen. They
 * never move with scroll — native-smooth touch scrolling — and each one
 * links to its project.
 */
function MobileSideCards({ projects }: { projects: Project[] }) {
  const cards = projects.slice(0, MOBILE_SIDE_SEEDS.length);
  if (cards.length === 0) return null;

  return (
    <div className="md:hidden">
      {cards.map((p, i) => {
        const seed = MOBILE_SIDE_SEEDS[i];
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 + i * 0.08, ease }}
            className="absolute"
            style={{
              top: `${seed.top}%`,
              width: seed.w,
              ...(seed.side === "left" ? { left: seed.x } : { right: seed.x }),
            }}
          >
            <Link
              href={`/work/${p.slug}`}
              className="block"
              style={{ transform: `rotate(${seed.rot}deg)` }}
            >
              <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
                {p.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.cover_url}
                    alt={p.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-foreground/5" />
                )}
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

