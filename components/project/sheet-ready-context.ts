"use client";

import { createContext } from "react";

/**
 * Lets the streamed sheet content signal the sheet shell that the real
 * case study (not the skeleton) has rendered, so the shell can reveal its
 * scrollbar only once there's actual content to scroll.
 */
export const SheetReadyContext = createContext<(() => void) | null>(null);
