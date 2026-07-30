/** How a block/column aligns horizontally within the content column. */
export type BlockAlign = "left" | "center" | "right";

/** Fixed size presets for a section heading (see `lib/heading-sizes`).
 *  `md` is the default / historical size. */
export type HeadingSize = "sm" | "md" | "lg" | "xl";

/** Media kind — gifs upload as image/gif and render as an <img> ("image");
 *  "embed" is an uploaded HTML animation rendered in a sandboxed <iframe>. */
export type MediaKind = "image" | "video" | "embed";

export type Media = {
  url: string;
  kind: MediaKind;
  caption?: string;
  /** For `embed`: the self-contained HTML markup, rendered via <iframe srcDoc>
   *  so it runs as a live animation regardless of storage content-type. */
  html?: string;
};

/** Inner content of one column in a multi-column section. `aspect` is an
 *  optional CSS aspect-ratio for the media (set by dragging the height handle;
 *  required for HTML embeds, which have no natural height). */
export type ColumnContent =
  | { kind: "media"; media: Media; aspect?: string }
  | { kind: "text"; heading?: string; headingSize?: HeadingSize; body: string };

/** One column: a percentage width (of the row) + its content. */
export type Column = { width: number; content: ColumnContent };

/** A single fact/detail: an optional Lucide icon name + title + body. */
export type InfoItem = { icon?: string; title: string; body: string };

export type ContentBlock =
  // Centered/aligned rich text. `width` is a percent (20–100) of the column.
  | { type: "text"; heading?: string; headingSize?: HeadingSize; body: string; align?: BlockAlign; width?: number }
  // A single image / video / gif. `width` is a percent (20–100) of the column;
  // `aspect` is an optional CSS aspect-ratio (e.g. "16 / 9") set by dragging the
  // resize handles — when unset the media keeps its natural height.
  | { type: "media"; media: Media; align?: BlockAlign; width?: number; aspect?: string }
  // Multi-column row (media + text, either order). Column widths are percents.
  | { type: "columns"; columns: Column[] }
  // A list of facts/details — each an optional icon + title + body. `columns`
  // controls how many columns they lay out in on wide screens (1–4).
  | { type: "info"; items: InfoItem[]; columns?: number }
  // A thin horizontal divider line.
  | { type: "divider" }
  // ---- Legacy blocks (render-only, kept for already-saved projects) ----
  | { type: "image"; url: string; caption?: string; width?: number; height?: number }
  | { type: "gallery"; images: { url: string; caption?: string }[] };

export type Project = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  cover_url: string | null;
  /** Optional custom thumbnail for the homepage card. Falls back to
   *  `cover_url` (the internal hero image) when null. */
  card_url: string | null;
  order_index: number;
  published: boolean;
  content: ContentBlock[];
  created_at: string;
};

export type Testimonial = {
  id: string;
  name: string;
  role: string | null;
  avatar_url: string | null;
  quote: string;
  order_index: number;
};

export type PlayCanvas = {
  id: string;
  snapshot: unknown;
  updated_at: string;
};

/** One word in the hand-designed hero headline, with its own styling. `id` is
 *  stable so styling survives text edits; unset fields inherit the headline
 *  defaults. `kind` is optional/"text" for backward compat with saved designs. */
export type HeroTextSegment = {
  id: string;
  kind?: "text";
  text: string;
  /** Font id from the registry: a curated Google key, or a custom font id. */
  font?: string;
  /** 400 | 500 | 600 | 700 … */
  weight?: number;
  italic?: boolean;
  /** em multiplier relative to the responsive base (≈0.5–2, default 1). */
  size?: number;
  color?: string | null;
  /** Wrap this word in the draggable Figma-selection frame. */
  figma?: boolean;
};

/** An uploaded SVG/image placed inline between words. `size` is its height as
 *  an em multiplier so it scales with the headline. */
export type HeroImageSegment = {
  id: string;
  kind: "image";
  url: string;
  alt?: string;
  size?: number;
  /** Fine vertical nudge in em (negative = up, positive = down, default 0). */
  dy?: number;
  /** Horizontal spacing on each side in em; negative tightens the gap to the
   *  neighbouring words (default 0). */
  gap?: number;
  figma?: boolean;
};

export type HeroSegment = HeroTextSegment | HeroImageSegment;

/** Narrows a segment to the image variant. */
export function isHeroImage(seg: HeroSegment): seg is HeroImageSegment {
  return seg.kind === "image";
}

/** Inline style for an inserted SVG — height, vertical nudge and side spacing.
 *  Shared so the live hero and the admin designer stay pixel-identical. */
export function heroImageStyle(seg: HeroImageSegment) {
  return {
    height: `${seg.size ?? 1}em`,
    width: "auto",
    transform: seg.dy ? `translateY(${seg.dy}em)` : undefined,
    marginLeft: seg.gap ? `${seg.gap}em` : undefined,
    marginRight: seg.gap ? `${seg.gap}em` : undefined,
  };
}

/** The hero headline as designed by hand: lines of styled word-segments, plus
 *  headline-wide spacing. Spacing fields are optional so already-saved designs
 *  fall back to the built-in Tailwind defaults (tracking-tight / leading-[1.05]). */
export type HeroRichTitle = {
  lines: HeroSegment[][];
  /** Letter spacing (tracking), in em. */
  letterSpacing?: number;
  /** Gap between words, in em (CSS word-spacing). */
  wordSpacing?: number;
  /** Line spacing as a unitless line-height multiplier. */
  lineHeight?: number;
};

/** A custom font the user uploaded — stored in the `hero_fonts` library and
 *  injected as an @font-face. */
export type HeroFont = { id: string; name: string; url: string; format: string };

/** How a footer logo sits in the physics playground:
 *  - `free`   : the SVG/PNG tumbles as-is (collision box = its bounds).
 *  - `circle` : the logo sits inside a round themed badge.
 *  - `square` : the logo sits inside a rounded-square themed badge. */
export type FooterLogoShape = "free" | "circle" | "square";

/** A logo the user uploaded for the homepage footer physics playground —
 *  stored in the `footer_logos` array on site_settings. `url` is an inline
 *  `data:` SVG (or an image URL); `size` is the on-screen longest edge in px. */
export type FooterLogo = {
  id: string;
  url: string;
  size: number;
  shape: FooterLogoShape;
  /** How many copies of this logo tumble in the footer. */
  count: number;
  label?: string;
};

export type SiteSettings = {
  id: string;
  available_for_work: boolean;
  avatar_url: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_highlight: string | null;
  hero_title_rich: HeroRichTitle | null;
  hero_fonts: HeroFont[];
  about_eyebrow: string | null;
  about_title: string | null;
  about_body: string | null;
  about_image_url: string | null;
  footer_logos: FooterLogo[];
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: Omit<Project, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Project>;
        Relationships: [];
      };
      testimonials: {
        Row: Testimonial;
        Insert: Omit<Testimonial, "id"> & { id?: string };
        Update: Partial<Testimonial>;
        Relationships: [];
      };
      play_canvas: {
        Row: PlayCanvas;
        Insert: Partial<PlayCanvas> & { id: string };
        Update: Partial<PlayCanvas>;
        Relationships: [];
      };
      site_settings: {
        Row: SiteSettings;
        Insert: Partial<SiteSettings> & { id: string };
        Update: Partial<SiteSettings>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
