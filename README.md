# Siraj Builders — Static Website

A static HTML / CSS / JavaScript construction website using the Siraj Builders
brand palette, built around **one shared header and one shared footer**.

---

## ⚠️ Run it through a local server

The shared header and footer are loaded with `fetch()`. Browsers block `fetch()`
on `file://` URLs, so **opening `index.html` by double-clicking will show a red
error banner instead of the header**. That is expected.

From this folder:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

Any static server works — `npx serve`, `php -S localhost:8000`, VS Code Live
Server, Netlify, Vercel, GitHub Pages, cPanel, Nginx, Apache. No build step.

---

## Project structure

```text
SirajBuilders/
│
├── index.html                    homepage (hero slider)
├── our-process.html              how a project runs, stage by stage
├── turnkey-construction.html     service page
├── residential-construction.html
├── commercial-construction.html
├── renovation-remodelling.html
├── design-architecture.html
├── grey-structure.html
├── project-management.html
├── who-we-are.html               about
├── leadership.html
├── role-definition.html
├── subcontractors.html
├── affiliates.html
├── international.html
├── market-sectors.html           projects (filterable)
├── project-showcase.html         project visibility dashboard page
├── locations.html
├── cost-index.html               cost estimator
├── faq.html                      19 FAQs, search + category filter
├── consultation.html             enquiry form
├── contact-us.html               contact form
├── privacy-policy.html
├── terms.html
│
├── layout/                       ◀ SINGLE SOURCE OF TRUTH
│   ├── header.html               edit once → updates every page
│   └── footer.html               edit once → updates every page
│
├── assets/
│   ├── style.css                 shared: tokens, buttons, header, footer,
│   │                             page hero, forms, FAQ, grids, responsive
│   ├── include.js                loads the two layout partials
│   ├── app.js                    all shared behaviour
│   ├── css/<page>.css            page-specific styles only
│   └── js/<page>.js              page-specific scripts only
│
├── commitments/                  safety, sustainability, ethics, DEI,
│                                 community, innovation, ESG
├── pages/                        policies & disclosures, company foundation
└── uploads/                      human rights policy, supplier diversity
```

---

## How the shared layout works

Every page contains only two placeholders:

```html
<div data-include="header"></div>
  ...page content...
<div data-include="footer"></div>
```

`assets/include.js` fetches `layout/header.html` and `layout/footer.html`,
injects them, then dispatches `siraj:layout-ready`. `assets/app.js` and any
page script bind their handlers on that event, so everything attaches to the
real markup.

### Paths

Links inside the two layout files are written with a `{{base}}` token:

```html
<a href="{{base}}who-we-are.html">About</a>
```

`include.js` derives the correct prefix from its own script URL — `""` at the
root, `"../"` inside `commitments/`, and so on. No root-relative `/layout/...`
paths are used, so the site works in a subdirectory too.

### Editing the header or footer

Edit `layout/header.html` or `layout/footer.html`. That is the only place.
Do **not** paste header or footer markup into individual pages.

### Active navigation

Resolved at runtime from the filename. A page can override which nav item
lights up:

```html
<body data-page="market-sectors.html">
```

Service pages automatically highlight the **Services** dropdown.

---

## Brand palette

| Token           | Hex       | Use                       |
| --------------- | --------- | ------------------------- |
| `--brand-ink`   | `#212A31` | primary dark              |
| `--brand-slate` | `#2E3944` | secondary dark            |
| `--brand-teal`  | `#124E66` | active / open states      |
| `--brand-sage`  | `#748D92` | muted accents             |
| `--brand-mist`  | `#D3D9D4` | light surfaces            |
| `--brand-paper` | `#FFFFFF` | base                      |

Defined in `assets/style.css` under section 0.

---

## Honest status — read before launch

These are deliberate placeholders, not oversights:

- **Forms do not send anything.** `assets/js/project-form.js` validates on the
  front end, shows a loading state, then displays a success panel that says
  plainly that nothing was transmitted. Replace `sendToBackend()` with a real
  `fetch()` to your endpoint or email service to go live.
- **Contact details are placeholders** — `+92 000 0000000`,
  `info@sirajbuilders.com`, `Address — to confirm`. Set them in
  `layout/header.html` and `layout/footer.html`.
- **Projects, testimonials and statistics are temporary mock content.** Replace
  with verified company information.
- **Cost estimator figures are indicative ranges**, not quotations.
- **Images load from Unsplash CDN URLs.** Swap in approved Siraj Builders
  photography before launch; every `<img>` already has descriptive alt text.
- **No company-specific claims** (years in business, certifications, awards,
  project counts) have been invented.

---

## Accessibility notes

- Skip-to-content link on every page
- Visible focus rings (`:focus-visible`)
- Dropdowns and accordions expose `aria-expanded`; accordions also use
  `aria-controls` / `role="region"` and support Enter, Space, Escape and
  arrow-key navigation
- Mobile drawer traps scroll and closes on Escape
- `prefers-reduced-motion` disables the slider autoplay, hero zoom and reveals

---

## Testing performed

Run in headless Chromium against `http://localhost:8000`:

- 35 / 35 pages — shared header and footer injected, no console errors, no
  failed local requests, no horizontal overflow
- 36 / 36 interaction checks — dropdowns, mobile drawer, hero slider, FAQ
  accordion and search, form validation, project filters, cost estimator,
  back-to-top, scroll reveals, counters
- Overflow verified at 1920, 1440, 1280, 1024, 834, 768, 430, 390 and 320 px
- Layout propagation verified: a single edit to `layout/header.html` appeared
  on root pages and on pages one folder deep
