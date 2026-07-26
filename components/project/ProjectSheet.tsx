"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useDragControls,
  type PanInfo,
} from "framer-motion";
import { X } from "lucide-react";
import { SheetReadyContext } from "./sheet-ready-context";

// True while a close is unwinding the /work history chain. The sheet remounts on
// every /work→/work navigation, so as `dismiss` steps back through the chain a
// fresh ProjectSheet mounts at each intermediate URL — this flag makes those
// intermediate mounts start closed (render nothing) instead of replaying the
// enter animation, which is what caused the close "flicker".
let dismissing = false;

/**
 * Bottom sheet that renders a project case study as an overlay above the
 * homepage (via an intercepting route). The navbar stays visible on top; the
 * blurred, dimmed homepage shows behind and around the sheet. Closing plays a
 * slide-down + fade, then dismisses back to the page the sheet was opened over —
 * unwinding every project the user hopped through via the "More projects" cards
 * in one go (see `dismiss`), so it never replays the previously opened sheets.
 * Browser Back still walks project-to-project, since each hop pushed its own
 * history entry.
 */
export function ProjectSheet({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  // A sheet that mounts mid-dismissal (an intermediate URL during the back-unwind)
  // starts closed so it renders nothing and never flashes its enter animation.
  const [open, setOpen] = useState(() => !dismissing);
  // Keep the sheet's scrollbar hidden until the real content (not the loading
  // skeleton) has rendered — otherwise the thumb flashes at full height while
  // the short skeleton shows, then shrinks once the tall content streams in.
  const [contentReady, setContentReady] = useState(false);
  const markReady = useCallback(() => setContentReady(true), []);
  const dragControls = useDragControls();

  // Dismiss the sheet, unwinding EVERY project the user hopped through via the
  // "More projects" cards in one go, back to the page it was opened over. Each
  // hop pushed a history entry (so browser Back walks project-to-project), and
  // `router.back()` is the only reliable way to pop an intercepted-route modal
  // (a forward `router.replace("/")` clears the slot but leaves the URL stuck).
  // So we step back repeatedly — awaiting each popstate — until we're off the
  // `/work` chain. The sheet is already hidden (`open` is false) throughout, so
  // none of the intermediate projects flash. Guarded to run once per close.
  const dismissedRef = useRef(false);
  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    // Suppress the intermediate sheets that remount as we step back through the
    // chain (see the module-level `dismissing` note). Safety-reset it in case the
    // unwind is ever interrupted, so the sheet can always open again.
    dismissing = true;
    window.setTimeout(() => {
      dismissing = false;
    }, 2000);
    const step = () => {
      if (!window.location.pathname.startsWith("/work/")) {
        dismissing = false; // chain fully unwound
        return;
      }
      const onPop = () => {
        window.removeEventListener("popstate", onPop);
        // Let the router settle the new URL before checking/stepping again.
        window.setTimeout(step, 30);
      };
      window.addEventListener("popstate", onPop);
      router.back();
    };
    step();
  }, [router]);

  // Reset the one-shot dismiss guard whenever the sheet is (re)opened — the
  // intercepting-route slot can reuse this component instance across
  // close→reopen, which would otherwise leave `dismissedRef` stuck at true and
  // make the next close a no-op.
  useEffect(() => {
    if (open) dismissedRef.current = false;
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    // The slide-down exit animation normally drives the dismissal via
    // AnimatePresence's onExitComplete. But after hopping between projects the
    // (drag-enabled, persisted) panel's exit spring can stall and never fire
    // onExitComplete — so fall back to dismissing shortly after, which also
    // covers that case. `dismiss` is idempotent, so whichever fires first wins.
    window.setTimeout(dismiss, 650);
  }, [dismiss]);

  // Esc to close + lock the page scroll behind the sheet while it's open.
  // Lock on <html> (the scroller) so the page scrollbar is hidden — not just
  // scroll-disabled — and pad the body by the scrollbar width so the blurred
  // background doesn't shift. Also publish that width as `--scrollbar-comp` so
  // the fixed, centered navbar can offset itself by the same amount — otherwise
  // it drifts sideways when the scrollbar disappears (body padding only
  // compensates the background, not fixed elements). The var is removed in the
  // same cleanup that restores the scrollbar, so the two changes cancel out and
  // the navbar never jumps. Restore the scroll position on close so going back
  // doesn't jump the homepage to the top of the projects section.
  useEffect(() => {
    // Skip for the closed intermediate sheets that mount during a dismissal
    // unwind — they must not lock the scroll or churn `--scrollbar-comp`. `open`
    // is read at mount only (deps stay `[close]`) so the real sheet's scroll
    // restore still runs on unmount, after the route transition.
    if (!open) return;
    const scrollY = window.scrollY;
    const html = document.documentElement;
    const body = document.body;
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyPadding = body.style.paddingRight;
    html.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
      html.style.setProperty("--scrollbar-comp", `${scrollbarWidth}px`);
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      html.style.overflow = prevHtmlOverflow;
      body.style.paddingRight = prevBodyPadding;
      html.style.removeProperty("--scrollbar-comp");
      // Run after the route transition so it wins over scroll restoration.
      requestAnimationFrame(() => window.scrollTo(0, scrollY));
    };
    // `open` intentionally read at mount only — see the guard comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <AnimatePresence onExitComplete={dismiss}>
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
            className="absolute inset-x-0 bottom-0 top-0 flex w-full flex-col overflow-hidden border border-border bg-background sm:top-8 sm:rounded-t-[2rem]"
            // The top shadow is animated (not a static class): it fades out fast
            // on exit so it's gone before the panel finishes sliding off-screen —
            // otherwise the shadow (which reaches ~80px above the panel) lingers
            // at the bottom edge after the sheet is gone, then blinks away when
            // the node unmounts.
            initial={{ y: "100%", boxShadow: "0px 0px 0px rgba(0,0,0,0)" }}
            animate={{ y: 0, boxShadow: "0px -20px 60px rgba(0,0,0,0.25)" }}
            exit={{ y: "100%", boxShadow: "0px 0px 0px rgba(0,0,0,0)" }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 30,
              boxShadow: { type: "tween", duration: 0.2, ease: "easeOut" },
            }}
            // Disable dragging once closing: `dragSnapToOrigin` pulls the panel
            // back to y:0 while the exit animates it to y:100%, which stalls the
            // exit (it never completes, so onExitComplete never fires and the
            // node lingers). Turning drag off while !open lets the exit finish.
            drag={open ? "y" : false}
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
              className={`min-h-0 flex-1 overscroll-contain [scrollbar-gutter:stable_both-edges] ${
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
