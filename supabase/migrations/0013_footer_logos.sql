-- Logos for the homepage footer physics playground (Matter.js).
-- `footer_logos`: a JSON array of uploaded logos, each
--   `{ id, url, size, shape, label? }` where:
--     url   : an inline `data:image/svg+xml;base64,…` (or an image URL),
--     size  : on-screen longest edge in px,
--     shape : 'free' | 'circle' | 'square' (how it sits in the sim).
-- Managed from /admin/settings (FooterLogosManager). Empty array = only the
-- built-in geometric shapes tumble in the footer.
alter table public.site_settings
  add column if not exists footer_logos jsonb not null default '[]'::jsonb;
