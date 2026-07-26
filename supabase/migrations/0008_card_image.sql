-- Optional custom thumbnail shown on the homepage project cards. When null the
-- card falls back to `cover_url` (the internal hero image).
alter table public.projects
  add column if not exists card_url text;
