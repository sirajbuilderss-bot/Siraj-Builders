/**
 * CONTENT SERVICE
 * ============================================================================
 * Every read and write for the content tables, in one place.
 *
 * Public reads are ordinary anon-key selects filtered by RLS to live rows.
 * Admin writes require a signed-in user with an active `admin_users` row —
 * the policies in database/policies.sql enforce that, not this file.
 *
 * Column names are snake_case (Postgres). Where the existing components
 * expect camelCase shapes, the mapper at the bottom of this file converts —
 * the public components were written before the database existed and are not
 * being rewritten to match it.
 */

import { db } from "../lib/supabase";
import { notifyPageContentUpdated } from "./pageContentEvents";

/* ==========================================================================
 * GENERIC HELPERS
 * ========================================================================== */

async function listRows(table, { activeOnly = true, activeColumn = "is_active" } = {}) {
  let query = db.from(table).select("*").order("sort_order", { ascending: true });
  if (activeOnly) query = query.eq(activeColumn, true);
  const { data } = await query.run();
  return data || [];
}

async function insertRow(table, values) {
  const { data } = await db.from(table).insert(values).select("*").run();
  notifyPageContentUpdated();
  return Array.isArray(data) ? data[0] : data;
}

async function updateRow(table, id, patch) {
  const { data } = await db.from(table).update(patch).eq("id", id).select("*").run();
  notifyPageContentUpdated();
  return Array.isArray(data) ? data[0] : data;
}

async function deleteRow(table, id) {
  await db.from(table).delete().eq("id", id).run();
  notifyPageContentUpdated();
}

/**
 * Rewrites sort_order for a whole list in one call (reorder_rows() in
 * migration-02-cms.sql). Falls back to one update per row if the function
 * has not been installed yet, so the arrows never silently do nothing.
 */
export async function reorderRows(table, orderedIds) {
  try {
    await db.rpc("reorder_rows", { target_table: table, ordered_ids: orderedIds });
  } catch (error) {
    if (!/reorder_rows|function/i.test(error?.message || "")) throw error;
    for (let i = 0; i < orderedIds.length; i += 1) {
      await db.from(table).update({ sort_order: i }).eq("id", orderedIds[i]).run();
    }
  }
  notifyPageContentUpdated();
}

/* ==========================================================================
 * PROJECTS
 * ========================================================================== */

export const projects = {
  /** Live projects in the order set by the admin. */
  async listPublic() {
    const { data } = await db
      .from("projects")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .run();
    return data || [];
  },
  listAll: () => listRows("projects", { activeOnly: false }),

  async getBySlug(slug) {
    const { data } = await db.from("projects").select("*").eq("slug", slug).run();
    return data?.[0] || null;
  },

  create: (values) => insertRow("projects", values),
  update: (id, patch) => updateRow("projects", id, patch),
  remove: (id) => deleteRow("projects", id),
  setActive: (id, isActive) => updateRow("projects", id, { is_active: isActive }),
  reorder: (ids) => reorderRows("projects", ids),
};

/* ==========================================================================
 * PROJECT MEDIA  (images + videos, many per project)
 * ========================================================================== */

export const projectMedia = {
  async listForProject(projectId) {
    const { data } = await db
      .from("project_media")
      .select("*")
      .eq("project_id", projectId)
      .order("kind", { ascending: true })
      .order("sort_order", { ascending: true })
      .run();
    return data || [];
  },
  create: (values) => insertRow("project_media", values),
  update: (id, patch) => updateRow("project_media", id, patch),
  remove: (id) => deleteRow("project_media", id),
  reorder: (ids) => reorderRows("project_media", ids),
};

/* ==========================================================================
 * SERVICES
 * ========================================================================== */

export const services = {
  listPublic: () => listRows("services"),
  reorder: (ids) => reorderRows("services", ids),
  listAll: () => listRows("services", { activeOnly: false }),
  create: (values) => insertRow("services", values),
  update: (id, patch) => updateRow("services", id, patch),
  remove: (id) => deleteRow("services", id),
};

/* ==========================================================================
 * PAGES
 * ========================================================================== */

export const pages = {
  async listPublic() {
    const { data } = await db
      .from("pages")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .run();
    return data || [];
  },

  listAll: () =>
    listRows("pages", { activeOnly: false }).then((rows) => rows),

  async getByPath(path) {
    const { data } = await db.from("pages").select("*").eq("path", path).run();
    return data?.[0] || null;
  },

  create: (values) => insertRow("pages", values),
  update: (id, patch) => updateRow("pages", id, patch),
  remove: (id) => deleteRow("pages", id),
};

/* ==========================================================================
 * FAQ
 * ========================================================================== */

export const faqs = {
  async listCategories({ activeOnly = true } = {}) {
    return listRows("faq_categories", { activeOnly });
  },

  async listQuestions({ activeOnly = true } = {}) {
    let query = db.from("faqs").select("*").order("sort_order", { ascending: true });
    if (activeOnly) query = query.eq("is_active", true);
    const { data } = await query.run();
    return data || [];
  },

  /** Categories with their questions nested — the shape faq.jsx renders. */
  async listGrouped({ activeOnly = true } = {}) {
    const [categories, questions] = await Promise.all([
      faqs.listCategories({ activeOnly }),
      faqs.listQuestions({ activeOnly }),
    ]);
    return categories
      .map((category) => ({
        key: category.key,
        label: category.label,
        id: category.id,
        items: questions
          .filter((question) => question.category_id === category.id)
          .map((question) => ({
            id: question.id,
            q: question.question,
            a: question.answer,
            home: Boolean(question.show_on_home),
          })),
      }))
      .filter((group) => group.items.length > 0);
  },

  reorder: (ids) => reorderRows("faqs", ids),
  reorderCategories: (ids) => reorderRows("faq_categories", ids),

  createCategory: (values) => insertRow("faq_categories", values),
  updateCategory: (id, patch) => updateRow("faq_categories", id, patch),
  removeCategory: (id) => deleteRow("faq_categories", id),

  create: (values) => insertRow("faqs", values),
  update: (id, patch) => updateRow("faqs", id, patch),
  remove: (id) => deleteRow("faqs", id),
};

/* ==========================================================================
 * TESTIMONIALS
 *
 * The public list requires is_verified as well as is_active. The client
 * documentation is explicit that only verified testimonials may appear, so
 * "published" is deliberately two flags rather than one — an admin cannot
 * make an unverified quote live by accident.
 * ========================================================================== */

export const testimonials = {
  async listPublic() {
    const { data } = await db
      .from("testimonials")
      .select("*")
      .eq("is_active", true)
      .eq("is_verified", true)
      .order("sort_order", { ascending: true })
      .run();
    return data || [];
  },

  listAll: () => listRows("testimonials", { activeOnly: false }),
  create: (values) => insertRow("testimonials", values),
  update: (id, patch) => updateRow("testimonials", id, patch),
  remove: (id) => deleteRow("testimonials", id),
  reorder: (ids) => reorderRows("testimonials", ids),
};

/* ==========================================================================
 * TEAM
 * ========================================================================== */

export const team = {
  listPublic: () => listRows("team_members"),
  listAll: () => listRows("team_members", { activeOnly: false }),
  create: (values) => insertRow("team_members", values),
  update: (id, patch) => updateRow("team_members", id, patch),
  remove: (id) => deleteRow("team_members", id),
  reorder: (ids) => reorderRows("team_members", ids),
};

/* ==========================================================================
 * STATS
 * ========================================================================== */

export const stats = {
  listPublic: () => listRows("stats"),
  listAll: () => listRows("stats", { activeOnly: false }),
  create: (values) => insertRow("stats", values),
  update: (id, patch) => updateRow("stats", id, patch),
  remove: (id) => deleteRow("stats", id),
  reorder: (ids) => reorderRows("stats", ids),
};

/* ==========================================================================
 * HERO SLIDES
 * ========================================================================== */

export const heroSlides = {
  listPublic: () => listRows("hero_slides"),
  listAll: () => listRows("hero_slides", { activeOnly: false }),
  create: (values) => insertRow("hero_slides", values),
  update: (id, patch) => updateRow("hero_slides", id, patch),
  remove: (id) => deleteRow("hero_slides", id),
  reorder: (ids) => reorderRows("hero_slides", ids),
};

/* ==========================================================================
 * SOCIAL LINKS
 * ========================================================================== */

export const socialLinks = {
  listPublic: () => listRows("social_links"),
  listAll: () => listRows("social_links", { activeOnly: false }),
  create: (values) => insertRow("social_links", values),
  update: (id, patch) => updateRow("social_links", id, patch),
  remove: (id) => deleteRow("social_links", id),
};

/* ==========================================================================
 * SITE SETTINGS  (key/value)
 * ========================================================================== */

export const settings = {
  async listAll() {
    const { data } = await db
      .from("site_settings")
      .select("*")
      .order("group_name", { ascending: true })
      .order("sort_order", { ascending: true })
      .run();
    return data || [];
  },

  /** Rows keyed by `key`, for lookup by consuming components. */
  async map() {
    const rows = await settings.listAll();
    return rows.reduce((acc, row) => ({ ...acc, [row.key]: row }), {});
  },

  async update(key, patch) {
    const { data } = await db
      .from("site_settings")
      .update(patch)
      .eq("key", key)
      .select("*")
      .run();
    if (Array.isArray(data) && data.length) {
      notifyPageContentUpdated();
      return data[0];
    }
    const inserted = await db
      .from("site_settings")
      .insert({ key, ...patch })
      .select("*")
      .run();
    notifyPageContentUpdated();
    return Array.isArray(inserted.data) ? inserted.data[0] : inserted.data;
  },

  /** Saves several settings in one pass. */
  async updateMany(entries) {
    const results = [];
    for (const [key, patch] of Object.entries(entries)) {
      results.push(await settings.update(key, patch));
    }
    return results;
  },
};

/* ==========================================================================
 * ADMIN USERS
 *
 * The roster screen. Only a full admin can read or write this table — see
 * `admin_users_admin_all` in database/policies.sql — so an editor or a
 * pending account calling `listAll` gets an empty result rather than a leak.
 *
 * There is no `create` here on purpose. Rows arrive exactly one way: someone
 * signs up, `claim_admin_access()` files them as inactive, and an admin flips
 * `is_active` below. That keeps account creation in Supabase Auth's hands,
 * where the password hashing and email confirmation live.
 * ========================================================================== */

export const adminUsers = {
  async listAll() {
    const { data } = await db
      .from("admin_users")
      .select("*")
      .order("is_active", { ascending: true })
      .order("created_at", { ascending: false })
      .run();
    return data || [];
  },

  update: (id, patch) => updateRow("admin_users", id, patch),

  /**
   * Removes panel access. The Supabase Auth user is untouched — deleting
   * that needs the service_role key and belongs in the Supabase dashboard,
   * not in a browser bundle. Without a row here the account can sign in and
   * see nothing, which is the intended end state.
   */
  remove: (id) => deleteRow("admin_users", id),

  setActive: (id, isActive) => updateRow("admin_users", id, { is_active: isActive }),

  /** Enrols the signed-in user: first one becomes owner, rest go pending. */
  claimAccess: (fullName = "") =>
    db.rpc("claim_admin_access", { full_name: fullName }),

  /** True once someone owns the panel. Used to word the sign-up screen. */
  anyExists: () => db.rpc("admin_exists"),
};

/* ==========================================================================
 * DASHBOARD
 * ========================================================================== */

export async function dashboardCounts() {
  return db.rpc("dashboard_counts");
}

/* ==========================================================================
 * SHAPE MAPPERS
 * Database rows → the shapes the existing public components already expect.
 * ========================================================================== */

/** hero_slides row → the SLIDES shape in HeroSlider.jsx */
export function toSlideShape(row, index) {
  return {
    id: row.id || index,
    eyebrow: row.eyebrow,
    title: row.title,
    lead: row.lead,
    image: row.image_url,
    primary: { to: row.primary_to, label: row.primary_label },
    secondary: { to: row.secondary_to, label: row.secondary_label },
    titleTag: index === 0 ? "h1" : "h2",
  };
}

/** pages row → the PAGES entry shape in ContentPage.jsx */
export function toPageShape(row) {
  return {
    eyebrow: row.eyebrow,
    title: row.title,
    intro: row.intro,
    image: row.image_url,
    heading: row.heading,
    body: row.body,
    points: Array.isArray(row.points) ? row.points : [],
    motif: row.motif || undefined,
  };
}

/** projects row → the shape the portfolio and case-study pages render */
export function toProjectShape(row) {
  const list = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    location: row.location,
    status: row.status,
    year: row.year,
    area: row.area,
    timeline: row.timeline || "",
    scope: row.scope || "",
    image: row.image_url || row.banner_url || "",
    banner: row.banner_url || row.image_url || "",
    summary: row.short_description || row.summary || "",
    overview: row.full_description || "",
    requirement: row.requirement,
    challenge: row.challenge,
    solution: row.solution,
    approach: row.approach || "",
    quality: row.quality || "",
    result: row.result,
    features: list(row.features),
    tags: list(row.tags),
    clientName: row.client_name || "",
    feedback: row.feedback_verified ? row.client_feedback || "" : "",
    serviceSlug: row.service_slug || "",
    isFeatured: Boolean(row.is_featured),
    completionDate: row.completion_date || "",
    seoTitle: row.seo_title || "",
    seoDescription: row.seo_description || "",
    legacyGallery: list(row.gallery),
    legacyVideo: row.video_url || "",
  };
}

/** site_settings rows → the CONTACT shape in config/site.js */
export function toContactShape(settingsMap) {
  const pick = (key, fallbackDisplay) => {
    const row = settingsMap[key];
    if (!row) return { value: "", display: fallbackDisplay, confirmed: false };
    return {
      value: row.value || "",
      display: row.display || fallbackDisplay,
      confirmed: Boolean(row.is_confirmed && row.value),
    };
  };
  return {
    phone: pick("contact_phone", "Phone number to be confirmed"),
    whatsapp: pick("contact_whatsapp", "WhatsApp number to be confirmed"),
    email: pick("contact_email", "Email address to be confirmed"),
    address: pick("contact_address", "Office address to be confirmed"),
    hours: pick("contact_hours", "Business hours to be confirmed"),
  };
}

/** social_links rows → the SOCIAL_PROFILES shape in config/site.js */
export function toSocialShape(rows) {
  return rows.map((row) => ({
    key: row.key,
    label: row.label,
    href: row.href || "",
    confirmed: Boolean(row.is_confirmed && row.href),
  }));
}

/** services rows → the SERVICE_LINKS shape in config/site.js */
export function toServiceLinkShape(rows) {
  return rows
    .filter((row) => row.show_in_nav)
    .map((row) => ({
      to: row.path,
      label: row.label,
      confirmed: Boolean(row.is_confirmed),
    }));
}

/** services rows → the card shape used by the Services section */
export function toServiceCardShape(row) {
  return {
    slug: row.slug,
    to: row.path,
    label: row.label,
    title: row.title || row.label,
    summary: row.summary,
    image: row.image_url,
    ctaLabel: row.cta_label || `Explore ${row.label}`,
    confirmed: Boolean(row.is_confirmed),
  };
}

const content = {
  projects,
  projectMedia,
  reorderRows,
  services,
  pages,
  faqs,
  testimonials,
  team,
  stats,
  heroSlides,
  socialLinks,
  settings,
  adminUsers,
  dashboardCounts,
};

export default content;
