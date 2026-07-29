-- Canva-style, hand-designed hero headline.
-- `hero_title_rich`: a single JSON document describing the headline as lines of
--   per-word segments (font / weight / italic / size / color / figma effect).
--   null = fall back to the plain `hero_title` string (and its built-in default).
-- `hero_fonts`: the library of custom font files the user has uploaded, each
--   `{ id, name, url, format }`, injected as @font-face and offered in the picker.
alter table public.site_settings
  add column if not exists hero_title_rich jsonb;

alter table public.site_settings
  add column if not exists hero_fonts jsonb not null default '[]'::jsonb;

-- Custom fonts + inline SVGs upload to the same `project-images` bucket; its
-- mime whitelist (set in 0010_project_media_limit.sql) only allowed image/video,
-- so add the font types (FONT_TYPES in lib/upload-font.ts) and image/svg+xml
-- (lib/upload-svg.ts).
update storage.buckets
set allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'font/ttf',
    'font/otf',
    'font/woff',
    'font/woff2'
  ]
where id = 'project-images';
