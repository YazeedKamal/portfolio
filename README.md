# Portfolio

A minimal, Apple/Google-style portfolio for a product designer.

- **Home** — hero, project card grid, testimonials, Spotlight, footer
- **`/work/[slug]`** — per-project case study (hero + text/image blocks)
- **`/play`** — an infinite, Miro-like canvas (tldraw): draw, move, add images at natural size
- **`/admin`** — sign in to upload projects, edit case studies, reorder by drag, publish
- **Dynamic Island** floating navbar · light + true-black dark mode

Built with Next.js (App Router) · TypeScript · Tailwind v4 · Framer Motion · Supabase · tldraw.

## Getting started

```bash
npm install --legacy-peer-deps
npm run dev
```

The site runs immediately with **sample content**. To enable uploads, auth, and
persistence, connect Supabase:

## Supabase setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, run the files in [`supabase/migrations`](supabase/migrations) in numerical order.
   These create the tables, row-level security, storage buckets, and seed sample content.
3. In **Authentication → Users**, add one admin user (email + password) — this is your login.
4. Copy `.env.local.example` to `.env.local` and fill in your values:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```

5. Restart the dev server. Visit `/admin` and sign in.

## How it works

- **Projects** live in the `projects` table; `content` is an ordered JSON array of
  text/image/gallery blocks rendered on the case-study page.
- **Images** upload to the `project-images` Supabase Storage bucket; public URLs are stored.
- **Spotlight** photos and videos upload to `spotlight-media` and can be edited,
  published, deleted, and reordered from `/admin/spotlight`.
- **Play** loads a shared canvas snapshot (`play_canvas` table). Visitors can freely
  draw and move things; only a signed-in admin sees **Save canvas** to update the shared state.
- Only published projects appear publicly (enforced by RLS); the admin sees drafts too.

## Deploy

Deploy to [Vercel](https://vercel.com): import the repo, add the two
`NEXT_PUBLIC_SUPABASE_*` environment variables, and ship.

Live at: https://portfolio-yazeedkamals-projects.vercel.app
