"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { Camera, Play } from "lucide-react";
import type {
  SpotlightItem,
  SpotlightPlacement,
} from "@/lib/types";

function mediaShape(placement: SpotlightPlacement) {
  switch (placement.shape) {
    case "landscape":
      return "aspect-[4/3] rounded-[1.25rem] sm:rounded-[1.75rem]";
    case "square":
      return "aspect-square rounded-[1.25rem] sm:rounded-[1.75rem]";
    case "circle":
      return "aspect-square rounded-full";
    case "polaroid":
      return "aspect-[4/5] rounded-sm bg-white p-1.5 pb-7 shadow-2xl sm:p-2 sm:pb-9";
    default:
      return "aspect-[4/5] rounded-[1.25rem] sm:rounded-[1.75rem]";
  }
}

function SpotlightMedia({
  item,
  placement,
  index,
}: {
  item: SpotlightItem;
  placement: SpotlightPlacement;
  index: number;
}) {
  const reduceMotion = useReducedMotion();
  const isPolaroid = placement.shape === "polaroid";

  return (
    <motion.article
      initial={
        reduceMotion
          ? false
          : { opacity: 0, scale: 0.82, y: 45 }
      }
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.75,
        delay: Math.min(index * 0.055, 0.45),
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group absolute"
      style={{
        left: `${placement.x}%`,
        top: `${placement.y}%`,
        width: `${placement.width}%`,
        rotate: `${placement.rotation}deg`,
        zIndex: 10 + index,
      }}
    >
      <div
        className={`relative overflow-hidden shadow-2xl shadow-black/35 transition-transform duration-500 ease-out group-hover:scale-[1.035] ${mediaShape(
          placement,
        )}`}
      >
        {item.media_type === "video" ? (
          <>
            <video
              src={item.media_url}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            />
            <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/45 text-white backdrop-blur sm:right-3 sm:top-3 sm:h-9 sm:w-9">
              <Play className="h-3 w-3 fill-current sm:h-4 sm:w-4" />
            </span>
          </>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.media_url}
            alt={item.title || "A memory from Yazeed's Spotlight"}
            className="h-full w-full object-cover"
          />
        )}

        {!isPolaroid && (item.title || item.location) ? (
          <div className="absolute inset-x-0 bottom-0 translate-y-3 bg-gradient-to-t from-black/75 via-black/25 to-transparent px-3 pb-3 pt-12 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:px-4 sm:pb-4">
            {item.title ? (
              <p className="truncate text-[10px] font-semibold sm:text-sm">
                {item.title}
              </p>
            ) : null}
            {item.location ? (
              <p className="mt-0.5 truncate text-[8px] text-white/65 sm:text-xs">
                {item.location}
              </p>
            ) : null}
          </div>
        ) : null}

        {isPolaroid ? (
          <p className="absolute inset-x-2 bottom-1.5 truncate text-center text-[7px] font-medium text-black/65 sm:bottom-2 sm:text-[10px]">
            {item.title || item.location || "Spotlight"}
          </p>
        ) : null}
      </div>
    </motion.article>
  );
}

export function Spotlight({
  items,
  avatarUrl,
}: {
  items: SpotlightItem[];
  avatarUrl: string | null;
}) {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const modeActiveRef = useRef(false);
  const [modeActive, setModeActive] = useState(false);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "start start"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const nextMode = latest >= 0.02;
    if (nextMode === modeActiveRef.current) return;

    modeActiveRef.current = nextMode;
    setModeActive(nextMode);
  });

  return (
    <motion.section
      ref={sectionRef}
      id="spotlight"
      data-mode={modeActive ? "active" : "idle"}
      aria-labelledby="spotlight-title"
      className="relative isolate min-h-[100svh] overflow-hidden bg-background text-white dark:text-[#111111]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#050506] transition-opacity duration-500 ease-out motion-reduce:transition-none dark:bg-[#f3f0e9]"
        style={{ opacity: modeActive ? 1 : 0 }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-out motion-reduce:transition-none dark:hidden"
        style={{
          opacity: modeActive ? 1 : 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden transition-opacity duration-500 ease-out motion-reduce:transition-none dark:block"
        style={{
          opacity: modeActive ? 1 : 0,
          backgroundImage:
            "linear-gradient(rgba(0,0,0,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.065) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div
        className={`transition-colors duration-500 ease-out motion-reduce:transition-none ${
          modeActive
            ? "text-white dark:text-[#111111]"
            : "text-foreground"
        }`}
      >
        <div className="relative min-h-[100svh] md:hidden">
          {items.map((item, index) => (
            <SpotlightMedia
              key={item.id}
              item={item}
              placement={item.layout.mobile}
              index={index}
            />
          ))}
          <CenterContent
            avatarUrl={avatarUrl}
            itemCount={items.length}
            compact
            reduceMotion={reduceMotion}
          />
        </div>

        <div className="relative hidden min-h-[100svh] md:block">
          {items.map((item, index) => (
            <SpotlightMedia
              key={item.id}
              item={item}
              placement={item.layout.desktop}
              index={index}
            />
          ))}
          <CenterContent
            avatarUrl={avatarUrl}
            itemCount={items.length}
            reduceMotion={reduceMotion}
          />
        </div>
      </div>
    </motion.section>
  );
}

function CenterContent({
  avatarUrl,
  itemCount,
  compact = false,
  reduceMotion,
}: {
  avatarUrl: string | null;
  itemCount: number;
  compact?: boolean;
  reduceMotion: boolean | null;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center px-5 text-center">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className={compact ? "max-w-[270px]" : "max-w-2xl"}
      >
        <div className="mx-auto mb-4 grid h-11 w-11 place-items-center overflow-hidden rounded-full border border-white/20 bg-white/10 shadow-xl backdrop-blur-md dark:border-black/10 dark:bg-black/5">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Yazeed Kamal"
              className="h-full w-full object-cover"
            />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.3em] opacity-45 sm:text-[11px]">
          Photos · films · memories
        </p>
        <h2
          id={compact ? undefined : "spotlight-title"}
          className={`mt-2 font-semibold leading-none tracking-[-0.085em] ${
            compact ? "text-[18vw]" : "text-[clamp(5rem,11vw,11rem)]"
          }`}
        >
          Spotlight
        </h2>
        <p
          className={`mx-auto mt-3 leading-relaxed opacity-50 ${
            compact ? "max-w-[220px] text-[10px]" : "max-w-md text-sm"
          }`}
        >
          {itemCount
            ? "A living wall of people, places and moments worth keeping."
            : "Your photos, films and memories will live here."}
        </p>
      </motion.div>
    </div>
  );
}
