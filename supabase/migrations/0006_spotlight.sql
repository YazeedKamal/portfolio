create table if not exists public.spotlight_items (
  id uuid primary key default gen_random_uuid(),
  media_type text not null check (media_type in ('image', 'video')),
  media_url text not null,
  title text not null default '',
  caption text,
  location text,
  taken_at date,
  order_index integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.spotlight_items enable row level security;

drop policy if exists "public read published spotlight" on public.spotlight_items;
create policy "public read published spotlight"
  on public.spotlight_items for select
  using (published = true);

drop policy if exists "admin read all spotlight" on public.spotlight_items;
create policy "admin read all spotlight"
  on public.spotlight_items for select to authenticated
  using (true);

drop policy if exists "admin write spotlight" on public.spotlight_items;
create policy "admin write spotlight"
  on public.spotlight_items for all to authenticated
  using (true) with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'spotlight-media',
  'spotlight-media',
  true,
  104857600,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read spotlight media" on storage.objects;
create policy "public read spotlight media"
  on storage.objects for select
  using (bucket_id = 'spotlight-media');

drop policy if exists "admin upload spotlight media" on storage.objects;
create policy "admin upload spotlight media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'spotlight-media');

drop policy if exists "admin update spotlight media" on storage.objects;
create policy "admin update spotlight media"
  on storage.objects for update to authenticated
  using (bucket_id = 'spotlight-media')
  with check (bucket_id = 'spotlight-media');

drop policy if exists "admin delete spotlight media" on storage.objects;
create policy "admin delete spotlight media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'spotlight-media');
