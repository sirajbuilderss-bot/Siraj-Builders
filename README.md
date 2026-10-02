# Siraj Builders — Website + Admin Panel (CMS release)

A React website for Siraj Builders, backed by Supabase, with a built-in admin
panel at `/admin`. **Every page is now content-managed**:

```
Admin panel  →  Supabase  →  website
```

Content follows the Siraj Builders strategy document (`Siraj builders.pdf`).
Nothing marked **[TO CONFIRM]** in that document is published as fact — those
items exist in the admin panel, switched off, waiting for real information
(see `TO-CONFIRM.md`).

---

## 1. Set up the database (once)

Open **Supabase Dashboard → SQL Editor → New query**.

| Your situation | Run |
|---|---|
| New / empty Supabase project | `database/install.sql` (everything, one paste) |
| You already ran an earlier `install.sql` | `database/migration-02-cms.sql`, then `database/migration-03-content.sql` |

Both routes are safe to re-run. Migration 03 replaces only seeded rows that
nobody has edited, so admin changes are kept. The full schema, with every
table, key, index, relationship and policy, is in **`database/SCHEMA.md`**.

Then open `/admin/signup` — the **first** account becomes the owner. Later
accounts wait for the owner to approve them (Admin users).

## 2. Run locally

```bash
npm install
npm start                # http://localhost:3000
npm test                 # unit + route tests
npm run verify           # static + SQL consistency checks
```

`.env` holds `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`
(see `.env.example`). Only the public *anon* key belongs in the frontend.

## 3. Deploy

```bash
npm run build            # → build/
```

Works on Netlify, Vercel or any static host:

- Set the two `REACT_APP_SUPABASE_*` environment variables in the host's
  dashboard.
- Single-page-app routing is already handled (`public/_redirects` for
  Netlify, `vercel.json` for Vercel) so `/projects/<slug>` and `/admin`
  work on refresh.
- In **Supabase → Authentication → URL Configuration**, set the Site URL to
  your live domain and add `https://<domain>/admin/reset-password` to the
  redirect URLs (needed for password-reset emails).
- In **Admin → Settings → SEO**, set the site URL to your live domain
  (used for canonical links and share previews).

## 4. What the admin manages

| Screen | Controls |
|---|---|
| **Pages** (section builder) | Every section of every page: text, list items, images, buttons, background, layout, order, show/hide |
| **SEO & publishing** | Which pages are live; search title, description and share image per page |
| **Hero slides** | The homepage slider (first slide = homepage H1) |
| **Projects** | Full case studies + photo/video manager (upload, reorder, featured, captions) |
| **Services** | Service cards, menu links, confirm-before-publish |
| **FAQs** | Questions, answers, topics, homepage preview, order |
| **Testimonials / Team / Statistics** | Verified items only; their sections stay hidden while empty |
| **Settings** | Contact details (confirm before they become links), header/footer buttons, WhatsApp message, form messages |
| **Submissions** | Contact + consultation enquiries, status, notes, CSV/PDF export |

Images and videos can be **uploaded** (Supabase Storage bucket `site-media`,
created by migration 02) or pasted as links.

## 5. Where things live

```
src/content/defaults.json      documented content (generated — do not edit)
database/content-source.cjs    ← edit documented defaults here, then
                                  `npm run build:sql`
src/context/PageContentContext loads sections + page settings, caches, falls back
src/components/sections/       one component per section type
src/pages/SectionPage.jsx      renders any CMS page
src/pages/project-detail.jsx   /projects/:slug case study
src/admin/                     the admin panel
database/                      SQL + SCHEMA.md
```

If Supabase is unreachable the website still renders the documented content,
so it never shows a blank page.
