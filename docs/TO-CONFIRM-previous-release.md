# TO CONFIRM BEFORE LAUNCH

The project documentation ends with a section titled *Missing Information
Required From Siraj Builders*. Those items have not been supplied, and the
documentation is explicit that they must not be invented:

> Do not fill these with invented numbers.
> Repeat only for verified projects.
> No invented history should be added.
> Only verified testimonials should appear here.

**What Siraj Builders should avoid:** *"Fake numbers... Empty claims such as
'Pakistan's #1'... Unverified guarantees about cost or completion dates."*

So the site ships with these gaps visible and honestly handled rather than
papered over. Every item below has a defined home in the codebase. Fill it in
and the UI updates itself — no component changes needed.

---

## 1. Contact details — `src/config/site.js` → `CONTACT`

| Item | Currently | Effect while unconfirmed |
|---|---|---|
| Phone | `confirmed: false` | Renders as text, not a `tel:` link |
| WhatsApp | `confirmed: false` | WhatsApp CTA hidden entirely |
| Email | `confirmed: false` | Renders as text, not a `mailto:` link |
| Office address | `confirmed: false` | Row shown as pending |
| Business hours | `confirmed: false` | Not displayed |

```js
phone: { value: "+92 300 1234567", display: "", confirmed: true },
```

The previous build had `tel:+920000000000` and `info@sirajbuilders.com`
hardcoded in five places. Those were dead clicks that looked functional —
a visitor tapping the number on mobile would have dialled nothing.

**Also removes the invented office.** The footer previously stated
"Lahore, Punjab, Pakistan". No location appears anywhere in the documentation;
service areas are listed as *"[TO CONFIRM — critical SEO information]"*.

## 2. Service confirmation — `src/config/site.js` → `SERVICE_LINKS`

The documentation marks four of seven services `[TO CONFIRM]` and says the
Design & Architecture page *"should remain unpublished until the service is
confirmed"*.

Currently flagged `confirmed: false`: Design & Architecture, Grey Structure,
Turnkey Construction, Project Management.

They are still routed and linked — flipping the flag is what you do once
confirmed. If a service is **not** offered, remove its entry from
`SERVICE_LINKS`, its route in `src/App.jsx`, its `PAGES` entry in
`src/pages/ContentPage.jsx`, and its `sitemap.xml` line.

The documentation also asks the site to distinguish services delivered
directly from those delivered through external partners. Not yet represented.

## 3. Portfolio — `src/pages/ContentPage.jsx` → `PROJECTS`

**The array is deliberately empty.** The page renders a documented empty state.

The old version shipped four invented projects ("Contemporary Family
Residence", "Modern Workplace Fit-out") illustrated with Unsplash stock — the
exact thing the documentation warns against: *"generic stock photography as
primary proof"* and *"Do not create a gallery consisting only of pretty
images."*

Per project, the documentation requires: name, location, type, area, year,
status, scope, client requirement, challenge, solution, construction details,
photography, result. Use the `PROJECT_SHAPE` template in the same file. Put
photography in `public/projects/`.

`/project-detail?project=<slug>` now 404s on unknown slugs instead of
title-casing the query string into a fake case study.

## 4. Testimonials — not yet built

No testimonials section exists, because there are no verified testimonials.
The documentation specifies the format (quote, client name, project type,
location) and lists what to ask clients about: communication, quality, site
management, professionalism, responsiveness, problem-solving, final result.

Collect real ones, then the section can be built.

## 5. Trust signals — homepage

The homepage stats band ("12+ project categories", "7 project experience
principles") has been replaced with the seven documented brand pillars, which
are positioning rather than unverifiable metrics.

Per the documentation's *Recommended Trust Elements*, genuine proof to add
once available: company registration, PEC registration, ABAD membership,
actual project count, years in operation, team credentials, real project
photography, Google Business reviews, client logos where permission exists.

Competitors already display NTN and PEC information prominently — worth
matching once verified.

## 6. Company story & leadership

`/who-we-are` and `/leadership` carry approach-level copy only. The
documentation requires founding year, why it was founded, how it developed,
milestones and current direction — plus founder/director names and verified
biographies. None supplied.

## 7. Location & SEO — `src/config/seo.js` → `LOCATION_TOKEN`

Every documented keyword is `[keyword] [LOCATION]`. The token is empty, so no
city is baked into any title. Set it once and all page titles update:

```js
export const LOCATION_TOKEN = " in Lahore";
```

Without this, the site cannot rank for local intent — the documentation calls
service areas *critical SEO information*.

## 8. Domain — `src/config/site.js` → `SITE_URL`

Currently `https://www.sirajbuilders.com`, a placeholder. It drives canonical
tags, Open Graph URLs and JSON-LD. **Also update `public/sitemap.xml` and
`public/robots.txt`,** which contain the same domain literally.

## 9. Social profiles — `src/config/site.js` → `SOCIAL_PROFILES`

All `confirmed: false`, so the footer social row is hidden. The previous build
linked to `facebook.com`, `instagram.com`, `linkedin.com` and `youtube.com` —
the platforms' homepages, not Siraj Builders' profiles.

## 10. Form backend — `src/hooks/useProjectForm.js`

Forms validate fully client-side but **submissions currently go nowhere.**
There is a single marked integration point:

```js
/* ---- BACKEND INTEGRATION POINT ---- */
```

Until it is wired, every enquiry is lost. The success message tells the
visitor their details were received, so **this must be connected before
launch.**

The documentation lists consultation process, site visit process, quotation
process, payment structure, project reporting, warranty/aftercare and material
procurement model as all `[TO CONFIRM]` — these shape what happens after
submission.

## 11. FAQ answers

`src/pages/faq.jsx` answers generically where the documentation says
`[TO CONFIRM]` — 14 of the 20 documented questions, including: do you provide
site visits, can you construct a complete house, do you handle finishing work,
can I provide my own materials, how are payments structured, how do clients
receive updates, who supervises the project, which areas do you serve.

These are the questions buyers actually ask. Generic answers on payment terms
and supervision undercut the brand's core claim of transparency.

## 12. Imagery

All photography is hot-linked from Unsplash. Two problems: it is generic stock
used as proof of work, and it makes the site dependent on a third-party CDN.

Replace with real project photography in `public/`, then add `width`/`height`
attributes to prevent layout shift.
