"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { heroFontFamily } from "@/lib/hero-fonts";
import { heroImageStyle, isHeroImage, type HeroFont, type HeroRichTitle, type HeroSegment } from "@/lib/types";

const ease = [0.16, 1, 0.3, 1] as const;

const DEFAULT_TITLE = "Product designer crafting calm, human interfaces.";
const DEFAULT_SUBTITLE =
  "I design end-to-end products — from first sketch to shipped pixels — with an obsession for clarity, craft, and the details you feel but never notice.";

/**
 * Figma-style selection frame: blue border + corner handles.
 * Playful: grab the word and drag it anywhere, or resize it from a corner —
 * on release it springs back to its natural spot.
 */
function FigmaSelection({ children, image }: { children: React.ReactNode; image?: boolean }) {
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
      className={`relative z-20 cursor-grab select-none whitespace-nowrap active:cursor-grabbing ${
        image
          ? "inline-flex items-center align-middle p-1 sm:p-1.5"
          : "inline-block px-1 sm:px-1.5"
      }`}
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

/** Renders one word or inline SVG (no selection frame); `em` sizing keeps the
 *  responsive base intact. */
function SegInner({ seg, fonts }: { seg: HeroSegment; fonts: HeroFont[] }) {
  if (isHeroImage(seg)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={seg.url}
        alt={seg.alt ?? ""}
        className="inline-block align-middle"
        style={heroImageStyle(seg)}
      />
    );
  }
  return (
    <span
      style={{
        fontFamily: heroFontFamily(seg.font, fonts),
        // Words default to Regular (the h1 base is semibold).
        fontWeight: seg.weight ?? 400,
        fontStyle: seg.italic ? "italic" : undefined,
        fontSize: seg.size && seg.size !== 1 ? `${seg.size}em` : undefined,
        color: seg.color || undefined,
      }}
    >
      {seg.text}
    </span>
  );
}

/** Blue Figma-selection border + 4 corner handles. Pass `onCorner` to make the
 *  handles interactive (resize/rotate); omit it for the static floating copy. */
function SelectionChrome({ onCorner }: { onCorner?: (e: React.PointerEvent) => void }) {
  const handle =
    "absolute z-10 h-2 w-2 border border-[#0D99FF] bg-white sm:h-2.5 sm:w-2.5";
  const corners = [
    "-left-1 -top-1 cursor-nwse-resize",
    "-right-1 -top-1 cursor-nesw-resize",
    "-bottom-1 -left-1 cursor-nesw-resize",
    "-bottom-1 -right-1 cursor-nwse-resize",
  ];
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 border-2 border-[#0D99FF]"
      />
      {corners.map((c) => (
        <span
          key={c}
          aria-hidden
          onPointerDown={onCorner}
          className={`${handle} ${c} ${onCorner ? "" : "pointer-events-none"}`}
        />
      ))}
    </>
  );
}

/**
 * Figma-selection frame for a rich-title segment. The body delegates its drag
 * to the parent (`onMoveStart`) so neighbours can reflow; the corner handles
 * keep the local free-transform (scale/rotate) that springs back on release.
 */
function InteractiveFrame({
  children,
  image,
  onMoveStart,
}: {
  children: React.ReactNode;
  image?: boolean;
  onMoveStart: (e: React.PointerEvent) => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [t, setT] = useState({ s: 1, r: 0 });
  const [springing, setSpringing] = useState(false);
  const gesture = useRef<{
    cx: number;
    cy: number;
    startDist: number;
    startAngle: number;
  } | null>(null);

  const onMove = useCallback((e: PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    // Corner drag = free transform: distance scales, angle rotates.
    const dist = Math.hypot(e.clientX - g.cx, e.clientY - g.cy);
    const s = Math.min(2.5, Math.max(0.4, dist / g.startDist));
    const angle = (Math.atan2(e.clientY - g.cy, e.clientX - g.cx) * 180) / Math.PI;
    setT({ s, r: angle - g.startAngle });
  }, []);

  const release = useCallback(() => {
    gesture.current = null;
    window.removeEventListener("pointermove", onMove);
    // Spring back home — smooth overshoot, never a sudden jump.
    setSpringing(true);
    setT({ s: 1, r: 0 });
  }, [onMove]);

  function corner(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    gesture.current = {
      cx,
      cy,
      startDist: Math.max(8, Math.hypot(e.clientX - cx, e.clientY - cy)),
      startAngle: (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI,
    };
    setSpringing(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", release, { once: true });
  }

  useEffect(
    () => () => window.removeEventListener("pointermove", onMove),
    [onMove],
  );

  return (
    <span
      ref={ref}
      onPointerDown={onMoveStart}
      style={{
        transform: `rotate(${t.r}deg) scale(${t.s})`,
        transition: springing
          ? "transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)"
          : "none",
        touchAction: "none",
      }}
      className={`relative z-20 cursor-grab select-none whitespace-nowrap active:cursor-grabbing ${
        image
          ? "inline-flex items-center align-middle p-1 sm:p-1.5"
          : "inline-block px-1 sm:px-1.5"
      }`}
    >
      <SelectionChrome onCorner={corner} />
      {children}
    </span>
  );
}

/**
 * Renders the hand-designed headline and makes the Figma-selected segments
 * playfully draggable: while you drag one it lifts out and the neighbouring
 * words slide in to close the gap; drop it in a new spot and it stays there,
 * drop it back and everything eases home. All ephemeral — a refresh restores
 * the authored arrangement.
 */
type DropTarget = { line: number; beforeId: string | null };

function sameTarget(a: DropTarget | null, b: DropTarget | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.line === b.line && a.beforeId === b.beforeId;
}

function RichTitle({ rich, fonts }: { rich: HeroRichTitle; fonts: HeroFont[] }) {
  const [lines, setLines] = useState<HeroSegment[][]>(rich.lines);
  // Re-seed from props (and reset any playful rearranging) when the design
  // changes — the render-time reset pattern, so no effect/cascading render.
  const [seed, setSeed] = useState(rich);
  if (seed !== rich) {
    setSeed(rich);
    setLines(rich.lines);
  }

  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLSpanElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  // `carried` = the element has been lifted AND taken clearly off its resting
  // spot. Until then its slot is held open, so nothing collapses the instant you
  // nudge it (no leftward "tug" from the words closing in).
  const [carried, setCarried] = useState(false);
  // Live drop slot — only set while the dragged element is near a word edge, so
  // the words open a gap for it *then* and not at every moment of the drag.
  const [preview, setPreview] = useState<DropTarget | null>(null);
  // After release, the element flies from the cursor into its committed slot.
  const [settleId, setSettleId] = useState<string | null>(null);
  const settleFrameRef = useRef<HTMLSpanElement>(null);
  const [dragWidth, setDragWidth] = useState(0);
  const dragWidthRef = useRef(0);
  const fx = useMotionValue(0);
  const fy = useMotionValue(0);

  const layoutTransition = reduce
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 500, damping: 38 };

  // Fly the floating copy from where it was dropped into its final slot, then
  // reveal the real (inline) element and drop the copy.
  useLayoutEffect(() => {
    if (!settleId) return;
    const el = settleFrameRef.current;
    if (!el || reduce) {
      setSettleId(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const opts = { type: "spring" as const, stiffness: 500, damping: 38 };
    const ax = animate(fx, r.left, opts);
    const ay = animate(fy, r.top, opts);
    // Clear on completion via the finished promises (onComplete proved
    // unreliable here), with a timeout so a missed resolve can't strand the copy.
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setSettleId(null);
    };
    Promise.all([ax.finished, ay.finished]).then(finish).catch(() => {});
    const t = window.setTimeout(finish, 600);
    return () => {
      window.clearTimeout(t);
      ax.stop();
      ay.stop();
    };
  }, [settleId, reduce, fx, fy]);

  /**
   * The drop slot for the pointer, but only when it's genuinely near a row of
   * words (vertically within a line and horizontally close to its edge). Away
   * from the words this returns null, so nothing rearranges until you approach.
   */
  const computePreview = useCallback((x: number, y: number): DropTarget | null => {
    const c = containerRef.current;
    if (!c) return null;
    const lineEls = Array.from(c.querySelectorAll<HTMLElement>("[data-line]"));
    if (lineEls.length === 0) return null;

    // Nearest line whose vertical band (with a little slack) contains the pointer.
    let lineEl: HTMLElement | undefined;
    let best = Infinity;
    for (const el of lineEls) {
      const r = el.getBoundingClientRect();
      const padY = r.height * 0.6;
      if (y >= r.top - padY && y <= r.bottom + padY) {
        const d = Math.abs((r.top + r.bottom) / 2 - y);
        if (d < best) {
          best = d;
          lineEl = el;
        }
      }
    }
    if (!lineEl) return null;

    const r = lineEl.getBoundingClientRect();
    // Only "make room" once the pointer is close to the words horizontally.
    const padX = Math.max(48, dragWidthRef.current * 0.75);
    if (x < r.left - padX || x > r.right + padX) return null;

    const li = Number(lineEl.dataset.line);
    const tokens = Array.from(lineEl.querySelectorAll<HTMLElement>("[data-seg-id]"));
    for (const el of tokens) {
      const rr = el.getBoundingClientRect();
      if (x < (rr.left + rr.right) / 2) {
        return { line: li, beforeId: el.dataset.segId ?? null };
      }
    }
    return { line: li, beforeId: null };
  }, []);

  /** Move a segment to the drop point (id-based, so it's robust to the dragged
   *  element being pulled out of the DOM). */
  const commit = useCallback((segId: string, target: DropTarget | null) => {
    if (!target) return;
    setLines((prev) => {
      let seg: HeroSegment | undefined;
      const next = prev.map((line) =>
        line.filter((s) => {
          if (s.id === segId) {
            seg = s;
            return false;
          }
          return true;
        }),
      );
      if (!seg || !next[target.line]) return prev;
      const dest = next[target.line];
      if (target.beforeId == null) {
        dest.push(seg);
      } else {
        const idx = dest.findIndex((s) => s.id === target.beforeId);
        if (idx < 0) dest.push(seg);
        else dest.splice(idx, 0, seg);
      }
      return next;
    });
  }, []);

  /** Body pointer-down on a Figma segment: a move past a small threshold lifts
   *  it out (neighbours close its old gap) and floats a copy under the cursor. */
  const startMove = useCallback(
    (e: React.PointerEvent, seg: HeroSegment) => {
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const frame = e.currentTarget as HTMLElement;
      const rect = frame.getBoundingClientRect();

      // The slot the element currently sits in — never treated as a drop target,
      // so its own neighbourhood doesn't "grab" it the instant you nudge it.
      const wrapper = frame.closest<HTMLElement>("[data-seg-id]");
      const lineEl = frame.closest<HTMLElement>("[data-line]");
      const nextSib = wrapper?.nextElementSibling as HTMLElement | null;
      const origin: DropTarget | null = lineEl
        ? {
            line: Number(lineEl.dataset.line),
            beforeId: nextSib?.dataset?.segId ?? null,
          }
        : null;
      // You must carry it clearly off its resting spot before any gap opens.
      const pickup = Math.max(rect.width, 44);

      let dragging = false;
      let carriedLocal = false;
      let target: DropTarget | null = null;

      const onMove = (ev: PointerEvent) => {
        const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
        if (!dragging && dist > 5) {
          dragging = true;
          dragWidthRef.current = rect.width;
          setDragWidth(rect.width);
          fx.set(rect.left);
          fy.set(rect.top);
          setSettleId(null); // cancel any in-flight settle from a prior drag
          setDragId(seg.id);
        }
        if (dragging) {
          fx.set(rect.left + (ev.clientX - startX));
          fy.set(rect.top + (ev.clientY - startY));
          // Nothing reflows until it's been carried off its resting spot; then
          // its old slot closes and it can open a gap where it lands.
          if (!carriedLocal && dist > pickup) {
            carriedLocal = true;
            setCarried(true);
          }
          let next: DropTarget | null = null;
          if (carriedLocal) {
            next = computePreview(ev.clientX, ev.clientY);
            // Its own origin slot never counts, so it isn't tugged back home.
            if (sameTarget(next, origin)) next = null;
          }
          if (!sameTarget(next, target)) {
            target = next;
            setPreview(next);
          }
        }
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        if (dragging) {
          // Near a word edge → drop there and keep it; otherwise it eases home.
          // The element keeps floating and flies into its slot via the settle
          // effect (which reveals the inline element on arrival).
          commit(seg.id, target);
          setDragId(null);
          setCarried(false);
          setPreview(null);
          setSettleId(seg.id);
        }
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [commit, computePreview, fx, fy],
  );

  // The floating copy stays up through both the drag and the post-release fly.
  const activeId = dragId ?? settleId;
  const activeSeg = activeId ? lines.flat().find((s) => s.id === activeId) : undefined;

  /** A collapsed placeholder that reserves the dragged element's width so the
   *  neighbours open a real gap where it will land. */
  const dropGap = (lead: string) => (
    <motion.span
      key="__drop-gap__"
      layout
      aria-hidden
      transition={layoutTransition}
      className="inline-block align-middle"
      style={{ whiteSpace: "pre", width: dragWidth }}
    >
      {lead}
    </motion.span>
  );

  return (
    <span ref={containerRef} style={{ display: "contents" }}>
      {lines.map((line, li) => {
        // Where (if anywhere) to open the gap on this line this frame.
        const gapBefore =
          dragId && preview && preview.line === li ? preview.beforeId : undefined;

        // Build the ordered tokens (words + the optional gap) so the leading
        // space can be applied purely by position — robust to insertion.
        const items: { key: string; render: (lead: string) => React.ReactNode }[] = [];
        for (const seg of line) {
          if (seg.id === dragId) {
            // Lifted but not yet carried away → hold its slot open (invisible)
            // so nothing collapses. Once carried, it's gone and neighbours close.
            if (!carried) {
              items.push({
                key: seg.id + "-held",
                render: (lead) => (
                  <span
                    key={seg.id + "-held"}
                    aria-hidden
                    className="inline-block align-middle"
                    style={{ whiteSpace: "pre", visibility: "hidden" }}
                  >
                    {lead}
                    <span
                      className={`relative ${
                        isHeroImage(seg)
                          ? "inline-flex items-center p-1 sm:p-1.5"
                          : "inline-block px-1 sm:px-1.5"
                      }`}
                    >
                      <SegInner seg={seg} fonts={fonts} />
                    </span>
                  </span>
                ),
              });
            }
            continue;
          }
          if (seg.id === settleId) {
            // Landing: reserve the final slot (invisible + measurable) while the
            // floating copy flies to it; the copy is revealed as the real one.
            items.push({
              key: seg.id,
              render: (lead) => (
                <span
                  key={seg.id}
                  data-seg-id={seg.id}
                  aria-hidden
                  className="inline-block align-middle"
                  style={{ whiteSpace: "pre", visibility: "hidden" }}
                >
                  {lead}
                  <span
                    ref={settleFrameRef}
                    className={`relative ${
                      isHeroImage(seg)
                        ? "inline-flex items-center p-1 sm:p-1.5"
                        : "inline-block px-1 sm:px-1.5"
                    }`}
                  >
                    <SegInner seg={seg} fonts={fonts} />
                  </span>
                </span>
              ),
            });
            continue;
          }
          if (gapBefore !== undefined && gapBefore === seg.id) {
            items.push({ key: "__drop-gap__", render: dropGap });
          }
          items.push({
            key: seg.id,
            render: (lead) => (
              <motion.span
                key={seg.id}
                layout
                data-seg-id={seg.id}
                transition={layoutTransition}
                className="inline-block align-middle"
                // `pre` keeps the leading space so removing a segment closes the
                // gap completely (the space travels with the word).
                style={{ whiteSpace: "pre" }}
              >
                {lead}
                {seg.figma ? (
                  <InteractiveFrame
                    image={isHeroImage(seg)}
                    onMoveStart={(ev) => startMove(ev, seg)}
                  >
                    <SegInner seg={seg} fonts={fonts} />
                  </InteractiveFrame>
                ) : (
                  <SegInner seg={seg} fonts={fonts} />
                )}
              </motion.span>
            ),
          });
        }
        if (gapBefore === null) items.push({ key: "__drop-gap__", render: dropGap });

        return (
          <span key={li} data-line={li} className="block">
            {items.length === 0
              ? " "
              : items.map((it, idx) => (
                  <Fragment key={it.key}>{it.render(idx > 0 ? " " : "")}</Fragment>
                ))}
          </span>
        );
      })}

      {/* Floating copy driven purely by motion values (no layoutId, so it never
          flashes to the viewport origin). It follows the cursor while dragging,
          then the settle effect flies it into its slot. */}
      {activeSeg && (
        <motion.span
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            x: fx,
            y: fy,
            zIndex: 50,
            // inline-flex + no line-height so the frame sits flush at (fx, fy),
            // matching the measured destination frame — no baseline dip on settle.
            display: "inline-flex",
            lineHeight: 0,
            whiteSpace: "pre",
            pointerEvents: "none",
          }}
        >
          {activeSeg.figma ? (
            <span
              className={`relative ${
                isHeroImage(activeSeg)
                  ? "inline-flex items-center p-1 sm:p-1.5"
                  : "inline-block px-1 sm:px-1.5"
              }`}
            >
              <SelectionChrome />
              <SegInner seg={activeSeg} fonts={fonts} />
            </span>
          ) : (
            <SegInner seg={activeSeg} fonts={fonts} />
          )}
        </motion.span>
      )}
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
  rich,
  fonts = [],
}: {
  showAvailable?: boolean;
  title?: string | null;
  subtitle?: string | null;
  highlight?: string | null;
  rich?: HeroRichTitle | null;
  fonts?: HeroFont[];
}) {
  // Headline-wide spacing overrides the Tailwind defaults (tracking-tight /
  // leading-[1.05]) only when the design sets them; older designs keep both.
  const richStyle: React.CSSProperties = {};
  if (rich) {
    if (rich.letterSpacing != null) richStyle.letterSpacing = `${rich.letterSpacing}em`;
    if (rich.wordSpacing != null) richStyle.wordSpacing = `${rich.wordSpacing}em`;
    if (rich.lineHeight != null) richStyle.lineHeight = rich.lineHeight;
  }
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
        className="max-w-4xl whitespace-pre-line text-balance text-5xl font-semibold leading-[1.05] tracking-tight lg:text-7xl"
        style={richStyle}
      >
        {rich && rich.lines.length > 0 ? (
          <RichTitle rich={rich} fonts={fonts} />
        ) : (
          renderTitle(title || DEFAULT_TITLE, highlight)
        )}
      </motion.h1>

      {/* `null`/undefined = never configured → default copy; an explicit
          empty string (admin cleared it) hides the description entirely. */}
      {(subtitle ?? DEFAULT_SUBTITLE) && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease }}
          className="mt-6 max-w-xl whitespace-pre-line text-balance text-lg text-muted-foreground"
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
