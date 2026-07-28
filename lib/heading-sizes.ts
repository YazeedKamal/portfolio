import type { HeadingSize } from "@/lib/types";

// Fixed size presets a section heading can be set to. `md` is the default and
// matches the historical heading size, so existing content is untouched.
export const HEADING_SIZE_KEYS: HeadingSize[] = ["sm", "md", "lg", "xl"];
export const DEFAULT_HEADING_SIZE: HeadingSize = "md";

// Short labels shown in the size toolbar.
export const HEADING_SIZE_LABELS: Record<HeadingSize, string> = {
  sm: "S",
  md: "M",
  lg: "L",
  xl: "XL",
};

// Tailwind classes for the builder canvas (its heading type runs larger).
export const HEADING_SIZE_EDITOR: Record<HeadingSize, string> = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
};

// Tailwind classes for the rendered page/sheet. `md` = the previous default.
export const HEADING_SIZE_RENDER: Record<HeadingSize, string> = {
  sm: "text-sm sm:text-base",
  md: "text-base sm:text-lg",
  lg: "text-xl sm:text-2xl",
  xl: "text-2xl sm:text-3xl",
};

export const editorHeadingSize = (size?: HeadingSize) =>
  HEADING_SIZE_EDITOR[size ?? DEFAULT_HEADING_SIZE];

export const renderHeadingSize = (size?: HeadingSize) =>
  HEADING_SIZE_RENDER[size ?? DEFAULT_HEADING_SIZE];
