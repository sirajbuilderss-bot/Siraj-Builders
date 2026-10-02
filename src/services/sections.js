/**
 * SECTION SERVICE
 * ============================================================================
 * Reads and writes for public.page_sections — the table behind the visual
 * page builder in the admin panel.
 *
 * One row is one section on one page. `page_path` is the route ('/' for the
 * homepage), `position` is the render order, `is_enabled` is the on/off
 * switch. Nothing here decides who may write: database/policies.sql does,
 * through is_editor().
 *
 * The public site reads through `listForPage`, which returns enabled rows
 * only. The admin panel reads through `listAll` / `listPageMap`, which
 * return disabled rows too so they can be shown greyed out rather than
 * vanishing when an admin turns one off.
 */

import { db } from "../lib/supabase";
import DEFAULTS from "../content/defaults.json";
import { notifyPageContentUpdated } from "./pageContentEvents";

const TABLE = "page_sections";

/* ==========================================================================
 * THE PAGE REGISTRY
 * --------------------------------------------------------------------------
 * The routes an admin may attach sections to. This is a constant rather than
 * a database table on purpose: a section pointing at a route that does not
 * exist in App.jsx would render nowhere, and silently. Keeping the list in
 * code means the "Page" dropdown can only ever offer real routes.
 *
 * Adding a page to the website is therefore two steps — add the route in
 * App.jsx, add it here — and that is the intended friction.
 * ========================================================================== */

/** Every CMS-driven page, generated from database/content-source.cjs. */
export const PAGE_REGISTRY = DEFAULTS.registry;

/**
 * The section shapes an admin may choose, and what each one means in plain
 * language. The admin form uses `fields` to decide which inputs to show, so a
 * "Statistics" section is not asked for a video URL it will never render.
 */
const LOOK = ["theme"];
export const SECTION_TYPES = [
  { value: "hero", label: "Page hero", hint: "A page banner. Home’s original is the slider; duplicating it creates an editable page banner.", fields: ["eyebrow", "title", "subtitle", "body", "media_url", "cta", "cta2"], layouts: [] },
  { value: "intro", label: "Text + image", hint: "Heading and paragraphs beside an image.", fields: ["eyebrow", "title", "body", "items", "media_url", "video_url", "cta", "cta2", ...LOOK], layouts: [] },
  { value: "content", label: "Content block", hint: "Heading, paragraphs and an optional checklist, with or without an image.", fields: ["eyebrow", "title", "subtitle", "body", "items", "media_url", "video_url", "cta", "cta2", ...LOOK], layouts: [
    { value: "split", label: "Text beside image (default)" },
    { value: "checklist", label: "Checklist" },
    { value: "centered", label: "Centred text" },
    { value: "prose", label: "Long text (legal pages)" },
  ] },
  { value: "features", label: "Feature cards", hint: "A grid of numbered cards — reasons, principles, focus areas.", fields: ["eyebrow", "title", "subtitle", "body", "items", "media_url", "video_url", "cta", "cta2", ...LOOK], layouts: [
    { value: "grid", label: "Cards (default)" },
    { value: "numbered", label: "Numbered list, no boxes" },
    { value: "duo", label: "Two large statements" },
  ] },
  { value: "trust", label: "Trust strip", hint: "Four short promises in a strip (used under the homepage slider).", fields: ["items"], layouts: [] },
  { value: "process", label: "Process steps", hint: "A numbered sequence of stages.", fields: ["eyebrow", "title", "body", "items", "video_url", "cta", "cta2", ...LOOK], layouts: [
    { value: "row", label: "Cards in a row (default)" },
    { value: "timeline", label: "Vertical timeline" },
  ] },
  { value: "services", label: "Services cards", hint: "Live: published services from the Services screen.", fields: ["eyebrow", "title", "body", "cta", "cta2", "limit", ...LOOK], layouts: [] },
  { value: "projects", label: "Projects grid", hint: "Live: published projects from the Projects screen. Hidden automatically when there are none (if “hide when empty”).", fields: ["eyebrow", "title", "body", "video_url", "cta", "cta2", "limit", "category", ...LOOK], layouts: [
    { value: "grid", label: "Grid (default)" },
    { value: "portfolio", label: "Full portfolio with filters" },
  ] },
  { value: "testimonials", label: "Testimonials", hint: "Live: verified testimonials only. Hidden until one exists.", fields: ["eyebrow", "title", "body", "limit", ...LOOK], layouts: [
    { value: "grid", label: "Preview (default)" },
    { value: "full", label: "Full list with empty state" },
  ] },
  { value: "faq", label: "FAQ", hint: "Live: published FAQs. The preview shows questions ticked “Show on homepage”.", fields: ["eyebrow", "title", "body", "video_url", "cta", "cta2", "limit", ...LOOK], layouts: [
    { value: "preview", label: "Preview (default)" },
    { value: "full", label: "Full FAQ with search and topics" },
  ] },
  { value: "stats", label: "Statistics", hint: "Live: verified figures from Statistics. Hidden until one exists.", fields: ["eyebrow", "title", ...LOOK], layouts: [] },
  { value: "team", label: "Team", hint: "Live: verified people from Team. Hidden until one exists.", fields: ["eyebrow", "title", "body", ...LOOK], layouts: [] },
  { value: "cta", label: "Call to action", hint: "A closing banner with one or two buttons.", fields: ["eyebrow", "title", "body", "cta", "cta2", ...LOOK], layouts: [] },
  { value: "gallery", label: "Image gallery", hint: "Add a featured image or a set of image items. Text still displays if an image is missing.", fields: ["eyebrow", "title", "subtitle", "body", "media_url", "video_url", "items", ...LOOK], layouts: [] },
  { value: "contact", label: "Contact", hint: "Contact channel cards, or the enquiry form.", fields: ["eyebrow", "title", "body", "items", ...LOOK], layouts: [
    { value: "cards", label: "Contact cards (default)" },
    { value: "form", label: "Enquiry form" },
  ] },
  { value: "custom", label: "Custom", hint: "Every field available.", fields: ["eyebrow", "title", "subtitle", "body", "items", "media_url", "video_url", "cta", "cta2", ...LOOK], layouts: [] },
];

/**
 * Where a section's copy actually comes from.
 *
 * Most pages render through src/pages/ContentPage.jsx, which reads the
 * `pages` table — so typing into the builder's form for one of those would
 * save a row the website never reads. Rather than hide those pages from the
 * builder (leaving the admin to wonder where Leadership went) or let them
 * edit a field with no effect, each seeded row declares its source and the
 * builder sends the admin to the screen that works.
 */
export function sourceOf(section) {
  if (section?.settings?.source === "hero_slides" || (section?.page_path === "/" && section?.section_key === "hero")) {
    return {
      kind: "hero_slides",
      label: "The homepage slider",
      detail: "The slides themselves are edited on the Hero slides screen. You can still hide or move this section here.",
      to: "/admin/hero",
      linkLabel: "Open Hero slides",
      editable: true,
    };
  }
  return { kind: "builder", label: "Edited here", editable: true };
}

export function sectionTypeOf(value) {
  return SECTION_TYPES.find((type) => type.value === value) || SECTION_TYPES[0];
}

export function pageLabelOf(path) {
  return PAGE_REGISTRY.find((page) => page.path === path)?.label || path;
}

/**
 * Where a section sits on its page, in words rather than an index — "Top",
 * "Middle", "Bottom" is what an admin actually needs to know when deciding
 * whether they are editing the right thing.
 */
export function positionLabel(index, total) {
  if (total <= 1) return "Only section";
  if (index === 0) return "Top";
  if (index === total - 1) return "Bottom";
  return `Middle · ${index + 1} of ${total}`;
}

/* ==========================================================================
 * READS
 * ========================================================================== */

/** Enabled sections for one route, in render order. Used by the website. */
export async function listForPage(pagePath) {
  const { data } = await db
    .from(TABLE)
    .select("*")
    .eq("page_path", pagePath)
    .eq("is_enabled", true)
    .order("position", { ascending: true })
    .run();
  return data || [];
}

/** Every section on every page, enabled or not. Used by the admin panel. */
export async function listAll() {
  const { data } = await db
    .from(TABLE)
    .select("*")
    .order("position", { ascending: true })
    .run();
  return data || [];
}

/** Every section on one route, enabled or not, in order. */
export async function listAllForPage(pagePath) {
  const { data } = await db
    .from(TABLE)
    .select("*")
    .eq("page_path", pagePath)
    .order("position", { ascending: true })
    .run();
  return data || [];
}

/**
 * The whole site as a page → sections tree, which is what the builder's left
 * rail renders. Pages with no sections yet are still included, so an admin
 * can see that a page exists and is empty rather than wondering where it went.
 */
export async function listPageMap() {
  const rows = await listAll();

  const byPath = new Map();
  for (const page of PAGE_REGISTRY) {
    byPath.set(page.path, { ...page, sections: [] });
  }

  for (const row of rows) {
    // A section whose page_path is no longer in the registry — because a route
    // was renamed — must not disappear silently. It gets a synthetic entry so
    // the admin can see it and move it somewhere real.
    if (!byPath.has(row.page_path)) {
      byPath.set(row.page_path, {
        path: row.page_path,
        label: row.page_label || row.page_path,
        group: "Unrouted",
        orphaned: true,
        sections: [],
      });
    }
    byPath.get(row.page_path).sections.push(row);
  }

  for (const page of byPath.values()) {
    page.sections.sort((a, b) => a.position - b.position);
  }

  return Array.from(byPath.values());
}

/* ==========================================================================
 * WRITES
 * ========================================================================== */

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Finds a section_key that is free on this page. The table has a unique
 * constraint on (page_path, section_key), so duplicating "hero" has to become
 * "hero-2" rather than failing with a database error the admin cannot read.
 */
async function freeKey(pagePath, desired) {
  const base = slugify(desired) || "section";
  const existing = new Set((await listAllForPage(pagePath)).map((row) => row.section_key));
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export async function create(values) {
  const pagePath = values.page_path;
  const siblings = await listAllForPage(pagePath);

  const row = {
    ...values,
    page_label: values.page_label || pageLabelOf(pagePath),
    section_key: await freeKey(pagePath, values.section_key || values.label),
    // New sections land at the bottom, which is the only position that cannot
    // surprise an admin by pushing existing content down the page.
    position: siblings.length,
  };

  const { data } = await db.from(TABLE).insert(row).select("*").run();
  notifyPageContentUpdated();
  return Array.isArray(data) ? data[0] : data;
}

export async function update(id, patch) {
  const { data } = await db.from(TABLE).update(patch).eq("id", id).select("*").run();
  notifyPageContentUpdated();
  return Array.isArray(data) ? data[0] : data;
}

export async function remove(id) {
  await db.from(TABLE).delete().eq("id", id).run();
  notifyPageContentUpdated();
}

export function setEnabled(id, isEnabled) {
  return update(id, { is_enabled: isEnabled });
}

/** Copies a section to the bottom of its page and makes the saved copy live. */
export async function duplicate(id) {
  const { data } = await db.from(TABLE).select("*").eq("id", id).run();
  const source = data?.[0];
  if (!source) throw new Error("That section no longer exists.");

  const { id: _drop, created_at: _c, updated_at: _u, ...copy } = source;
  let values = { ...copy };

  // The homepage's first hero is a pointer to the carousel, not editable hero
  // copy. Turn its duplicate into a normal, self-contained page hero and use
  // the first live slide as its initial content.
  if (source.section_type === "hero" && source.settings?.source === "hero_slides") {
    const { data: slides } = await db
      .from("hero_slides")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .run();
    const slide = slides?.[0];
    const settings = { ...(source.settings || {}) };
    delete settings.source;
    if (slide) {
      values = {
        ...values,
        eyebrow: slide.eyebrow || "",
        title: slide.title || "",
        body: slide.lead || "",
        media_url: slide.image_url || "",
        cta_label: slide.primary_label || "",
        cta_href: slide.primary_to || "",
        settings: {
          ...settings,
          ...(slide.secondary_label ? { cta2_label: slide.secondary_label } : {}),
          ...(slide.secondary_to ? { cta2_href: slide.secondary_to } : {}),
        },
      };
    } else {
      values.settings = settings;
    }
  }

  return create({
    ...values,
    label: `${source.label || source.section_key} (copy)`,
    section_key: source.section_key,
    is_enabled: true,
  });
}

/**
 * Rewrites every position on a page in one statement.
 *
 * Falls back to per-row updates if the reorder_page_sections function is
 * missing — which happens on a database where schema.sql has been run but
 * migration-01-sections.sql has not. The fallback is slower and not atomic,
 * but it beats the reorder buttons appearing to do nothing.
 */
export async function reorder(pagePath, orderedIds) {
  try {
    await db.rpc("reorder_page_sections", {
      target_page: pagePath,
      ordered_ids: orderedIds,
    });
  } catch (error) {
    for (let i = 0; i < orderedIds.length; i += 1) {
      await update(orderedIds[i], { position: i });
    }
  }
}

/** Moves one section up or down by a single place. */
export async function move(pagePath, id, direction) {
  const rows = await listAllForPage(pagePath);
  const from = rows.findIndex((row) => row.id === id);
  if (from === -1) return rows;

  const to = direction === "up" ? from - 1 : from + 1;
  if (to < 0 || to >= rows.length) return rows;

  const next = rows.slice();
  [next[from], next[to]] = [next[to], next[from]];

  await reorder(pagePath, next.map((row) => row.id));
  return next.map((row, index) => ({ ...row, position: index }));
}

const sections = {
  PAGE_REGISTRY,
  SECTION_TYPES,
  sectionTypeOf,
  sourceOf,
  pageLabelOf,
  positionLabel,
  listForPage,
  listAll,
  listAllForPage,
  listPageMap,
  create,
  update,
  remove,
  setEnabled,
  duplicate,
  reorder,
  move,
};

export default sections;
