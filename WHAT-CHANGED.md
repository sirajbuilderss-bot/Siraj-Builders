# What changed — CMS release (October 2026)

The same Siraj Builders project, design and architecture, now fully
content-managed and checked end-to-end. Notes from the previous release
are in `docs/WHAT-CHANGED-previous-release.md`.

## Website
- **Every page is admin-managed.** The homepage and all inner pages render
  from `page_sections`; the old hard-coded `home.jsx` and `ContentPage.jsx`
  are gone. Documented defaults (from the strategy PDF) render if Supabase is
  unreachable, so the site is never blank.
- **Content now follows the documentation.** Homepage, About, Services,
  Residential, Commercial, Renovation, Process (8 stages), FAQ (all 20
  questions), Contact and Consultation use the PDF's wording. [TO CONFIRM]
  items are hidden or unpublished, never invented.
- **New pages:** `/services` (previously redirected to /projects by mistake)
  and `/testimonials`.
- **Projects:** redesigned cards (fixed 4:3 image, equal height, two-line
  summary, hover lift); portfolio filters with counts; full case-study pages
  at `/projects/<slug>` — hero, facts panel, requirement → challenge →
  solution → approach → quality → result, gallery with keyboard lightbox,
  YouTube / Vimeo / Drive / MP4 video, verified feedback, related projects,
  own SEO. Old `/project-detail?project=` links redirect.
- **Unconfirmed services** (Design & Architecture, Grey Structure, Turnkey,
  Project Management) ship unpublished and out of the menus, as the
  documentation requires.
- **FAQ page rebuilt:** topic chips, search, accessible accordion with smooth
  height animation; the uneven spacing is gone.
- **Spacing system:** one vertical rhythm (`--sx-y`) for all sections;
  same-colour neighbours merge into one band instead of doubling the gap.
- **Header/footer:** "All services" link, editable header button, documented
  footer call-to-action strip, Testimonials in the footer.
- **Contact form** now has all the documented fields (location, size, budget,
  start, service); success message and microcopy editable.
- **SEO:** title, description and share image per page from the admin;
  unpublished pages are `noindex`; regenerated `sitemap.xml`; `vercel.json`
  added for SPA routing.

## Fixed bugs
- Scroll-reveal never revealed content loaded after first paint
  (database-driven sections stayed invisible).
- The closed mobile menu cast a shadow along the right edge of every page and
  its links were still reachable with Tab.
- Admin forms pulled focus back to the first field on every keystroke.
- Admin sidebar could scroll away with the page; it is now fixed, with its
  own scroll, and the mobile drawer still works.
- Sidebar footer overlapped the page tree; builder page list clipped counts.
- Re-running the old seed duplicated every FAQ (now prevented by a unique
  index; existing duplicates are removed).
- `dashboard_counts()` answered any signed-in account, including pending ones.

## Admin panel
- **Projects:** grouped case-study form; after the first save a media
  manager appears — upload many photos at once, paste links, captions, alt
  text, reorder, set featured, delete; add/upload/reorder videos.
- **Uploads everywhere:** every image field has an *Upload* button
  (Supabase Storage bucket `site-media`, 10 MB images / 50 MB video).
- **Pages (builder):** structured list-item editor (add, edit, reorder,
  remove), background, layout, second button, limits, project-type filter;
  documentation notes shown on [TO CONFIRM] sections.
- **SEO & publishing** (replaces "Page copy"): publish/unpublish any page,
  search title/description with live preview and length counters, share
  image.
- **Lists:** ↑/↓ reordering, one-click Publish/Hide, filter tabs (e.g. FAQs
  "Needs answer"), thumbnails.
- **Rules enforced:** FAQ cannot be published without an answer; service
  cannot be published until confirmed; project feedback shows only when
  marked verified.
- **Settings:** new groups for header & navigation and forms; WhatsApp
  pre-filled message editable.
- **Dashboard:** live counts, including "FAQs awaiting an answer".

## Database
- `migration-02-cms.sql`: `project_media` table, case-study + SEO columns,
  page SEO columns, `faqs.show_on_home`, new section types, `reorder_rows()`,
  storage bucket + policies, RLS for everything new.
- `migration-03-content.sql` (generated): documented content; replaces only
  unedited seeded rows.
- `install.sql` now includes both. Full reference: `database/SCHEMA.md`.

## How this was tested
No network was available in the build environment, so `npm install` could
not run. Instead the app was bundled with esbuild and exercised in Chromium
(Playwright) against an in-memory imitation of the Supabase REST, Auth and
Storage APIs:
- Public pages at 1366, 820 and 390 px: no horizontal overflow, no runtime
  errors.
- Admin end-to-end (14 checks, all passing): sign-up, fixed sidebar, form
  focus, create project → upload photos → featured → video → publish → live
  case study, reorder, FAQ answer rules, builder item editing reflected on the
  site, SEO publish/unpublish, settings, dashboard, mobile drawer.
- TypeScript's unused-code check over all source (no unused imports or
  variables, which would fail a CI build), `npm run verify` (static + SQL)
  clean.

**Still to do on your machine:** `npm install && npm test && npm run build`
before deploying, and run the SQL against the real Supabase project — the
SQL was checked for consistency but not executed against PostgreSQL here.
