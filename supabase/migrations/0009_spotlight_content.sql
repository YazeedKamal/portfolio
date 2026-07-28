-- Fully editable Spotlight section content (intro + ordered/toggleable blocks).
-- Stored as a single JSON document; null = use the built-in default content.
alter table public.site_settings
  add column if not exists spotlight_content jsonb;
