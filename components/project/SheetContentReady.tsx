"use client";

import { useContext, useEffect } from "react";
import { SheetReadyContext } from "./sheet-ready-context";

/**
 * Rendered inside the resolved sheet content (after Suspense). On mount it
 * tells the sheet shell that the real content is in — used to reveal the
 * scrollbar only once, avoiding the full-height thumb flash during loading.
 */
export function SheetContentReady() {
  const markReady = useContext(SheetReadyContext);
  useEffect(() => {
    markReady?.();
  }, [markReady]);
  return null;
}
