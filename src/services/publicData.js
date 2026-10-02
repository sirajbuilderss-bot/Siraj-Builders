/**
 * PUBLIC DATA — cached reads for the live sections of the website.
 *
 * Several sections on one page can need the same list (a homepage projects
 * grid and a related-projects strip, for example). Requests are de-duplicated
 * and kept for a minute, so moving between pages does not re-download the
 * same rows, while an admin's change still shows up on the next visit.
 */
import { isConfigured } from "../lib/supabase";
import {
  faqs as faqService,
  projects as projectService,
  projectMedia,
  services as serviceService,
  stats as statService,
  team as teamService,
  testimonials as testimonialService,
  toProjectShape,
  toServiceCardShape,
} from "./content";
import { PAGE_CONTENT_STORAGE_KEY, PAGE_CONTENT_UPDATED } from "./pageContentEvents";
import DEFAULTS from "../content/defaults.json";

const TTL = 60 * 1000;
const cache = new Map();

const STOCK_IMAGES = {
  plans: "https://images.pexels.com/photos/15794759/pexels-photo-15794759.jpeg?auto=compress&cs=tinysrgb&w=1600",
  siteTeam: "https://images.pexels.com/photos/10202865/pexels-photo-10202865.jpeg?auto=compress&cs=tinysrgb&w=1600",
  architects: "https://images.pexels.com/photos/6285152/pexels-photo-6285152.jpeg?auto=compress&cs=tinysrgb&w=1600",
  femaleEngineer: "https://images.pexels.com/photos/8486908/pexels-photo-8486908.jpeg?auto=compress&cs=tinysrgb&w=900",
  maleBuilder: "https://images.pexels.com/photos/3931131/pexels-photo-3931131.jpeg?auto=compress&cs=tinysrgb&w=900",
  engineer: "https://images.pexels.com/photos/37556459/pexels-photo-37556459.jpeg?auto=compress&cs=tinysrgb&w=900",
};
const STOCK_CLIPS = {
  team: "https://videos.pexels.com/video-files/7825537/7825537-hd_1920_1080_30fps.mp4",
  site: "https://videos.pexels.com/video-files/5594430/5594430-uhd_3840_2160_25fps.mp4",
};
const illustrativeImage = (url, caption) => ({ url, caption: `Stock photo · ${caption}`, alt: `Stock photo · ${caption}` });
const illustrativeVideo = (url, caption) => ({ url, caption: `Pexels stock footage · ${caption}` });

export const CONCEPT_PROJECTS = [
  {
    id: "concept-courtyard-home", slug: "concept-courtyard-home", isConcept: true,
    title: "Courtyard home — concept study", category: "Residential", status: "Concept study",
    summary: "A courtyard-led home design focused on daylight, privacy and the way shared and quiet spaces connect.",
    overview: "The brief brings the main living spaces around a private courtyard, using daylight and clear circulation to connect indoors and outdoors. Shared rooms stay easy to reach while quieter areas retain a sense of separation.",
    requirement: "Create a practical home layout that connects shared living areas with quieter private rooms.",
    challenge: "Balance daylight, privacy and movement through the home without making the plan feel fragmented.",
    solution: "Arrange the principal living spaces around a central courtyard and make transitions between rooms direct and legible.",
    approach: "Start with the household's room brief, map everyday movement and review the layout before developing material choices.",
    quality: "Check the drawings against the agreed brief, coordinate decisions before work begins and keep scope changes documented.",
    result: "A considered layout direction that gives the design team a clear basis for the next planning stage.",
    features: ["Courtyard-led planning", "Daylight balanced with privacy", "Distinct shared and quiet zones", "Clear routes through the home"],
    clientName: "Design brief", serviceSlug: "residential-construction", isFeatured: false,
    image: STOCK_IMAGES.plans, banner: STOCK_IMAGES.plans,
    images: [illustrativeImage(STOCK_IMAGES.plans, "Planning discussion"), illustrativeImage("https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1600&q=80", "Contemporary home exterior"), illustrativeImage("https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=80", "Interior space"), illustrativeImage(STOCK_IMAGES.siteTeam, "Construction site activity")],
    videos: [illustrativeVideo(STOCK_CLIPS.team, "construction activity"), illustrativeVideo(STOCK_CLIPS.site, "site machinery and progress")],
  },
  {
    id: "concept-workplace", slug: "concept-workplace", isConcept: true,
    title: "Neighbourhood workplace — concept study", category: "Commercial", status: "Concept study",
    summary: "A flexible workplace layout that separates focused work, team meetings and shared daily use.",
    overview: "The layout balances quiet work zones with meeting and shared spaces, while keeping arrival and circulation straightforward. Early coordination makes services, furniture and future adjustments part of the same brief.",
    requirement: "Plan a flexible workplace for focused work, meetings and the shared routines of a small team.",
    challenge: "Fit different work styles into one legible plan and allow rooms to adapt as needs change.",
    solution: "Set out work zones, meeting rooms and service needs before the plan moves into detailed design.",
    approach: "Document how each area will be used, coordinate design and construction requirements, then confirm the scope and sequence.",
    quality: "Review the design against the brief and specifications, and keep decisions and outstanding items visible through handover.",
    result: "A workplace planning direction with clear zones, direct circulation and room for future adjustment.",
    features: ["Flexible work zones", "Clear visitor circulation", "Meeting and focus areas", "Adaptable shared spaces"],
    clientName: "Design brief", serviceSlug: "commercial-construction", isFeatured: false,
    image: STOCK_IMAGES.architects, banner: STOCK_IMAGES.architects,
    images: [illustrativeImage(STOCK_IMAGES.architects, "Reviewing a plan"), illustrativeImage("https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=80", "Workplace interior"), illustrativeImage("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80", "Commercial building exterior"), illustrativeImage(STOCK_IMAGES.siteTeam, "Construction site activity")],
    videos: [illustrativeVideo(STOCK_CLIPS.site, "site activity"), illustrativeVideo(STOCK_CLIPS.team, "workers coordinating at a site")],
  },
  {
    id: "concept-interior-renewal", slug: "concept-interior-renewal", isConcept: true,
    title: "Interior renewal — concept study", category: "Renovation", status: "Concept study",
    summary: "A room-by-room renovation plan that begins with the existing property and the changes that matter most.",
    overview: "This renovation brief begins with the current layout and how each room is used. Priorities are grouped into essential work and optional improvements, with a sequence that limits disruption and keeps finishes coordinated.",
    requirement: "Make the interior more useful while retaining the existing features that still serve the property.",
    challenge: "Separate essential repairs from optional upgrades and sequence the work around the existing building.",
    solution: "Review the rooms, agree priorities and coordinate disruptive work before final finishes are selected.",
    approach: "Record existing conditions, confirm scope room by room and keep decisions visible as the work is planned.",
    quality: "Review transitions, finish details and agreed specifications before marking each area complete.",
    result: "A clearer renovation direction, with priorities and work sequence ready for detailed scoping.",
    features: ["Existing conditions reviewed first", "Priorities agreed before scoping", "Work sequenced around daily use", "Finishes coordinated room by room"],
    clientName: "Design brief", serviceSlug: "renovation-remodelling", isFeatured: false,
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=80",
    banner: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=80",
    images: [illustrativeImage("https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=80", "Interior concept"), illustrativeImage("https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80", "Living area"), illustrativeImage(STOCK_IMAGES.plans, "Reviewing a plan"), illustrativeImage("https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1600&q=80", "Interior finishes")],
    videos: [illustrativeVideo(STOCK_CLIPS.team, "construction activity"), illustrativeVideo(STOCK_CLIPS.site, "site machinery and progress")],
  },
];
const CONCEPT_BY_SLUG = new Map(CONCEPT_PROJECTS.map((project) => [project.slug, project]));

const SAMPLE_TEAM_ROLES = [
  { id: "sample-planning", name: "Planning & coordination", role: "Scope, sequence and decisions", bio: "Translate the project brief into an agreed scope, plan the sequence of work and keep the next decision clear.", image_url: STOCK_IMAGES.femaleEngineer, isSample: true },
  { id: "sample-site", name: "Site operations", role: "Day-to-day site coordination", bio: "Coordinate activity across the work stages and keep progress communication tied to what is happening on site.", image_url: STOCK_IMAGES.maleBuilder, isSample: true },
  { id: "sample-quality", name: "Quality & handover", role: "Review and close-out", bio: "Review visible work against the agreed scope, record outstanding details and make the handover easier to follow.", image_url: STOCK_IMAGES.engineer, isSample: true },
];

function cached(key, loader) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.promise;
  const promise = loader().catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, { at: Date.now(), promise });
  return promise;
}

export function clearPublicCache() {
  cache.clear();
}

// Admin writes broadcast through the same signal used by page sections. Clear
// this module's in-memory cache too, including when the public site is open in
// a different browser tab.
if (typeof window !== "undefined") {
  window.addEventListener(PAGE_CONTENT_UPDATED, clearPublicCache);
  window.addEventListener("storage", (event) => {
    if (event.key === PAGE_CONTENT_STORAGE_KEY) clearPublicCache();
  });
}

/* ---------------- projects ---------------- */

export const getProjects = () =>
  cached("projects", async () => {
    let rows = [];
    try { rows = await projectService.listPublic(); } catch { rows = []; }
    return rows.length ? rows.map(toProjectShape) : CONCEPT_PROJECTS;
  });

/** One project with its ordered images and videos. */
export const getProjectBySlug = (slug) =>
  cached(`project:${slug}`, async () => {
    // Keep the bundled concept studies as an offline fallback, but always
    // prefer the database when it is configured so admin edits win.
    if (!isConfigured()) return CONCEPT_BY_SLUG.get(slug) || null;
    const row = await projectService.getBySlug(slug);
    if (!row) return CONCEPT_BY_SLUG.get(slug) || null;
    if (row.is_active === false) return null;
    const project = toProjectShape(row);
    let media = [];
    try {
      media = await projectMedia.listForProject(row.id);
    } catch {
      media = []; // table not installed yet — fall back to the legacy columns
    }
    const images = media.filter((m) => m.kind === "image");
    const videos = media.filter((m) => m.kind === "video");
    project.images = images.length
      ? images.map((m) => ({ url: m.url, caption: m.caption, alt: m.alt_text }))
      : project.legacyGallery.map((url) => ({ url, caption: "", alt: "" }));
    project.videos = videos.length
      ? videos.map((m) => ({ url: m.url, caption: m.caption }))
      : project.legacyVideo
      ? [{ url: project.legacyVideo, caption: "" }]
      : [];
    return project;
  });

/* ---------------- services ---------------- */

const STATIC_SERVICES = DEFAULTS.services
  .filter((s) => s.confirmed)
  .map((s) => ({
    slug: s.slug,
    to: `/${s.slug}`,
    label: s.title,
    title: s.title,
    summary: s.summary,
    image: s.image_url,
    ctaLabel: s.cta_label,
    confirmed: true,
  }));

export const getServices = () =>
  isConfigured()
    ? cached("services", async () => {
        const rows = await serviceService.listPublic();
        return rows.length ? rows.map(toServiceCardShape) : STATIC_SERVICES;
      })
    : Promise.resolve(STATIC_SERVICES);

export { STATIC_SERVICES };

/* ---------------- testimonials / stats / team ---------------- */

export const getTestimonials = () => cached("testimonials", () => testimonialService.listPublic());
export const getStats = () => cached("stats", () => statService.listPublic());
export const getTeam = () =>
  cached("team", async () => {
    let rows = [];
    try { rows = await teamService.listPublic(); } catch { rows = []; }
    return rows.length ? rows : SAMPLE_TEAM_ROLES;
  });

/* ---------------- FAQs ---------------- */

/** Documented FAQs with an answer, grouped — used when the database is empty. */
export const STATIC_FAQ_GROUPS = DEFAULTS.faqCategories
  .map((category) => ({
    key: category.key,
    label: category.label,
    items: DEFAULTS.faqs
      .filter((f) => f.category === category.key && f.is_active)
      .map((f, index) => ({ id: `${category.key}-${index}`, q: f.question, a: f.answer, home: f.show_on_home })),
  }))
  .filter((group) => group.items.length);

export const getFaqGroups = () =>
  isConfigured()
    ? cached("faqs", async () => {
        const groups = await faqService.listGrouped();
        return groups.length ? groups : STATIC_FAQ_GROUPS;
      })
    : Promise.resolve(STATIC_FAQ_GROUPS);
