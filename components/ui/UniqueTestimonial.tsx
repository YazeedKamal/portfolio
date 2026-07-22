"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
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

export function UniqueTestimonial({ testimonials }: { testimonials: Testimonial[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    return () => {
      if (swapTimer.current) clearTimeout(swapTimer.current);
      if (finishTimer.current) clearTimeout(finishTimer.current);
    };
  }, []);

  const displayed = testimonials[displayedIndex] ?? testimonials[0];

  function handleSelect(index: number) {
    if (index === activeIndex || isAnimating) return;

    if (reduceMotion) {
      setDisplayedIndex(index);
      setActiveIndex(index);
      return;
    }

    setIsAnimating(true);
    swapTimer.current = setTimeout(() => {
      setDisplayedIndex(index);
      setActiveIndex(index);
      finishTimer.current = setTimeout(() => setIsAnimating(false), 380);
    }, 180);
  }

  return (
    <div className="flex flex-col items-center gap-10 py-10 sm:gap-12 sm:py-14">
      <div className="relative w-full max-w-3xl px-8 sm:px-14">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-1 -top-9 select-none font-serif text-7xl leading-none text-foreground/[0.06] sm:left-2 sm:text-8xl"
        >
          &ldquo;
        </span>

        <blockquote
          className={classes(
            "text-balance text-center text-2xl font-bold leading-relaxed tracking-[-0.03em] text-foreground transition-all duration-[380ms] ease-out sm:text-3xl md:text-[2.15rem]",
            isAnimating ? "scale-[0.98] opacity-0 blur-sm" : "scale-100 opacity-100 blur-0",
            "motion-reduce:transform-none motion-reduce:transition-none",
          )}
        >
          {displayed.quote}
        </blockquote>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-12 -right-1 select-none font-serif text-7xl leading-none text-foreground/[0.06] sm:right-2 sm:text-8xl"
        >
          &rdquo;
        </span>
      </div>

      <div className="flex w-full flex-col items-center gap-6">
        <p
          className={classes(
            "min-h-4 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground transition-all duration-500 ease-out",
            isAnimating ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100",
            "motion-reduce:transform-none motion-reduce:transition-none",
          )}
        >
          {displayed.role || displayed.name}
        </p>

        <div className="flex max-w-full flex-wrap items-center justify-center gap-2.5">
          {testimonials.map((testimonial, index) => {
            const isActive = activeIndex === index;
            const isHovered = hoveredIndex === index && !isActive;
            const showName = isActive || isHovered;

            return (
              <button
                key={testimonial.id}
                type="button"
                onClick={() => handleSelect(index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
                aria-label={`Show testimonial from ${testimonial.name}`}
                aria-pressed={isActive}
                className={classes(
                  "group relative flex cursor-pointer items-center rounded-full outline-none transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
                  isActive
                    ? "bg-foreground shadow-lg shadow-foreground/10"
                    : "bg-transparent hover:bg-foreground/[0.06]",
                  showName ? "py-2 pl-2 pr-4" : "p-0.5",
                )}
              >
                <span className="relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-foreground/10 text-[10px] font-semibold text-foreground">
                  {testimonial.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={testimonial.avatar_url}
                      alt=""
                      className={classes(
                        "h-full w-full rounded-full object-cover transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
                        isActive ? "ring-2 ring-background/30" : "ring-0",
                        !isActive && "group-hover:scale-105",
                      )}
                    />
                  ) : (
                    initials(testimonial.name)
                  )}
                </span>

                <span
                  className={classes(
                    "grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
                    showName
                      ? "ml-2 grid-cols-[1fr] opacity-100"
                      : "ml-0 grid-cols-[0fr] opacity-0",
                  )}
                >
                  <span className="overflow-hidden">
                    <span
                      className={classes(
                        "block whitespace-nowrap text-sm font-medium transition-colors duration-300 motion-reduce:transition-none",
                        isActive ? "text-background" : "text-foreground",
                      )}
                    >
                      {testimonial.name}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
