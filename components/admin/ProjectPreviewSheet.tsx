"use client";

import { useEffect } from "react";
import {
  AnimatePresence,
  motion,
  useDragControls,
  type PanInfo,
} from "framer-motion";
import { Monitor, Smartphone, X } from "lucide-react";
import { ProjectHero } from "@/components/project/ProjectHero";
import { ContentBlocks } from "@/components/project/ContentBlocks";
import { SheetOutro } from "@/components/project/SheetOutro";
import type { Project } from "@/lib/types";

type Device = "web" | "mobile";

/**
 * Admin-only live preview of the project being built. It reuses the exact same
 * visuals as the public case study (`ProjectHero` + `ContentBlocks`) inside a
 * bottom sheet that mirrors the real `ProjectSheet` — but controlled by
 * `open`/`onClose` instead of Next.js routing, so it can render the builder's
 * unsaved in-memory state. `device` is owned by the builder (shared with its
 * canvas toggle) and constrains the sheet width so the `@container` blocks
 * reflow exactly like real mobile vs. web.
 */
export function ProjectPreviewSheet({
  project,
  open,
  onClose,
  device,
  onDeviceChange,
  otherProjects = [],
}: {
  project: Project;
  open: boolean;
  onClose: () => void;
  device: Device;
  onDeviceChange: (d: Device) => void;
  otherProjects?: Project[];
}) {
  const dragControls = useDragControls();

  // Esc to close + lock the page scroll behind the sheet while it's open.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      html.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const onDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.y > 140 || info.velocity.y > 600) onClose();
  };

  const isMobile = device === "mobile";

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="preview-sheet" className="fixed inset-0 z-50">
          {/* Blurred backdrop over the builder. */}
          <motion.div
            className="absolute inset-0 cursor-pointer bg-black/50 backdrop-blur-md dark:bg-white/22"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={onClose}
          />

          {/* Floating device toggle — flip between mobile and web live. */}
          <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2">
            <DeviceToggle device={device} onChange={onDeviceChange} />
          </div>

          {/* Sheet panel. On "mobile" it's a centered phone-width frame so the
              @container blocks collapse; on "web" it's the full-width sheet that
              mirrors the real desktop case study. */}
          <motion.div
            key={device}
            className={`absolute bottom-0 top-8 flex flex-col overflow-hidden border border-border bg-background shadow-[0_-20px_60px_rgba(0,0,0,0.25)] ${
              isMobile
                ? "inset-x-0 mx-auto w-full max-w-[390px] rounded-t-[2.5rem]"
                : "inset-x-0 w-full rounded-t-[2rem]"
            }`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            dragSnapToOrigin
            onDragEnd={onDragEnd}
          >
            {/* Invisible grab strip — swipe down to dismiss. */}
            <div
              aria-hidden
              onPointerDown={(e) => dragControls.start(e)}
              className="absolute inset-x-0 top-0 z-10 h-8 cursor-grab touch-none active:cursor-grabbing"
            />

            {/* Floating close button. */}
            <button
              type="button"
              aria-label="Close preview"
              onClick={onClose}
              className="absolute right-4 top-4 z-20 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Scrollable case-study content — same column + padding as the real
                sheet so the preview is 1:1. */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="mx-auto w-full max-w-4xl p-6">
                <ProjectHero project={project} variant="sheet" />
                <ContentBlocks
                  blocks={project.content ?? []}
                  reveal={false}
                  padded={false}
                />
                <SheetOutro projects={otherProjects} interactive={false} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DeviceToggle({
  device,
  onChange,
}: {
  device: Device;
  onChange: (d: Device) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-background/80 p-1 shadow-sm backdrop-blur">
      {([["web", Monitor], ["mobile", Smartphone]] as const).map(([d, Icon]) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          aria-label={d}
          className={`grid h-7 w-8 cursor-pointer place-items-center rounded-full transition-colors ${
            device === d ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
