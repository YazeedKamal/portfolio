"use client";

import { createContext } from "react";

/**
 * Lets content inside the sheet (e.g. the outro's "View all" link) dismiss the
 * sheet with its normal slide-down animation, optionally scrolling the homepage
 * to a target element id once the sheet is gone (instead of restoring the
 * scroll position the sheet was opened at). Null outside the routed sheet
 * (e.g. the admin preview), where dismissing doesn't apply.
 */
export const SheetCloseContext = createContext<((targetId?: string) => void) | null>(
  null,
);
