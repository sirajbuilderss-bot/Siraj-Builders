import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import sections from "../services/sections";

/**
 * SITE MAP
 * ============================================================================
 * One shared load of "every page, and the sections on it", consumed by both
 * the sidebar tree and the page builder.
 *
 * WHY A CONTEXT RATHER THAN A FETCH IN EACH SCREEN
 * ------------------------------------------------
 * The sidebar is permanently mounted and the builder is one route inside it.
 * If each fetched its own copy, every visit to /admin/builder would pull the
 * same rows twice, and — worse — saving a section in the builder would leave
 * the sidebar showing the old label until a full page reload. Sharing one
 * cache means `refresh()` after a save updates both at once.
 *
 * FAILURE IS NOT FATAL
 * --------------------
 * If the query fails — most likely because migration-01-sections.sql has not
 * been run on this database yet — `error` is set and `pages` falls back to
 * the registry with empty section lists. The sidebar then still lists every
 * page (they are defined in code, not in the database), the tree simply has
 * nothing to expand into, and the rest of the panel is unaffected. An admin
 * losing the whole navigation because one table is missing would be a far
 * worse outcome than a tree that is temporarily thin.
 */

const SiteMapContext = createContext(null);

/** The registry with no sections attached — the shape used before the first
 *  load resolves, and after a load that failed. */
function emptyMap() {
  return sections.PAGE_REGISTRY.map((page) => ({ ...page, sections: [] }));
}

/**
 * Turns a failure into something an admin can act on.
 *
 * PostgREST answers a request for a table it cannot see with
 * "Could not find the table 'public.page_sections' in the schema cache",
 * which is accurate and completely useless to the person reading it: it does
 * not say what page_sections is, why it is missing, or what to do. It also
 * has two quite different causes that need different fixes —
 *
 *   · the table was never created, or has been dropped
 *   · the table exists but PostgREST is still serving a stale schema cache
 *
 * — and the same file fixes both, so the message names it.
 */
export function diagnose(error) {
  const raw = error?.message || String(error || "");

  if (/schema cache|does not exist|42P01|relation .* does not exist/i.test(raw) &&
      /page_sections/i.test(raw)) {
    return {
      title: "The page_sections table is missing from the database",
      detail:
        "This is the table that stores every section of every page. Without it the Pages screen has nothing to show.",
      fix: "repair-page-sections.sql",
      raw,
    };
  }

  if (/JWT|permission denied|401|403/i.test(raw)) {
    return {
      title: "The database refused this request",
      detail:
        "Your sign-in may have expired, or this account may no longer have editor rights. Signing out and back in is the usual fix.",
      raw,
    };
  }

  if (/fetch|network|Failed to fetch|timeout/i.test(raw)) {
    return {
      title: "Could not reach the database",
      detail:
        "Check your internet connection, and that the Supabase project is running and not paused.",
      raw,
    };
  }

  return {
    title: "The page map could not be loaded",
    detail: raw || "No reason was given.",
    raw,
  };
}

export function SiteMapProvider({ children }) {
  const [pages, setPages] = useState(emptyMap);
  const [loading, setLoading] = useState(true);
  /** null when healthy; otherwise the object diagnose() returned. */
  const [error, setError] = useState(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const map = await sections.listPageMap();
      if (!alive.current) return map;
      setPages(map);
      setError(null);
      return map;
    } catch (err) {
      if (alive.current) {
        setPages(emptyMap());
        setError(diagnose(err));
      }
      return null;
    } finally {
      if (alive.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /* Pages grouped the way the registry declares, preserving registry order
     within each group. Both the sidebar and the builder rail render this. */
  const grouped = useMemo(() => {
    const out = new Map();
    for (const page of pages) {
      const group = page.group || "Other";
      if (!out.has(group)) out.set(group, []);
      out.get(group).push(page);
    }
    return Array.from(out.entries());
  }, [pages]);

  const value = useMemo(
    () => ({
      pages,
      grouped,
      loading,
      error,
      refresh,
      /** One page by route, or undefined. */
      pageAt: (path) => pages.find((page) => page.path === path),
      /** Total sections across the site, used for the sidebar badge. */
      total: pages.reduce((sum, page) => sum + page.sections.length, 0),
    }),
    [pages, grouped, loading, error, refresh]
  );

  return <SiteMapContext.Provider value={value}>{children}</SiteMapContext.Provider>;
}

export function useSiteMap() {
  const value = useContext(SiteMapContext);
  if (!value) {
    throw new Error("useSiteMap must be used inside <SiteMapProvider>.");
  }
  return value;
}

export default SiteMapContext;
