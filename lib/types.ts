export type ContentBlock =
  | { type: "text"; heading?: string; body: string }
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
