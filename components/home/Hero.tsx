"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const DEFAULT_TITLE = "Product designer crafting calm, human interfaces.";
const DEFAULT_SUBTITLE =
  "I design end-to-end products — from first sketch to shipped pixels — with an obsession for clarity, craft, and the details you feel but never notice.";

/**
 * Figma-style selection frame: blue border + corner handles.
 * Playful: grab the word and drag it anywhere, or resize it from a corner —
 * on release it springs back to its natural spot.
 */
function FigmaSelection({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [t, setT] = useState({ x: 0, y: 0, s: 1, r: 0 });
  const [springing, setSpringing] = useState(false);
  const gesture = useRef<{
    mode: "move" | "transform";
    startX: number;
    startY: number;
    cx: number;
    cy: number;
    startDist: number;
    startAngle: number;
  } | null>(null);

  const onMove = useCallback((e: PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    if (g.mode === "move") {
      setT((prev) => ({
        ...prev,
        x: e.clientX - g.startX,
        y: e.clientY - g.startY,
      }));
    } else {
      // Corner drag = free transform: distance scales, angle rotates.
      const dist = Math.hypot(e.clientX - g.cx, e.clientY - g.cy);
      const s = Math.min(2.5, Math.max(0.4, dist / g.startDist));
      const angle =
        (Math.atan2(e.clientY - g.cy, e.clientX - g.cx) * 180) / Math.PI;
      const r = angle - g.startAngle;
      setT((prev) => ({ ...prev, s, r }));
    }
  }, []);

  const release = useCallback(() => {
    gesture.current = null;
    window.removeEventListener("pointermove", onMove);
    // Spring back home — smooth overshoot, never a sudden jump.
    setSpringing(true);
    setT({ x: 0, y: 0, s: 1, r: 0 });
  }, [onMove]);

  function grab(e: React.PointerEvent, mode: "move" | "transform") {
    e.preventDefault();
    e.stopPropagation();
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    gesture.current = {
      mode,
      startX: e.clientX - t.x,
      startY: e.clientY - t.y,
      cx,
      cy,
      startDist: Math.max(8, Math.hypot(e.clientX - cx, e.clientY - cy)),
      startAngle:
        (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI,
    };
    setSpringing(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", release, { once: true });
  }

  useEffect(
    () => () => window.removeEventListener("pointermove", onMove),
    [onMove],
  );

  const handle =
    "absolute z-10 h-2 w-2 border border-[#0D99FF] bg-white sm:h-2.5 sm:w-2.5";

  return (
    <span
      ref={ref}
      onPointerDown={(e) => grab(e, "move")}
      style={{
        transform: `translate(${t.x}px, ${t.y}px) rotate(${t.r}deg) scale(${t.s})`,
        transition: springing
          ? "transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)"
          : "none",
        touchAction: "none",
      }}
      className="relative z-20 inline-block cursor-grab select-none whitespace-nowrap px-1 active:cursor-grabbing sm:px-1.5"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 border-2 border-[#0D99FF]"
      />
      <span
        aria-hidden
        onPointerDown={(e) => grab(e, "transform")}
        className={`${handle} -left-1 -top-1 cursor-nwse-resize`}
      />
      <span
        aria-hidden
        onPointerDown={(e) => grab(e, "transform")}
        className={`${handle} -right-1 -top-1 cursor-nesw-resize`}
      />
      <span
        aria-hidden
        onPointerDown={(e) => grab(e, "transform")}
        className={`${handle} -bottom-1 -left-1 cursor-nesw-resize`}
      />
      <span
        aria-hidden
        onPointerDown={(e) => grab(e, "transform")}
        className={`${handle} -bottom-1 -right-1 cursor-nwse-resize`}
      />
      {children}
    </span>
  );
}

/** Wraps the highlight word/phrase (first match, case-insensitive). */
function renderTitle(text: string, highlight?: string | null) {
  const needle = highlight?.trim();
  if (!needle) return text;
  const idx = text.toLowerCase().indexOf(needle.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <FigmaSelection>{text.slice(idx, idx + needle.length)}</FigmaSelection>
      {text.slice(idx + needle.length)}
    </>
  );
}

export function Hero({
  showAvailable = true,
  title,
  subtitle,
  highlight,
}: {
  showAvailable?: boolean;
  title?: string | null;
  subtitle?: string | null;
  highlight?: string | null;
}) {
  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 pb-28 text-center md:min-h-[92vh] md:pb-0">
      {/* soft radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background:radial-gradient(60%_50%_at_50%_20%,var(--card),transparent_70%)]"
      />

      {showAvailable && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Available for new work
        </motion.p>
      )}

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.05, ease }}
        className="max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
      >
        {renderTitle(title || DEFAULT_TITLE, highlight)}
      </motion.h1>

      {/* `null`/undefined = never configured → default copy; an explicit
          empty string (admin cleared it) hides the description entirely. */}
      {(subtitle ?? DEFAULT_SUBTITLE) && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease }}
          className="mt-6 max-w-xl text-balance text-lg text-muted-foreground"
        >
          {subtitle ?? DEFAULT_SUBTITLE}
        </motion.p>
      )}

      <motion.a
        href="#work"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease }}
        className="mt-10 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-transform hover:scale-[1.03] active:scale-95"
      >
        View selected work
        <ArrowDown className="h-4 w-4" />
      </motion.a>
    </section>
  );
}
