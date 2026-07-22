-- Editable hero headline + subtitle (null = use the built-in default copy)
alter table public.site_settings
  add column if not exists hero_title text,
  add column if not exists hero_subtitle text;
