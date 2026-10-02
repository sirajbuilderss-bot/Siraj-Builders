/**
 * PAGE CONTENT
 * ============================================================================
 * The flow the brief asks for:
 *
 *   ADMIN PANEL → SUPABASE (page_sections, pages) → THIS CONTEXT → PAGES
 *
 * One request loads every enabled section on the site and one loads the page
 * registry (publish switch + SEO). Both are small, both are cached in
 * localStorage, so a returning visitor sees the page instantly while a fresh
 * copy loads in the background, and navigation between pages costs nothing.
 *
 * Fallback rules — the site never goes blank:
 *   - Supabase not configured / unreachable  → documented defaults
 *     (src/content/defaults.json, generated from database/content-source.cjs)
 *   - A page whose database rows still come from the previous release
 *     (settings.source = 'pages' | 'page') → documented defaults for that page
 *   - A database row with an empty list or empty image → that one field is
 *     filled from the matching documented section, so a half-migrated row
 *     still renders properly
 */

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { db, isConfigured } from "../lib/supabase";
import DEFAULTS from "../content/defaults.json";
import { PAGE_CONTENT_UPDATED, PAGE_CONTENT_STORAGE_KEY } from "../services/pageContentEvents";

const PageContentContext = createContext(null);
const CACHE_KEY = "sb.content.v2";
const CACHE_TTL = 1000 * 60 * 60 * 24; // a day; always revalidated anyway

export const PAGE_DEFAULTS = DEFAULTS.pages;

/** Database row → the section shape the renderer uses. */
function fromRow(row) {
  return {
    id: row.id,
    key: row.section_key,
    label: row.label,
    type: row.section_type,
    eyebrow: row.eyebrow || "",
    title: row.title || "",
    subtitle: row.subtitle || "",
    body: row.body || "",
    items: Array.isArray(row.items)
      ? row.items.map((item) =>
          typeof item === "string" ? { title: item, body: "", image: "" } : { title: "", body: "", image: "", ...item }
        )
      : [],
    media_url: row.media_url || "",
    video_url: row.video_url || "",
    cta_label: row.cta_label || "",
    cta_href: row.cta_href || "",
    settings: row.settings && typeof row.settings === "object" ? row.settings : {},
    enabled: row.is_enabled !== false,
  };
}

/** Fill blank list/image/settings fields from the documented section. */
function withDefaults(section, fallback) {
  if (!fallback) return section;
  return {
    ...section,
    items: section.settings?.editor_overrides?.items
      ? section.items
      : section.items.length ? section.items : fallback.items,
    media_url: section.settings?.editor_overrides?.media_url
      ? section.media_url
      : section.media_url || fallback.media_url,
    video_url: section.settings?.editor_overrides?.video_url
      ? section.video_url
      : section.video_url || fallback.video_url || "",
    settings: { ...fallback.settings, ...section.settings },
  };
}

function isLegacy(rows) {
  return rows.some((row) => ["pages", "page"].includes(row.settings?.source));
}

function readCache() {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.at > CACHE_TTL) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(value) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ ...value, at: Date.now() }));
  } catch {
    /* storage full or blocked — the cache is an optimisation only */
  }
}

async function fetchAll() {
  const [sectionRes, pageRes] = await Promise.all([
    db
      .from("page_sections")
      .select("*")
      .eq("is_enabled", true)
      .order("page_path", { ascending: true })
      .order("position", { ascending: true })
      .run(),
    db.from("pages").select("*").run(),
  ]);
  return { sections: sectionRes.data || [], pages: pageRes.data || [] };
}

export function PageContentProvider({ children }) {
  const configured = isConfigured();
  const cached = configured ? readCache() : null;
  const [remote, setRemote] = useState(cached);
  const [status, setStatus] = useState(
    !configured ? "static" : cached ? "cached" : "loading"
  );

  useEffect(() => {
    if (!configured) return undefined;
    let cancelled = false;
    // Never leave the visitor waiting on a slow network: after 4s render the
    // documented content and let the real data replace it when it arrives.
    const timer = window.setTimeout(() => {
      if (!cancelled) setStatus((current) => (current === "loading" ? "static" : current));
    }, 4000);

    const refresh = () =>
      fetchAll()
        .then((value) => {
          if (cancelled) return;
          setRemote(value);
          setStatus("live");
          writeCache(value);
        })
        .catch((error) => {
          if (cancelled) return;
          if (process.env.NODE_ENV !== "production") {
            console.warn("[PageContent] Using documented defaults:", error?.message);
          }
          setStatus((current) => (current === "cached" ? "cached" : "static"));
        });
    const onStorage = (event) => {
      if (event.key === PAGE_CONTENT_STORAGE_KEY) refresh();
    };

    refresh().finally(() => window.clearTimeout(timer));
    window.addEventListener(PAGE_CONTENT_UPDATED, refresh);
    window.addEventListener("storage", onStorage);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener(PAGE_CONTENT_UPDATED, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, [configured]);

  const value = useMemo(() => {
    const byPath = new Map();
    for (const row of remote?.sections || []) {
      if (!byPath.has(row.page_path)) byPath.set(row.page_path, []);
      byPath.get(row.page_path).push(row);
    }
    const pageRows = new Map((remote?.pages || []).map((row) => [row.path, row]));
    // migration-03 gives every pages row a label; before that the table only
    // held the old copy rows, so a missing row must not mean "unpublished".
    const registryLive = (remote?.pages || []).some((row) => row.label);
    const hasSections = byPath.size > 0;

    function sectionsFor(path) {
      const fallback = PAGE_DEFAULTS[path];
      const fallbackSections = (fallback?.sections || []).filter((s) => s.enabled);
      const rows = byPath.get(path);

      if (!hasSections || !rows || isLegacy(rows)) {
        // A database that has sections for other pages but none for this one
        // means the admin hid them all — respect that, unless the page is
        // simply new in this release (no legacy, not migrated).
        if (hasSections && registryLive && !rows) return [];
        return fallbackSections;
      }
      const defaultsByKey = new Map((fallback?.sections || []).map((s) => [s.key, s]));
      return rows.map((row) => {
        const section = fromRow(row);
        return {
          ...withDefaults(section, defaultsByKey.get(section.key)),
          isCustom: !defaultsByKey.has(section.key),
        };
      });
    }

    function metaFor(path) {
      const fallback = PAGE_DEFAULTS[path];
      const row = pageRows.get(path);
      // Routes outside the registry (a project case study) are always live.
      let published = true;
      if (row) published = row.is_published !== false;
      else if (fallback) published = registryLive ? false : fallback.published !== false;
      return {
        label: row?.label || fallback?.label || "",
        published,
        seoTitle: row?.seo_title || fallback?.seo?.title || "",
        seoDescription: row?.seo_description || fallback?.seo?.description || "",
        ogImage: row?.og_image || "",
      };
    }

    return {
      status,
      isReady: status !== "loading",
      sectionsFor,
      metaFor,
    };
  }, [remote, status]);

  return <PageContentContext.Provider value={value}>{children}</PageContentContext.Provider>;
}

function staticMeta(path) {
  const fallback = PAGE_DEFAULTS[path];
  return {
    label: fallback?.label || "",
    published: fallback ? fallback.published !== false : true,
    seoTitle: fallback?.seo?.title || "",
    seoDescription: fallback?.seo?.description || "",
    ogImage: "",
  };
}

/** Sections + meta for one route. Works outside the provider (tests). */
export function usePageContent(path) {
  const context = useContext(PageContentContext);
  if (!context) {
    const fallback = PAGE_DEFAULTS[path];
    return {
      isReady: true,
      sections: (fallback?.sections || []).filter((s) => s.enabled),
      meta: staticMeta(path),
    };
  }
  return {
    isReady: context.isReady,
    sections: context.isReady ? context.sectionsFor(path) : [],
    meta: context.metaFor(path),
  };
}

export function usePageMeta(path) {
  const context = useContext(PageContentContext);
  return context ? context.metaFor(path) : staticMeta(path);
}

export default PageContentContext;
