"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useDragControls,
  type PanInfo,
} from "framer-motion";
import { X } from "lucide-react";
import { SheetReadyContext } from "./sheet-ready-context";

/**
 * Bottom sheet that renders a project case study as an overlay above the
 * homepage (via an intercepting route). The navbar stays visible on top; the
 * blurred, dimmed homepage shows behind and around the sheet. Closing plays a
 * slide-down + fade, then pops the intercepted route with `router.back()`.
 */
export function ProjectSheet({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  // Keep the sheet's scrollbar hidden until the real content (not the loading
  // skeleton) has rendered — otherwise the thumb flashes at full height while
  // the short skeleton shows, then shrinks once the tall content streams in.
  const [contentReady, setContentReady] = useState(false);
  const markReady = useCallback(() => setContentReady(true), []);
  const dragControls = useDragControls();

  const close = useCallback(() => setOpen(false), []);

  // Esc to close + lock the page scroll behind the sheet while it's open.
  // Lock on <html> (the scroller) so the page scrollbar is hidden — not just
  // scroll-disabled — and pad the body by the scrollbar width so the blurred
  // background doesn't shift. Restore the scroll position on close so going
  // back doesn't jump the homepage to the top of the projects section.
  useEffect(() => {
    const scrollY = window.scrollY;
    const html = document.documentElement;
    const body = document.body;
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyPadding = body.style.paddingRight;
    html.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      html.style.overflow = prevHtmlOverflow;
      body.style.paddingRight = prevBodyPadding;
      // Run after the route transition so it wins over scroll restoration.
      requestAnimationFrame(() => window.scrollTo(0, scrollY));
    };
  }, [close]);

  // Flag the sheet's open state on <html> so the navbar can slide away while
  // it's up (and slide back as it closes).
  useEffect(() => {
    const el = document.documentElement;
    if (open) el.setAttribute("data-sheet-open", "");
    else el.removeAttribute("data-sheet-open");
    return () => el.removeAttribute("data-sheet-open");
  }, [open]);

  const onDragEnd = (_e: unknown, info: PanInfo) => {
    // Fling or drag far enough down → dismiss.
    if (info.offset.y > 140 || info.velocity.y > 600) close();
  };

  return (
    <AnimatePresence onExitComplete={() => router.back()}>
      {open && (
        <motion.div key="project-sheet" className="fixed inset-0 z-40">
          {/* Blurred backdrop over the homepage. Navbar (z-50) stays crisp
              above this. Dark scrim in light mode; a lighter scrim in dark
              mode so the near-black sheet stays distinct from the true-black
              homepage behind it. */}
          <motion.div
            className="absolute inset-0 cursor-pointer bg-black/50 backdrop-blur-md dark:bg-white/22"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={close}
          />

          {/* Sheet panel — full screen width, anchored to the bottom.
              Full-screen on mobile; on desktop the navbar slides away so the
              top can sit near the top edge. */}
          <motion.div
            className="absolute inset-x-0 bottom-0 top-0 flex w-full flex-col overflow-hidden border border-border bg-background shadow-[0_-20px_60px_rgba(0,0,0,0.25)] sm:top-8 sm:rounded-t-[2rem]"
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
            {/* Invisible top strip (no visible header): grab to swipe the
                sheet down and dismiss. */}
            <div
              aria-hidden
              onPointerDown={(e) => dragControls.start(e)}
              className="absolute inset-x-0 top-0 z-10 h-8 cursor-grab touch-none active:cursor-grabbing"
            />

            {/* Floating close button — kept on both mobile and desktop. */}
            <button
              aria-label="Close"
              onClick={close}
              className="absolute right-4 top-4 z-20 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Scrollable case-study content. Full-screen sheet, but the
                content sits in a centered column (good side margins on web)
                with 24px padding — full-width with 24px on mobile. The
                scrollbar stays hidden until the real content is ready. */}
            <div
              className={`min-h-0 flex-1 overscroll-contain ${
                contentReady ? "overflow-y-auto" : "overflow-hidden"
              }`}
            >
              <div className="mx-auto w-full max-w-4xl p-6">
                <SheetReadyContext.Provider value={markReady}>
                  {children}
                </SheetReadyContext.Provider>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
