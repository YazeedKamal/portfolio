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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  // "Seen" state lives only in memory, so a page refresh brings the
  // gradient rings back — nothing is persisted.
  const [seen, setSeen] = useState<boolean[]>(() =>
    new Array(testimonials.length).fill(false),
  );
  const [typedText, setTypedText] = useState("");
  const typeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();

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

  const handleEnter = useCallback(
    (index: number) => {
      setHoveredIndex(index);
      setSeen((prev) => {
        if (prev[index]) return prev;
        const next = [...prev];
        next[index] = true;
        return next;
      });
      startTypewriter(testimonials[index].quote);
    },
    [testimonials, startTypewriter],
  );

  const handleLeave = useCallback(() => {
    setHoveredIndex(null);
    stopTypewriter();
    setTypedText("");
  }, [stopTypewriter]);

  useEffect(() => stopTypewriter, [stopTypewriter]);

  return (
    <div className="flex flex-col items-center gap-8 py-10 sm:gap-10 sm:py-14">
      <div className="flex max-w-full flex-wrap items-center justify-center gap-x-5 gap-y-8 px-4 sm:gap-x-7">
        {testimonials.map((testimonial, index) => {
          const isHovered = hoveredIndex === index;
          const isSeen = seen[index];

          return (
            <div key={testimonial.id} className="relative flex flex-col items-center">
              <motion.button
                type="button"
                onMouseEnter={() => handleEnter(index)}
                onMouseLeave={handleLeave}
                onFocus={() => handleEnter(index)}
                onBlur={handleLeave}
                aria-label={`Read the testimonial from ${testimonial.name}`}
                aria-expanded={isHovered}
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

              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 6 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute bottom-[calc(100%+1rem)] z-10 w-64 rounded-2xl border border-border bg-surface-elevated p-4 text-left shadow-2xl shadow-black/10"
                  >
                    <p className="min-h-[4.5rem] text-sm leading-relaxed text-foreground">
                      {typedText}
                      <span className="ml-0.5 inline-block w-px animate-caret-blink align-middle text-foreground">
                        |
                      </span>
                    </p>
                    <p className="mt-3 text-sm font-semibold text-foreground">
                      {testimonial.name}
                    </p>
                    {testimonial.role && (
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    )}
                    {/* Little tail of dots pointing down to the avatar. */}
                    <span className="absolute left-1/2 top-full flex -translate-x-1/2 flex-col items-center gap-1 pt-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-surface-elevated shadow" />
                      <span className="h-1 w-1 rounded-full bg-surface-elevated shadow" />
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
