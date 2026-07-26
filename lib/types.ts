/** How a block/column aligns horizontally within the content column. */
export type BlockAlign = "left" | "center" | "right";

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
  | { kind: "text"; heading?: string; body: string };

/** One column: a percentage width (of the row) + its content. */
export type Column = { width: number; content: ColumnContent };

/** A single fact/detail: an optional Lucide icon name + title + body. */
export type InfoItem = { icon?: string; title: string; body: string };

export type ContentBlock =
  // Centered/aligned rich text. `width` is a percent (20–100) of the column.
  | { type: "text"; heading?: string; body: string; align?: BlockAlign; width?: number }
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

export type SpotlightShape = "portrait" | "landscape" | "square" | "circle" | "polaroid";

export type SpotlightPlacement = {
  x: number;
  y: number;
  width: number;
  rotation: number;
  shape: SpotlightShape;
};

export type SpotlightLayout = {
  desktop: SpotlightPlacement;
  mobile: SpotlightPlacement;
};

export type SpotlightItem = {
  id: string;
  media_type: "image" | "video";
  media_url: string;
  title: string;
  caption: string | null;
  location: string | null;
  taken_at: string | null;
  order_index: number;
  published: boolean;
  layout: SpotlightLayout;
  created_at: string;
};

export type PlayCanvas = {
  id: string;
  snapshot: unknown;
  updated_at: string;
};

export type SiteSettings = {
  id: string;
  available_for_work: boolean;
  avatar_url: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_highlight: string | null;
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
      spotlight_items: {
        Row: SpotlightItem;
        Insert: Omit<SpotlightItem, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<SpotlightItem>;
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
