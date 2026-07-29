import type { HeroFont } from "@/lib/types";

/** Only allow the font `src` formats we upload — guards the injected CSS. */
const SAFE_FORMATS = new Set(["woff2", "woff", "truetype", "opentype"]);

/** Injects an `@font-face` rule for each user-uploaded font so both the
 *  homepage hero and the `/admin` editor (same root layout) can render them.
 *  Curated Google fonts are loaded separately via `next/font` in the layout. */
export function HeroFontFaces({ fonts }: { fonts: HeroFont[] }) {
  const rules = (fonts ?? [])
    .filter((f) => f.url && SAFE_FORMATS.has(f.format))
    // Drop any character that could break out of the url()/family string.
    .map((f) => {
      const url = f.url.replace(/["'\\)]/g, "");
      return `@font-face{font-family:"hf-${f.id}";src:url("${url}") format("${f.format}");font-display:swap;}`;
    });

  if (rules.length === 0) return null;
  return <style dangerouslySetInnerHTML={{ __html: rules.join("") }} />;
}
