import type { HeroFont } from "@/lib/types";

/** The curated Google-font set offered in the hero headline designer. Each id
 *  maps to a CSS variable loaded via `next/font/google` in `app/layout.tsx`.
 *  This module stays framework-agnostic (no next/font import) so it is safe to
 *  import from client components. */
export type HeroFontCategory = "sans" | "serif" | "display" | "script" | "mono";

export type HeroFontDef = {
  id: string;
  label: string;
  category: HeroFontCategory;
  cssVar: string;
  /** Whether this font ships an italic style (drives the italic toggle). */
  italic: boolean;
};

/** `id: "default"` means "no override" — inherit the site's default font. */
export const HERO_FONTS: HeroFontDef[] = [
  { id: "sans", label: "Inter", category: "sans", cssVar: "--font-hero-sans", italic: true },
  { id: "serif", label: "Playfair Display", category: "serif", cssVar: "--font-hero-serif", italic: true },
  { id: "grotesk", label: "Space Grotesk", category: "sans", cssVar: "--font-hero-grotesk", italic: false },
  { id: "display", label: "Bebas Neue", category: "display", cssVar: "--font-hero-display", italic: false },
  { id: "script", label: "Caveat", category: "script", cssVar: "--font-hero-script", italic: false },
  { id: "mono", label: "JetBrains Mono", category: "mono", cssVar: "--font-hero-mono", italic: true },
];

/** Resolves a segment's `font` id to a CSS `font-family` value, or `undefined`
 *  to inherit the default. Curated fonts resolve to their CSS variable; custom
 *  uploads resolve to their injected `@font-face` family. */
export function heroFontFamily(
  fontId: string | undefined | null,
  customFonts: HeroFont[] = [],
): string | undefined {
  if (!fontId || fontId === "default") return undefined;
  const curated = HERO_FONTS.find((f) => f.id === fontId);
  if (curated) return `var(${curated.cssVar})`;
  const custom = customFonts.find((f) => f.id === fontId);
  if (custom) return `"hf-${custom.id}"`;
  return undefined;
}

/** Human label for a font id — curated label, custom name, or "Default". */
export function heroFontLabel(
  fontId: string | undefined | null,
  customFonts: HeroFont[] = [],
): string {
  if (!fontId || fontId === "default") return "Default";
  return (
    HERO_FONTS.find((f) => f.id === fontId)?.label ??
    customFonts.find((f) => f.id === fontId)?.name ??
    "Default"
  );
}

/** Whether the italic toggle applies to this font id (curated flag; custom
 *  fonts are assumed to have no separate italic and use synthetic slant). */
export function heroFontHasItalic(
  fontId: string | undefined | null,
): boolean {
  if (!fontId || fontId === "default") return true;
  return HERO_FONTS.find((f) => f.id === fontId)?.italic ?? true;
}
