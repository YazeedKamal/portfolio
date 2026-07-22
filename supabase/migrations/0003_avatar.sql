-- Profile avatar shown in the navbar, editable from the admin dashboard
alter table public.site_settings
  add column if not exists avatar_url text;
