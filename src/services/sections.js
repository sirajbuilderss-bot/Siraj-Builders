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

export const PAGE_REGISTRY = [
  { path: "/", label: "Home", group: "Main" },
  { path: "/who-we-are", label: "About", group: "Main" },
  { path: "/services", label: "Services", group: "Main" },
  { path: "/projects", label: "Projects", group: "Main" },
  { path: "/our-process", label: "Our Process", group: "Main" },
  { path: "/faq", label: "FAQ", group: "Main" },
  { path: "/contact-us", label: "Contact", group: "Main" },
  { path: "/consultation", label: "Consultation", group: "Main" },

  { path: "/residential-construction", label: "Residential Construction", group: "Services" },
  { path: "/commercial-construction", label: "Commercial Construction", group: "Services" },
  { path: "/renovation-remodelling", label: "Renovation & Remodelling", group: "Services" },
  { path: "/design-architecture", label: "Design & Architecture", group: "Services" },
  { path: "/grey-structure", label: "Grey Structure", group: "Services" },
  { path: "/turnkey-construction", label: "Turnkey Construction", group: "Services" },
  { path: "/project-management", label: "Project Management", group: "Services" },

  { path: "/leadership", label: "Leadership", group: "Company" },
  { path: "/locations", label: "Locations", group: "Company" },
  { path: "/international", label: "International", group: "Company" },
  { path: "/affiliates", label: "Affiliates", group: "Company" },
  { path: "/subcontractors", label: "Subcontractors", group: "Company" },
  { path: "/role-definition", label: "Role Definition", group: "Company" },
  { path: "/cost-index", label: "Cost Index", group: "Company" },
  { path: "/project-showcase", label: "Project Showcase", group: "Company" },
];

/**
 * The section shapes an admin may choose, and what each one means in plain
 * language. The admin form uses `fields` to decide which inputs to show, so a
 * "Statistics" section is not asked for a video URL it will never render.
 */
export const SECTION_TYPES = [
  {
    value: "hero",
    label: "Hero",
    hint: "The large banner at the top of a page.",
    fields: ["eyebrow", "title", "subtitle", "body", "media_url", "cta"],
  },
  {
    value: "intro",
    label: "Introduction",
    hint: "A short opening passage below the hero.",
    fields: ["eyebrow", "title", "body", "cta"],
  },
  {
    value: "content",
    label: "Content block",
    hint: "General heading, text and optional bullet points.",
    fields: ["eyebrow", "title", "subtitle", "body", "items", "media_url", "cta"],
  },
  {
    value: "services",
    label: "Services list",
    hint: "Pulls live rows from the Services manager.",
    fields: ["eyebrow", "title", "body", "cta"],
  },
  {
    value: "projects",
    label: "Projects grid",
    hint: "Pulls live rows from the Projects manager.",
    fields: ["eyebrow", "title", "body", "cta"],
  },
  {
    value: "testimonials",
    label: "Testimonials",
    hint: "Pulls live rows from the Testimonials manager.",
    fields: ["eyebrow", "title", "body"],
  },
  {
    value: "faq",
    label: "FAQ",
    hint: "Pulls live rows from the FAQ manager.",
    fields: ["eyebrow", "title", "body", "cta"],
  },
  {
    value: "stats",
    label: "Statistics",
    hint: "Pulls live rows from the Statistics manager.",
    fields: ["eyebrow", "title", "body"],
  },
  {
    value: "process",
    label: "Process steps",
    hint: "A numbered sequence of stages.",
    fields: ["eyebrow", "title", "body", "items", "cta"],
  },
  {
    value: "team",
    label: "Team",
    hint: "Pulls live rows from the Team manager.",
    fields: ["eyebrow", "title", "body", "cta"],
  },
  {
    value: "cta",
    label: "Call to action",
    hint: "A closing panel that asks the visitor to act.",
    fields: ["eyebrow", "title", "body", "cta"],
  },
  {
    value: "gallery",
    label: "Gallery",
    hint: "A row of images from external URLs.",
    fields: ["eyebrow", "title", "body", "items"],
  },
  {
    value: "contact",
    label: "Contact",
    hint: "Contact details or an enquiry form.",
    fields: ["eyebrow", "title", "body", "cta"],
  },
  {
    value: "custom",
    label: "Custom",
    hint: "Every field available, for anything the other types do not cover.",
    fields: ["eyebrow", "title", "subtitle", "body", "items", "media_url", "video_url", "cta"],
  },
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
  const source = section?.settings?.source;
  if (source === "pages") {
    return {
      kind: "pages",
      label: "Edited on the Pages screen",
      detail: "This page renders from the pages table, so its wording is managed there.",
      to: "/admin/pages",
      linkLabel: "Open Pages",
      editable: false,
    };
  }
  if (source === "page") {
    return {
      kind: "code",
      label: "Built into the page",
      detail: "This section has bespoke markup. Its structure is listed here; the copy lives in the page component.",
      editable: false,
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
  return Array.isArray(data) ? data[0] : data;
}

export async function update(id, patch) {
  const { data } = await db.from(TABLE).update(patch).eq("id", id).select("*").run();
  return Array.isArray(data) ? data[0] : data;
}

export async function remove(id) {
  await db.from(TABLE).delete().eq("id", id).run();
}

export function setEnabled(id, isEnabled) {
  return update(id, { is_enabled: isEnabled });
}

/**
 * Copies a section to the bottom of the same page, disabled.
 *
 * Disabled is deliberate: a duplicate is almost always the first half of an
 * edit, and appearing live on the website mid-edit as a second identical hero
 * is not what anyone wants.
 */
export async function duplicate(id) {
  const { data } = await db.from(TABLE).select("*").eq("id", id).run();
  const source = data?.[0];
  if (!source) throw new Error("That section no longer exists.");

  const { id: _drop, created_at: _c, updated_at: _u, ...copy } = source;

  return create({
    ...copy,
    label: `${source.label || source.section_key} (copy)`,
    section_key: source.section_key,
    is_enabled: false,
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
