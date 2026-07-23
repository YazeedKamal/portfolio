"use client";

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
 * Mobile: an overlapping fan pinned to the bottom of the full-screen hero
 * (outer edges bleed off-screen) that scrubs into the grid with scroll.
 * No spring on mobile — transforms track the finger 1:1, which is what
 * makes touch scrolling feel smooth.
 *
 * Choreography: EVERY card starts moving from the very first scroll pixel
 * (no perceived lag), but at different speeds — outer (left/right) cards
 * travel fast and land first (symmetric pairs in perfect sync), center
 * cards travel slower and land last. The center fan slots belong to the
 * FIRST projects, so the last cards to land are the top of the grid.
 */
const MOBILE_FAN = {
  yFrac: 0.92,
  rotStep: 8,
  dipPx: 12,
  scale: 0.38,
  // Outer cards finish their travel at this fraction of the scroll range;
  // center cards stretch all the way to 1.
  fastDur: 0.55,
};

type Scatter = {
  dx: number;
  dy: number;
  rot: number;
  scale: number;
  /** Stagger window inside global progress: card animates over [start, start+dur]. */
  start?: number;
  dur?: number;
};

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
  const [isMobile, setIsMobile] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const rangeRef = useRef(1);
  const reduced = useReducedMotion();

  // 0 = scattered in the hero, 1 = settled in grid.
  // `raw` tracks scroll 1:1; the spring smooths it for desktop only —
  // on touch, direct 1:1 tracking is what feels smooth.
  const raw = useMotionValue(0);
  const sprung = useSpring(raw, { stiffness: 110, damping: 26, mass: 0.6 });
  const settle = isMobile ? raw : sprung;

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
      if (reduced) {
        setScatters([]);
        return;
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mobile = vw < 768;
      setIsMobile(mobile);
      const gridTop = gridRef.current.getBoundingClientRect().top + window.scrollY;
      // Fully settled a bit before the grid reaches mid-viewport.
      rangeRef.current = Math.max(1, gridTop - vh * 0.45);
      // Sync progress to the current position without animating.
      raw.jump(Math.min(1, Math.max(0, window.scrollY / rangeRef.current)));
      sprung.jump(raw.get());

      const margin = vw * 0.03;
      // Every card scatters.
      const n = cardRefs.current.filter(Boolean).length;
      // Desktop: sides hold at most 4 cards, always in pairs; the rest go
      // to a centered bottom row.
      const sideCount = n >= 4 ? 4 : n - (n % 2);
      const bottomCount = n - sideCount;
      // Bottom-row spacing shrinks as the count grows so every card stays
      // on-screen (they overlap like a hand of cards when crowded).
      const bottomStep =
        bottomCount > 1
          ? Math.min(BOTTOM_ROW.xStep, 0.6 / (bottomCount - 1))
          : 0;

      // Mobile fan: grid index 0 (top of grid) sits in the CENTER of the
      // fan; later cards alternate outward: 0, +1, −1, +2, −2, …
      const fanOff = (k: number) => {
        const step = Math.ceil(k / 2);
        return k % 2 === 1 ? step : -step;
      };
      const maxOff = Math.max(1, Math.abs(fanOff(n - 1)), Math.abs(fanOff(n - 2)));
      const fanStep = Math.min(0.21, 1.15 / Math.max(1, n - 1));

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
        let start = 0;
        let dur = 1;

        if (mobile) {
          // Overlapping fan at the bottom of the full-screen hero.
          const off = fanOff(i);
          targetCX = vw * (0.5 + off * fanStep);
          targetCY = vh * MOBILE_FAN.yFrac + Math.abs(off) * MOBILE_FAN.dipPx;
          rot = off * MOBILE_FAN.rotStep;
          scale = MOBILE_FAN.scale;
          // Everyone starts at 0 (no dead zone at the top of the scroll);
          // outer cards (d=1) travel fast and finish early, center cards
          // (d=0) travel slower and finish last.
          const d = Math.abs(off) / maxOff;
          start = 0;
          dur = MOBILE_FAN.fastDur + (1 - d) * (1 - MOBILE_FAN.fastDur);
        } else if (i >= sideCount) {
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
          start,
          dur,
        };
      };

      setScatters(Array.from({ length: n }, (_, i) => compute(i)));
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [reduced, projects.length, raw, sprung]);

  // The hero cards rise into place only on the first page reveal. Keeping
  // this gate outside ScatterCard prevents a resize/re-measure remount from
  // replaying the opening choreography.
  useEffect(() => {
    if (reduced || scatters.length === 0 || introComplete) return;
    const timer = window.setTimeout(() => setIntroComplete(true), 1800);
    return () => window.clearTimeout(timer);
  }, [introComplete, reduced, scatters.length]);

  return (
    <>
      <Hero
        showAvailable={showAvailable}
        title={heroTitle}
        subtitle={heroSubtitle}
        highlight={heroHighlight}
      />

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
                // While the cards overlap in the floating fan (mobile) / scatter,
                // earlier cards (top of the grid) sit at the CENTER and should
                // stack above the outer ones. Descending z-index by index does
                // that; it's harmless once they settle into the non-overlapping
                // grid. Grid items honor z-index without needing `position`.
                style={{ zIndex: projects.length - i }}
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
                  playEntrance={!introComplete && !reduced}
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
  playEntrance,
}: {
  project: Project;
  index: number;
  scatter: Scatter | null;
  settle: MotionValue<number>;
  playEntrance: boolean;
}) {
  // Local progress: this card animates over its own [start, start+dur]
  // window inside the global progress (stagger choreography).
  const start = scatter?.start ?? 0;
  const dur = scatter?.dur ?? 1;
  const local = (p: number) => Math.min(1, Math.max(0, (p - start) / dur));

  const x = useTransform(settle, (p) => (scatter ? scatter.dx * (1 - local(p)) : 0));
  const y = useTransform(settle, (p) => (scatter ? scatter.dy * (1 - local(p)) : 0));
  const rotate = useTransform(settle, (p) =>
    scatter ? scatter.rot * (1 - local(p)) : 0,
  );
  const scale = useTransform(settle, (p) =>
    scatter ? scatter.scale + (1 - scatter.scale) * local(p) : 1,
  );

  // Playful hover tilt only while floating — once settled in the grid,
  // hover falls back to the plain zoom.
  const [floating, setFloating] = useState(
    () => !!scatter && local(settle.get()) < 0.9,
  );
  useMotionValueEvent(settle, "change", (p) => {
    setFloating(!!scatter && local(p) < 0.9);
  });

  // No scatter (reduced motion / pre-measure): plain card with its regular
  // whileInView entrance.
  if (!scatter) return <ProjectCard project={project} index={index} />;

  return (
    <motion.div
      data-project-intro={project.id}
      initial={playEntrance ? { opacity: 0, y: "32vh", scale: 0.9 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.9,
        delay: 0.3 + Math.floor(index / 2) * 0.09,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="will-change-transform"
    >
      <motion.div style={{ x, y, rotate, scale }}>
        <ProjectCard
          project={project}
          index={index}
          noEntrance
          settled={!floating}
          hoverTilt={floating}
        />
      </motion.div>
    </motion.div>
  );
}
