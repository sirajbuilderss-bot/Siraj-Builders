# Siraj Builders — Website + Admin Panel

React website for Siraj Builders, backed by Supabase. The public site is
database-driven; a built-in admin panel at `/admin` manages every piece of
content and every enquiry.

---

## Quick start

```bash
npm install
npm run dev              # http://localhost:3000
```

`.env` is **already filled in** with the Supabase project you supplied, so
there is nothing to configure to get the site running.

One step cannot be done for you: the database tables do not exist yet. Open
**Supabase Dashboard → SQL Editor** and run **`database/install.sql`** — it
contains all three files already joined in the correct order, so it is a
single paste. Then run **`database/verify.sql`** to confirm every table,
policy and function landed.

If you prefer to run them separately, the three source files are still there
and must go in this order:

```
database/schema.sql     →  database/policies.sql     →  database/seed.sql
```

Until you do, the site still renders — every page falls back to its built-in
static content — but the admin panel has nothing to talk to.

Then create your login by visiting **http://localhost:3000/admin/signup**.
The first account to sign up becomes the administrator. See
**Creating your admin login** below.

> **Roman Urdu guides:** setup instructions are in
> [`SETUP-GUIDE-URDU.md`](SETUP-GUIDE-URDU.md). Day-to-day instructions for
> whoever runs the site — adding projects, editing pages, exporting PDFs — are
> in [`ADMIN_GUIDE_ROMAN_URDU.md`](ADMIN_GUIDE_ROMAN_URDU.md).

> **Already have a database?** Do not re-run `install.sql`. Run
> **`database/migration-01-sections.sql`**, then
> **`database/seed-sections.sql`**, then
> **`database/seed-sections-2.sql`**. Together they add the section CMS, the
> expanded project fields and the section map for all 23 pages, without
> touching anything you have already entered.

---

## 1. Environment variables

A working `.env` ships with this project, already pointing at your Supabase
instance. You only need this section when deploying, or when switching to a
different project — in which case copy `.env.example` to `.env` and fill in
two values from **Supabase Dashboard → Project Settings → API**:

```
REACT_APP_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### A note on the prefix

This project is **Create React App**, not Vite. CRA only injects variables
prefixed `REACT_APP_` into the bundle — anything else is stripped and reads as
`undefined` at runtime.

If you already have your values written as `VITE_SUPABASE_URL` /
`VITE_SUPABASE_ANON_KEY`, paste them in anyway. `scripts/env-bridge.js` runs
automatically before `dev`, `start` and `build`, and maps the `VITE_` names to
the `REACT_APP_` names the build actually reads. Either naming works.

**Restart the dev server after editing `.env`** — CRA reads env files once at
boot.

> The anon key is *designed* to be public. It ships inside the JavaScript
> bundle and every visitor can read it. Row Level Security is what protects
> your data. Never put the `service_role` key anywhere in this project — it
> bypasses RLS completely.

---

## 2. Database setup

Open **Supabase Dashboard → SQL Editor** and run these three files **in
order**. Each one is safe to run more than once.

| # | File | What it does |
|---|---|---|
| 1 | `database/schema.sql` | 15 tables, indexes, triggers, dashboard counts, admin enrolment functions |
| 2 | `database/policies.sql` | Row Level Security — who can read and write what |
| 3 | `database/seed.sql` | Fills the tables with the site's existing content |

Paste the contents of each into the SQL Editor and press **Run**.

### Migrating an existing database

If you ran an earlier version of the schema, the three files above are still
safe to re-run, but the shorter path is:

| File | What it adds |
|---|---|
| `database/migration-01-sections.sql` | The `page_sections` table, its policies, the `reorder_page_sections()` function, and nine new columns on `projects` |
| `database/seed-sections.sql` | The section map for the eight main pages |
| `database/seed-sections-2.sql` | The section map for the remaining fifteen pages |

All are guarded — every statement is `if not exists` or
`on conflict do nothing` — so running them twice changes nothing and an
admin's edits are never overwritten.

### Repairing a dropped page_sections table

If the admin panel's Pages screen reports

```
Could not find the table 'public.page_sections' in the schema cache
```

the table has been dropped, or PostgREST is serving a stale schema cache.
Run **`database/repair-page-sections.sql`**. It is scoped to that one table —
the build script asserts it writes to nothing else — and restores all 91
sections across 23 routes, `on conflict do nothing`, so existing copy is
untouched. It ends with `notify pgrst, 'reload schema'`, which is what fixes
the cache half of the problem.

The panel itself now explains this: `diagnose()` in
`src/admin/SiteMapContext.jsx` classifies the failure and `SetupNotice`
renders the file name and the four steps, rather than showing the raw
PostgREST string.

### Keeping the generated SQL in sync

`install.sql` and `repair-page-sections.sql` are both generated. After
editing `schema.sql`, `policies.sql` or `seed.sql`, regenerate them:

```bash
npm run build:sql          # node database/build-sql.js
```

The repair file is extracted from the same sources as `install.sql`, so the
two cannot disagree. The build fails rather than emitting a file that is
missing the table, has unbalanced parentheses, or writes outside
`page_sections`.

### Checking the SQL without a database

```bash
npm run verify             # static JS checks + SQL sanity checks
npm run verify:sql         # SQL only
```

`scripts/verify-sql.js` checks dollar-quoting, quote and paren balance, that
every `INSERT`'s tuples have as many values as the statement named columns,
and that every route the page builder offers has seeded sections. It cannot
replace running the SQL against PostgreSQL — it checks structure, not
semantics.

### What the seed contains

Everything the site currently displays, extracted from the source rather than
retyped — 17 pages, 19 FAQs across 7 categories, 7 services, 4 hero slides,
13 settings keys and 4 social profiles. Seeding and switching to the database
is therefore invisible: the same words render, from a different source.

**Four tables are seeded empty on purpose** — `projects`, `testimonials`,
`team_members` and `stats`. The project documentation (`TO-CONFIRM.md`) is
explicit that no project, client quote, biography or statistic has been
verified, and that inventing them is the one thing to avoid. The relevant
pages already show designed empty states. Add real rows from the admin panel.

### Resetting the data

To wipe content and reseed from scratch (this deletes submissions too):

```sql
truncate table
  public.submissions, public.projects, public.services, public.pages,
  public.faqs, public.faq_categories, public.testimonials,
  public.team_members, public.stats, public.hero_slides,
  public.social_links, public.activity_logs
restart identity cascade;

delete from public.site_settings;
```

Then run `database/seed.sql` again.

---

## 3. Creating your admin login

Go to **http://localhost:3000/admin/signup** and create an account. That is
the whole process — no SQL, no dashboard visit.

### What actually happens

A Supabase Auth account on its own grants **nothing**. Every security policy
checks for an active row in `admin_users`, and signing up does not create one.
The database decides that, in `claim_admin_access()`:

| Situation | Outcome |
|---|---|
| No administrator exists yet | This account **becomes the administrator** |
| An administrator already exists | Account is created but left **inactive**, pending approval |

So the first sign-up owns the panel, and every sign-up after that lands in a
queue. Approve them in **Admin panel → Admin users**.

This matters more than it looks. Supabase Auth lets anyone holding the anon
key create an account, and the anon key ships inside the JavaScript bundle —
anyone can read it out of the page source. If the sign-up form itself granted
access, the panel would be open to the public. The decision is therefore made
in Postgres by a `security definer` function that assigns the role itself and
ignores anything the browser asks for. Editing the frontend, or calling the
REST API directly, cannot get around it.

> **If your Supabase project has "Confirm email" switched on**, sign-up sends
> a confirmation link first. Click it, and your access is set up automatically
> when you land back on the site. To skip that round-trip during setup, turn
> it off under **Authentication → Providers → Email**.

### Forgotten passwords

**Sign in → Forgot your password?** sends Supabase's recovery email, which
links back to `/admin/reset-password` with a single-use token. The token
arrives in the URL *fragment* — never sent to any server — and is wiped from
the address bar as soon as it is read.

Password reset emails need a working email sender. Supabase's built-in SMTP is
heavily rate-limited and is for testing only; configure your own SMTP under
**Project Settings → Authentication → SMTP Settings** before launch, or the
emails will silently stop arriving.

Also add your production URL to **Authentication → URL Configuration →
Redirect URLs**, or the links in recovery emails will be rejected.

### Roles

| Role | Can do |
|---|---|
| `admin` | Everything, including approving and managing other admin users |
| `editor` | Manage all content and submissions; cannot manage admins |
| `viewer` | Read-only — also where a pending account sits until approved |

Change roles, approve accounts, or revoke access in **Admin users**. Two
things are blocked there on purpose: you cannot demote or deactivate your own
account, and the last active admin cannot be removed. Either would lock every
human out of the panel with no way back in except hand-written SQL.

Removing someone revokes their panel access but leaves their login in Supabase
Auth. Deleting that requires the `service_role` key and is done from the
Supabase dashboard — never from this browser app.

---

## 4. Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm start` | Identical to `npm run dev` |
| `npm run build` | Production build into `/build` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the test suite (42 tests) |
| `npm run lint` | ESLint over `src/` |
| `npm run verify` | Static checks that need no dependencies installed (see below) |

There is no separate command for the admin panel. It is part of the same app,
code-split so the public bundle does not carry it — visitors never download
admin code.

### What `npm run verify` does, and does not

It runs before `npm install` has ever been executed, which is the whole point
of it — it catches the class of mistake that breaks a build loudly and is
invisible when reading a diff:

- an import pointing at a file that does not exist
- a named import the target file does not actually export
- unbalanced braces, brackets or parentheses in `.js` files
- a page-builder route with no matching route in `App.jsx`
- a package used in `src/` but missing from `package.json`
- SQL files that have lost the sections table or gained a stray parenthesis

**It is not a build, and it does not check JSX.** An apostrophe inside JSX
text — `we'll`, `Don't` — is ordinary prose, but to a tokenizer that has not
parsed the JSX tree it looks like the start of a string literal, and
everything up to the next apostrophe gets swallowed along with any braces
inside it. Telling the two apart means parsing JSX, which is Babel's job.
The script says so on every run rather than implying a clean pass means a
clean build.

Run `npm run build` before deploying. Nothing here substitutes for it.

---

## 5. Using the admin panel

Sign in at `/admin`. Four screens are reachable without a session, and no more:

| Route | Purpose |
|---|---|
| `/admin` | Sign in |
| `/admin/signup` | Create an account (first one becomes the administrator) |
| `/admin/forgot-password` | Request a password reset email |
| `/admin/reset-password` | Landing page for the link in that email |

Everything else requires an active `admin_users` row.

| Section | What you manage |
|---|---|
| **Dashboard** | Totals, unread enquiries, recent activity |
| **Page builder** | Every page and the sections it is built from — add, reorder, duplicate, hide |
| **Submissions** | Every enquiry — search, filter, read, annotate, delete, export |
| **Projects** | Portfolio case studies with full case-study fields, gallery, video, client and completion date |
| **Services** | The seven services, including the confirmed/unconfirmed flag |
| **Pages** | Copy for the 17 content-driven pages |
| **FAQs** | Questions and categories on `/faq` |
| **Testimonials** | Client quotes. Only rows marked **verified** appear publicly |
| **Team** | Profiles for `/leadership` |
| **Hero slides** | The homepage carousel |
| **Statistics** | Trust numbers on the homepage |
| **Settings** | Contact details, social links, footer, SEO |
| **Admin users** | Approve new sign-ups, set roles, revoke access |

Changes appear on the public site on the next page load.

### The page builder

`/admin/builder` is the structural view of the site: every page down the left,
the sections that page is built from down the middle, in the order a visitor
meets them.

Each section row carries its own controls — **↑ / ↓** to reorder, **Hide** to
take it off the site without deleting it, **Duplicate** to copy it, **Edit** to
change its content. Reorder writes immediately; there is no separate save.

Three details are worth knowing, because each is a deliberate choice rather
than an accident:

- **A duplicate arrives hidden.** Duplicating is almost always the first half
  of an edit, and a second identical hero appearing live mid-edit is not what
  anyone wants. Press **Show** when it is ready.
- **New sections land at the bottom.** It is the only position that cannot
  surprise an admin by pushing existing content down the page.
- **The page list is a constant in `src/services/sections.js`, not a table.**
  A section pointing at a route that does not exist in `App.jsx` would render
  nowhere, silently. Keeping `PAGE_REGISTRY` in code means the Page dropdown
  can only ever offer a real route. Adding a page is therefore two steps — the
  route in `App.jsx`, the entry in `PAGE_REGISTRY` — and that friction is the
  point. `npm run verify` checks the two stay in step.

Every editor form opens with a **Page / Section / Position** panel stating
exactly which part of the website the form is wired to. It exists so nobody
edits the wrong hero.

#### Where a section's copy actually lives

All 23 pages appear in the builder with their real sections, but they are not
all edited in the same place, and the builder says which is which rather than
pretending otherwise:

| Badge | What it means | Where you edit it |
|---|---|---|
| *(none)* | The builder owns this section's copy | Right here, **Edit** |
| **Edited on the Pages screen** | The page renders through `ContentPage.jsx`, which reads the `pages` table | The button becomes **Open Pages** |
| **Built into the page** | Bespoke markup — Commercial Construction and Affiliates | Structure is listed; copy is in the component |

Thirteen pages fall into the middle row. Their wording has always been
editable — through **Pages**, not the builder — but the builder previously
showed them as empty, which made it look as though they could not be changed
at all. Letting the builder's form save a row the website never reads would
have been worse than saying so. `sourceOf()` in
`src/services/sections.js` is what decides this, from the `settings` column
each seeded row carries.

Sections whose type pulls live data — Services list, Projects grid,
Testimonials, FAQ, Statistics, Team — take their heading and intro text from
the builder and their rows from the matching manager. There is no need, and no
way, to retype a project inside a section.

### Images and video

There is no file upload, by design — it keeps the project inside Supabase's
free tier and off its storage quota. Every image and video field takes a
**public URL**. Host the file anywhere that serves a direct link (Cloudinary,
ImgBB, Google Drive with public sharing, YouTube or Vimeo for video) and paste
the URL. Only the URL is stored.

### The "confirmed" flag

Contact details, services and social links each carry a confirmed flag, and
the site respects it:

- An unconfirmed phone number renders as **plain text**, not a dead `tel:` link
- An unconfirmed email renders as plain text, not a dead `mailto:`
- Unconfirmed WhatsApp hides the WhatsApp CTA entirely
- Unconfirmed social profiles hide the footer social row

This is deliberate. A previous build shipped `tel:+920000000000` hardcoded in
five files — dead clicks that looked functional. Fill in the real value, tick
confirmed, and the link activates itself.

---

## 6. Exporting submissions

From **Submissions**:

- **One record** — the PDF button on any row, or in the detail view
- **Filtered records** — exports exactly what the current search and filters show
- **All submissions** — ignores filters
- **Detailed PDF** — summary table plus a full page per enquiry
- **CSV** — for spreadsheets

PDFs are generated in the browser and download as real `.pdf` files. No print
dialog, no server, no PDF library — see `src/lib/pdf.js`.

---

## 7. How the site falls back

Every public page keeps its original hardcoded content as a fallback and
renders it immediately, then swaps in database values once they arrive.

Two consequences worth knowing:

1. **No loading flicker.** Pages never flash empty while waiting on Supabase.
2. **Missing credentials are not fatal.** With no `.env` at all, the site
   renders exactly as it did before any of this was added. Only the forms and
   the admin panel need the database.

`src/routes.test.js` runs in precisely that state — no credentials — and
asserts that all 26 routes render with zero console errors.

---

## 7a. Tests

```bash
npm test
```

**42 tests across two files.**

`src/routes.test.js` — 30 tests, run with **no** Supabase credentials.
Renders every route and fails on any thrown error, React warning or console
error. This is the fallback path: proof the site still works if the database
is unreachable or `.env` is missing.

`src/database.test.js` — 12 tests, run **with** credentials and a mocked
`fetch`. This is the database path. Supabase is mocked at the HTTP boundary
rather than by stubbing the service layer, so the real query builder, the real
URL construction and the real row→props converters all run. A typo in a column
name fails here. It covers:

- Hero slides, page copy, FAQs and projects rendering from database rows
- The portfolio empty state disappearing once a project exists
- `/project-detail?project=<slug>` resolving against the database
- The confirmed flag surviving the round trip — a confirmed phone becoming a
  real `tel:` link, an unconfirmed social link staying out of the footer
- Both forms INSERTing the right columns, with consultation-only fields null
  on a contact submission
- A rejected insert showing an error and **never** a false success
- Requests carrying the anon key and filtering to `is_active=eq.true`

Every fixture string in that file is deliberately absent from `src/`, so a
passing assertion can only mean the database value won — not that a hardcoded
fallback happened to match.

---

## 8. Project structure

```
database/
├── schema.sql              Tables, indexes, triggers, functions
├── policies.sql            Row Level Security
├── seed.sql                Existing site content + the section map
├── install.sql             The three above, joined — generated, not edited
├── build-install.sh        Regenerates install.sql
├── migration-01-sections.sql   Section CMS + project fields, for a live database
├── seed-sections.sql       Just the section map, for a live database
└── verify.sql              Confirms every table, policy and function landed
docs/
└── README.original.md   The README this project shipped with
scripts/
├── env-bridge.js    Maps VITE_* names to REACT_APP_* before dev/build
└── verify-static.js Dependency-free static checks — see section 4
src/
├── admin/           The admin panel (lazy-loaded, never in the public bundle)
│   ├── AdminApp.jsx           Routes, sidebar, layout
│   ├── AdminAuthContext.jsx   Session, sign-in, role checks
│   ├── components/            ResourceManager (generic CRUD) + UI primitives
│   └── pages/                 One file per admin section
├── components/      Header, Footer, HeroSlider, Seo, layout
├── config/          site.js · seo.js — static fallbacks, still authoritative
│                    for navigation order, CTA copy and legal links
├── context/
│   └── SiteDataContext.jsx    Fetches settings/socials/services once at boot
├── hooks/           useContent (fetch + fallback) · useProjectForm · useReveal
├── lib/
│   ├── supabase.js  REST + Auth client, zero dependencies
│   └── pdf.js       PDF writer, zero dependencies
├── pages/           One file per public route
├── services/        content · sections · submissions · export · activity
│                    sections.js owns PAGE_REGISTRY — the routes the page
│                    builder may attach a section to
└── styles/          theme.css · global.css · admin.css · per-page CSS
```

### Two deliberate non-dependencies

**No `@supabase/supabase-js`.** It would add ~120 kB to a 98 kB bundle for
realtime and storage features this project does not use. `src/lib/supabase.js`
is a small client over the same documented REST endpoints, and it mirrors the
SDK's call shape (`db.from("projects").select()`) so swapping to the official
SDK later means rewriting one file, not every caller.

**No `jspdf`.** ~350 kB for Helvetica text, rules and tables. `src/lib/pdf.js`
writes PDF 1.4 directly using the Standard 14 fonts, which every reader has
built in, so nothing needs embedding.

Net result: `npm install` pulls exactly what the original project pulled.

---

## 9. Deployment

Build, then serve `/build` as a static site:

```bash
npm run build
```

Set the same two environment variables in your host's dashboard. This is a
single-page app, so the server **must** rewrite all paths to `index.html` or
every route except `/` will 404 on refresh.

- **Netlify** — `public/_redirects` is already in place
- **Vercel** — `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
- **Apache** — `.htaccess` with `RewriteRule . /index.html [L]`

---

## 10. Still outstanding

`TO-CONFIRM.md` lists the business details that were never supplied — phone,
email, office address, service areas, real projects, verified testimonials,
founding history, the live domain. All of them are now editable from the admin
panel rather than in code. Nothing there needs a developer.

One pre-existing limitation, unchanged by this work: the site is
client-rendered, so social preview scrapers and non-Google crawlers see only
the static tags in `index.html`. If organic search matters, prerendering or a
move to Next.js is the fix.

### Verify this build yourself

This release was written in an environment with no network access, which means
`npm install` could not run and **the production build was never executed
here**. `npm run verify` passes clean, but as section 4 explains, that check
cannot see JSX.

Before you deploy, run:

```bash
npm install
npm run verify        # static checks
npm run build         # the real compiler
npm test              # the suite
```

If `npm run build` reports an error, it will name the file and line. Send that
output along and it can be fixed directly — do not deploy around it.

### Sections and the public pages

The section CMS is complete on the admin side: the table, the policies, the
service layer, and a builder that creates, edits, reorders, duplicates, hides
and deletes sections.

The admin panel now runs on the website's own palette. It previously used an
unrelated gold (`#b8863b`) against a near-black sidebar, which made it read as
a different product; every `--ad-*` token now derives from `theme.css`, so
changing the brand there moves the panel with it.

What the section CMS does **not** yet do is drive the public pages. The website still
renders its existing layouts, which is why nothing about the live site changes
when you install this. Wiring a page to its sections means replacing that
page's hardcoded blocks with a loop over `listForPage(path)` — page by page,
starting with the homepage, so a mistake affects one route rather than all of
them. Until then the builder is the source of truth for structure and the
pages are the source of truth for rendering, and the two are consistent
because `seed-sections.sql` was written from the live pages.
