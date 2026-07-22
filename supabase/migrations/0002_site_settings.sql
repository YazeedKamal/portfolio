-- Site-wide settings (single row), editable from the admin dashboard
create table if not exists public.site_settings (
  id                 text primary key default 'main',
  available_for_work bool not null default true,
  updated_at         timestamptz not null default now()
);

insert into public.site_settings (id) values ('main')
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "public read settings" on public.site_settings;
create policy "public read settings"
  on public.site_settings for select using ( true );

drop policy if exists "admin write settings" on public.site_settings;
create policy "admin write settings"
  on public.site_settings for all to authenticated
  using ( true ) with check ( true );
