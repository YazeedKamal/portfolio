-- ============================================================
-- Portfolio schema — run this in the Supabase SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ---------- Tables ----------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  subtitle    text,
  cover_url   text,
  order_index int  not null default 0,
  published   bool not null default false,
  content     jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists public.testimonials (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role        text,
  avatar_url  text,
  quote       text not null,
  order_index int  not null default 0
);

create table if not exists public.play_canvas (
  id         text primary key default 'main',
  snapshot   jsonb,
  updated_at timestamptz not null default now()
);

-- Ensure the single shared canvas row exists
insert into public.play_canvas (id, snapshot)
values ('main', null)
on conflict (id) do nothing;

-- ---------- Row Level Security ----------
alter table public.projects     enable row level security;
alter table public.testimonials enable row level security;
alter table public.play_canvas  enable row level security;

-- Public can read published projects
drop policy if exists "public read published projects" on public.projects;
create policy "public read published projects"
  on public.projects for select
  using ( published = true );

-- Authenticated (admin) can read everything, including drafts
drop policy if exists "admin read all projects" on public.projects;
create policy "admin read all projects"
  on public.projects for select to authenticated
  using ( true );

drop policy if exists "admin write projects" on public.projects;
create policy "admin write projects"
  on public.projects for all to authenticated
  using ( true ) with check ( true );

-- Testimonials: public read, admin write
drop policy if exists "public read testimonials" on public.testimonials;
create policy "public read testimonials"
  on public.testimonials for select using ( true );

drop policy if exists "admin write testimonials" on public.testimonials;
create policy "admin write testimonials"
  on public.testimonials for all to authenticated
  using ( true ) with check ( true );

-- Play canvas: public read, admin write
drop policy if exists "public read canvas" on public.play_canvas;
create policy "public read canvas"
  on public.play_canvas for select using ( true );

drop policy if exists "admin write canvas" on public.play_canvas;
create policy "admin write canvas"
  on public.play_canvas for all to authenticated
  using ( true ) with check ( true );

-- ---------- Storage buckets ----------
insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Public read on both buckets
drop policy if exists "public read images" on storage.objects;
create policy "public read images"
  on storage.objects for select
  using ( bucket_id in ('project-images', 'avatars') );

-- Authenticated write/update/delete on both buckets
drop policy if exists "admin upload images" on storage.objects;
create policy "admin upload images"
  on storage.objects for insert to authenticated
  with check ( bucket_id in ('project-images', 'avatars') );

drop policy if exists "admin modify images" on storage.objects;
create policy "admin modify images"
  on storage.objects for update to authenticated
  using ( bucket_id in ('project-images', 'avatars') );

drop policy if exists "admin delete images" on storage.objects;
create policy "admin delete images"
  on storage.objects for delete to authenticated
  using ( bucket_id in ('project-images', 'avatars') );

-- ---------- Optional: seed sample content ----------
insert into public.projects (slug, title, subtitle, cover_url, order_index, published, content)
values
  ('aurora-banking', 'Aurora — Banking Reimagined',
   'A calm, trustworthy mobile banking experience.',
   'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80', 0, true,
   '[{"type":"text","heading":"Overview","body":"Aurora rethinks everyday banking around clarity and calm. The product strips away noise so people can act with confidence."},{"type":"image","url":"https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1600&q=80","caption":"Home dashboard"}]'::jsonb),
  ('lumen-design-system', 'Lumen Design System',
   'Scalable design language for a fast-growing product suite.',
   'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&q=80', 1, true,
   '[{"type":"text","heading":"The problem","body":"Five teams, five visual languages. Lumen unifies them into one accessible, themeable system."}]'::jsonb),
  ('nomad-travel', 'Nomad — Travel Companion',
   'Planning trips should feel like the trip itself.',
   'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600&q=80', 2, true,
   '[{"type":"text","heading":"Concept","body":"An itinerary that breathes — flexible, visual, and joyful to build."}]'::jsonb)
on conflict (slug) do nothing;

insert into public.testimonials (name, role, quote, order_index)
values
  ('Sarah Chen', 'VP Product, Northwind', 'One of the sharpest product thinkers I''ve worked with. Ships taste and rigor in equal measure.', 0),
  ('Miguel Torres', 'Founder, Layer', 'Turned a vague idea into a product our users genuinely love. Rare blend of craft and speed.', 1),
  ('Aisha Rahman', 'Design Director, Vela', 'Every detail considered, nothing precious. Exactly the kind of designer teams fight to keep.', 2)
on conflict do nothing;
