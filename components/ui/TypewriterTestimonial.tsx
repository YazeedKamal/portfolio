"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Testimonial } from "@/lib/types";

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Instagram-inspired story gradient (warm → magenta → violet).
const INSTAGRAM_RING =
  "conic-gradient(from 0deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5, #feda75)";

export function TypewriterTestimonial({ testimonials }: { testimonials: Testimonial[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  // "Seen" state lives only in memory, so a page refresh brings the
  // gradient rings back — nothing is persisted.
  const [seen, setSeen] = useState<boolean[]>(() =>
    new Array(testimonials.length).fill(false),
  );
  const [typedText, setTypedText] = useState("");
  // Popover geometry, measured from the anchor's left edge so the bubble sits
  // above the active avatar while always staying inside the viewport.
  const [popLeft, setPopLeft] = useState(0);
  const [popWidth, setPopWidth] = useState(320);
  const [isTouch, setIsTouch] = useState(false);

  const typeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const reduceMotion = useReducedMotion();

  // Detect a coarse / hover-less pointer once on mount so touch devices get
  // tap-to-toggle while pointer devices keep the hover behaviour.
  useEffect(() => {
    setIsTouch(window.matchMedia("(hover: none)").matches);
  }, []);

  const stopTypewriter = useCallback(() => {
    if (typeTimer.current) {
      clearTimeout(typeTimer.current);
      typeTimer.current = null;
    }
  }, []);

  const startTypewriter = useCallback(
    (text: string) => {
      stopTypewriter();

      if (reduceMotion) {
        setTypedText(text);
        return;
      }

      setTypedText("");
      let i = 0;
      const type = () => {
        i += 1;
        setTypedText(text.slice(0, i));
        if (i < text.length) {
          typeTimer.current = setTimeout(type, 24);
        }
      };
      type();
    },
    [reduceMotion, stopTypewriter],
  );

  // Position + size the popover so it hugs the active avatar yet never spills
  // past the edges of the anchor (which is full-viewport-width on phones).
  const positionPopover = useCallback((index: number) => {
    const anchor = anchorRef.current;
    const btn = btnRefs.current[index];
    if (!anchor || !btn) return;

    const aRect = anchor.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();

    // Fit within the anchor, capped at a comfortable reading width.
    const width = Math.min(384, Math.max(0, aRect.width - 24));
    const half = width / 2 + 8;
    const center = bRect.left - aRect.left + bRect.width / 2;
    const clamped = Math.max(half, Math.min(center, aRect.width - half));

    setPopWidth(width);
    setPopLeft(clamped);
  }, []);

  const open = useCallback(
    (index: number) => {
      positionPopover(index);
      setActiveIndex(index);
      setSeen((prev) => {
        if (prev[index]) return prev;
        const next = [...prev];
        next[index] = true;
        return next;
      });
      startTypewriter(testimonials[index].quote);
    },
    [positionPopover, startTypewriter, testimonials],
  );

  const close = useCallback(() => {
    setActiveIndex(null);
    stopTypewriter();
    setTypedText("");
  }, [stopTypewriter]);

  // Hover (pointer devices only).
  const handleEnter = useCallback(
    (index: number) => {
      if (isTouch) return;
      open(index);
    },
    [isTouch, open],
  );
  const handleLeave = useCallback(() => {
    if (isTouch) return;
    close();
  }, [isTouch, close]);

  // Tap toggle (touch devices only).
  const handleTap = useCallback(
    (index: number) => {
      if (!isTouch) return;
      if (activeIndex === index) close();
      else open(index);
    },
    [isTouch, activeIndex, open, close],
  );

  // On touch, tapping anywhere outside the avatars closes the bubble.
  useEffect(() => {
    if (!isTouch || activeIndex === null) return;
    const onDown = (event: PointerEvent) => {
      if (!anchorRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [isTouch, activeIndex, close]);

  // Keep the bubble aligned if the viewport is resized while it is open.
  useEffect(() => {
    if (activeIndex === null) return;
    const onResize = () => positionPopover(activeIndex);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeIndex, positionPopover]);

  useEffect(() => stopTypewriter, [stopTypewriter]);

  const active = activeIndex === null ? null : testimonials[activeIndex];

  return (
    <div className="flex flex-col items-center gap-8 py-10 sm:gap-10 sm:py-14">
      {/*
        Anchor: full-viewport-width on phones so the avatar row can scroll edge
        to edge, and it doubles as the positioning context for the bubble. The
        bubble is a sibling of the scrolling row so the row's horizontal
        overflow never clips it.
      */}
      <div ref={anchorRef} className="relative w-screen sm:w-full">
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 6, x: "-50%" }}
              animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, scale: 0.9, y: 6, x: "-50%" }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              style={{ left: popLeft, width: popWidth }}
              className="pointer-events-none absolute bottom-[calc(100%+1rem)] z-10 rounded-2xl border border-border bg-surface-elevated p-5 text-left shadow-2xl shadow-black/10"
            >
              <p className="min-h-[4.5rem] text-sm leading-relaxed text-foreground">
                {typedText}
                <span className="ml-0.5 inline-block w-px animate-caret-blink align-middle text-foreground">
                  |
                </span>
              </p>
              <p className="mt-3 text-sm font-semibold text-foreground">
                {active.name}
              </p>
              {active.role && (
                <p className="text-xs text-muted-foreground">{active.role}</p>
              )}
              {/* Little tail of dots pointing down to the avatars. */}
              <span className="absolute left-1/2 top-full flex -translate-x-1/2 flex-col items-center gap-1 pt-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-surface-elevated shadow" />
                <span className="h-1 w-1 rounded-full bg-surface-elevated shadow" />
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/*
          Avatars: a single horizontally-scrollable row on phones (with inset
          padding so the first/last aren't flush to the edge), wrapping and
          centred from `sm` upwards.
        */}
        <div
          className="flex snap-x snap-mandatory items-center gap-x-5 overflow-x-auto px-6 py-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:gap-x-7 sm:gap-y-8 sm:overflow-visible sm:px-4 [&::-webkit-scrollbar]:hidden"
          onScroll={() => {
            if (activeIndex !== null) close();
          }}
        >
          {testimonials.map((testimonial, index) => {
            const isActive = activeIndex === index;
            const isSeen = seen[index];

            return (
              <div
                key={testimonial.id}
                className="flex shrink-0 snap-center flex-col items-center"
              >
                <motion.button
                  ref={(el) => {
                    btnRefs.current[index] = el;
                  }}
                  type="button"
                  onMouseEnter={() => handleEnter(index)}
                  onMouseLeave={handleLeave}
                  onFocus={() => handleEnter(index)}
                  onBlur={handleLeave}
                  onClick={() => handleTap(index)}
                  aria-label={`Read the testimonial from ${testimonial.name}`}
                  aria-expanded={isActive}
                  whileHover={reduceMotion ? undefined : { scale: 1.06 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                  className="group relative cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                >
                  {/* Story ring — animated Instagram gradient until it has been
                      seen, then it fades to a plain muted ring. */}
                  <span
                    aria-hidden="true"
                    className={classes(
                      "absolute inset-0 rounded-full transition-opacity duration-500 ease-out",
                      isSeen ? "opacity-0" : "opacity-100",
                      !reduceMotion && "animate-ring-spin",
                    )}
                    style={{ background: INSTAGRAM_RING }}
                  />
                  <span
                    aria-hidden="true"
                    className={classes(
                      "absolute inset-0 rounded-full bg-border-strong transition-opacity duration-500 ease-out",
                      isSeen ? "opacity-100" : "opacity-0",
                    )}
                  />

                  {/* Inner gap + avatar. */}
                  <span className="relative m-[3px] block rounded-full bg-background p-[3px]">
                    <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-foreground/10 text-sm font-semibold text-foreground">
                      {testimonial.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={testimonial.avatar_url}
                          alt=""
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        initials(testimonial.name)
                      )}
                    </span>
                  </span>
                </motion.button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
