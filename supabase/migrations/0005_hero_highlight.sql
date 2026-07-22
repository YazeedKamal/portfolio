-- Word (or phrase) inside the hero title that gets the Figma-selection effect
alter table public.site_settings
  add column if not exists hero_highlight text;
