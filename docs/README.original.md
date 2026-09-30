# Siraj Builders — Website

React single-page site for Siraj Builders, built to the brand and content
strategy in `Siraj builders.pdf`.

**Before deploying, read `TO-CONFIRM.md`.** The site ships with unverified
company details deliberately left blank, and enquiry form submissions are not
yet connected to a backend.

---

## Getting started

```bash
npm install
npm start        # dev server, http://localhost:3000
npm run build    # production build → /build
npm run lint     # eslint
```

Node 18+ recommended. Built with Create React App 5.

---

## Architecture

```
src/
├── config/
│   ├── site.js          Company details, navigation, CTAs, contact
│   └── seo.js           Per-route title/description/keywords
├── components/
│   ├── layout/          Header, Footer, Layout, ErrorBoundary, RouteLoader
│   ├── home/            HeroSlider
│   └── seo/Seo.jsx      Document head manager
├── hooks/
│   ├── useProjectForm.js  Form state, validation, submit lifecycle
│   ├── useReveal.js       Scroll-reveal IntersectionObserver
│   └── useCounters.js     Number count-up animation
├── pages/               One file per route
└── styles/              global.css + theme.css + per-page stylesheets
```

### Two kinds of page

**Config-driven.** Most pages are five-line files rendering `<ContentPage />`,
which looks up content from the `PAGES` map in `src/pages/ContentPage.jsx`
keyed on pathname. To change copy on `/grey-structure`, edit the
`"/grey-structure"` entry — not the page file.

**Bespoke.** `home.jsx`, `faq.jsx`, `consultation.jsx`,
`CommercialConstruction.jsx` and `Affiliates.jsx` have custom layouts and own
their markup, each with a matching stylesheet in `src/styles/`.

### Adding a route

1. Add the path to `src/App.jsx` (use `lazy()` — only Home is eager).
2. Add SEO to `src/config/seo.js`. Missing entries fall back to defaults.
3. Either add a `PAGES` entry and a `<ContentPage />` stub, or build a bespoke
   page.
4. Add it to `src/config/site.js` navigation so it is reachable.
5. Add it to `public/sitemap.xml`.

Step 4 matters — five routes in the previous build were unreachable because
nothing linked to them.

### Config as single source of truth

Header, footer, 404 page and sitemap all read navigation from
`src/config/site.js`. Contact details appear in one place. Previously the
phone number was hardcoded in five files, so any change meant five edits and
one of them would be missed.

`CONTACT` entries carry a `confirmed` flag. Unconfirmed details render as
plain text instead of dead `tel:`/`mailto:` links.

---

## Forms

Both enquiry forms use `useProjectForm`:

- Field-level rules via `VALIDATORS` (required, minLength, phone, email)
- Errors on blur, cleared as the user corrects
- `aria-invalid` + `aria-describedby` wiring, `role="alert"` messages
- Focus jumps to the first invalid field on failed submit
- Disabled submit with "Sending…" during flight
- Errors marked by border weight **and** text, never colour alone

`noValidate` is set so browser bubbles don't compete with in-page messages.

**Submissions are not wired to a backend.** See the marked integration point in
`useProjectForm.js`.

---

## Styling

Plain CSS with custom properties. Tokens in `src/styles/theme.css`, base and
layout in `global.css`, page-specific files imported by their page.

No CSS framework. Tailwind was in `package.json` and had a config file, but
the file containing the `@tailwind` directives was never imported — it
contributed nothing to the bundle. Removed.

`global.css` section 16 holds additions from the audit rebuild, appended so
the original cascade order is untouched.

---

## Accessibility

Implemented: skip link, visible `:focus-visible` outlines, 44×44px touch
targets on coarse pointers, `prefers-reduced-motion` honoured throughout,
carousel pause control with arrow-key navigation, inactive carousel slides
`inert` (they previously kept focusable links — a keyboard trap), accessible
form errors, `role="status"` on loading and success states, `.sr-only`
utility, `<noscript>` fallback so scroll-reveal content isn't invisible
without JavaScript.

**Not yet verified:** no screen-reader testing, no automated axe run, no
real-device testing. Colour contrast has not been measured against WCAG AA.

---

## SEO

`src/components/seo/Seo.jsx` sets per-route title, description, keywords,
robots, canonical, Open Graph, Twitter Card and `GeneralContractor` JSON-LD on
navigation. Copy comes from `src/config/seo.js`, taken from the documentation.

Structured data only emits confirmed fields — invented data in JSON-LD is a
search-quality liability.

**This is client-side rendering.** Google executes JavaScript, but other
crawlers and most social preview scrapers do not, so they see only the static
tags in `index.html`. If organic search matters, consider prerendering or
migrating to Next.js.

---

## Performance

Route-level code splitting via `React.lazy`. Only the homepage is eager.

Initial bundle: **98.13 kB JS / 10.95 kB CSS** gzipped
(was 110.44 kB / 20.93 kB).

Remaining opportunities: self-host Manrope instead of Google Fonts, replace
Unsplash hot-linking with local optimised images, add `width`/`height` to all
images to eliminate layout shift.

No Lighthouse audit has been run.

---

## Deployment

SPA — the server must rewrite all paths to `index.html`, or every route except
`/` returns a 404 on refresh.

Netlify (`public/_redirects`):
```
/*  /index.html  200
```

Vercel (`vercel.json`):
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Apache (`.htaccess`):
```
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule . /index.html [L]
```
