"use client";

import { usePlayInView } from "@/lib/use-play-in-view";

/**
 * A muted, looping autoplay video that only plays while it's on screen and
 * pauses once it scrolls away — so a page full of clips never plays them all
 * at once. `preload="metadata"` keeps the file from being fetched in full up
 * front. Drop-in replacement for a plain autoplay `<video>`.
 */
export function AutoVideo({
  src,
  poster,
  className,
}: {
  src: string;
  poster?: string;
  className?: string;
}) {
  const ref = usePlayInView<HTMLVideoElement>();
  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      className={className}
    />
  );
}
