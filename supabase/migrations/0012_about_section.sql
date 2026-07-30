-- Editable "About" section on the homepage.
-- Everything in the About block is now customizable from /admin/settings:
--   `about_eyebrow`   : the small uppercase label (default "About").
--   `about_title`     : the headline.
--   `about_body`      : the paragraphs; blank lines separate paragraphs.
--   `about_image_url` : the large right-side photo. When null, the section
--                       falls back to the navbar avatar (`avatar_url`).
-- All null = fall back to the built-in default copy baked into the component.
alter table public.site_settings
  add column if not exists about_eyebrow text;

alter table public.site_settings
  add column if not exists about_title text;

alter table public.site_settings
  add column if not exists about_body text;

alter table public.site_settings
  add column if not exists about_image_url text;
