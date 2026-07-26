"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps a muted autoplay `<video>` cheap: it only plays while it's on screen
 * and pauses once it scrolls away, so a page full of clips never plays them
 * all at once. Pair with `preload="metadata"` so the file isn't fetched in
 * full up front.
 *
 * Usage:
 *   const ref = usePlayInView<HTMLVideoElement>();
 *   <video ref={ref} muted loop playsInline preload="metadata" ... />
 */
export function usePlayInView<T extends HTMLVideoElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // play() rejects if interrupted (e.g. element removed) — ignore.
          void el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
