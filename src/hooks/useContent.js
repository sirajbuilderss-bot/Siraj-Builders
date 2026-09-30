import { useCallback, useEffect, useRef, useState } from "react";
import { isConfigured } from "../lib/supabase";

/**
 * DATABASE CONTENT WITH A STATIC SAFETY NET
 * ============================================================================
 * The brief is emphatic that the live site must not break. Making content
 * database-driven introduces three new ways for a page to go blank that did
 * not exist when the copy was hardcoded: no credentials, network failure, or
 * an empty table.
 *
 * This hook removes all three. Every caller passes the original hardcoded
 * value as `fallback`, and that value is what renders whenever the database
 * cannot supply something better:
 *
 *   - Supabase not configured  → fallback, no request attempted
 *   - request fails            → fallback, error logged in development only
 *   - table empty              → fallback, unless `fallbackOnEmpty` is false
 *
 * `fallbackOnEmpty` is the one judgement call. For the homepage slider and
 * the FAQ, an empty table almost certainly means "not seeded yet" and falling
 * back is right. For the portfolio, empty is a real and meaningful state —
 * the page has a designed empty state for it — so that caller passes false.
 *
 * The practical effect: the site renders identically to before the migration
 * until real data exists, and keeps rendering if Supabase ever goes down.
 */
export default function useContent(
  fetcher,
  fallback,
  { fallbackOnEmpty = true, deps = [] } = {}
) {
  const [data, setData] = useState(fallback);
  const [isLoading, setIsLoading] = useState(isConfigured());
  const [error, setError] = useState(null);

  // Held in a ref so a caller passing an inline array or arrow function does
  // not retrigger the effect on every render.
  const fetcherRef = useRef(fetcher);
  const fallbackRef = useRef(fallback);
  fetcherRef.current = fetcher;
  fallbackRef.current = fallback;

  const load = useCallback(async () => {
    if (!isConfigured()) {
      setData(fallbackRef.current);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await fetcherRef.current();
      const isEmpty =
        result === null ||
        result === undefined ||
        (Array.isArray(result) && result.length === 0);

      setData(isEmpty && fallbackOnEmpty ? fallbackRef.current : result);
      setError(null);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[useContent] Falling back to static content:", err);
      }
      setData(fallbackRef.current);
      setError(err);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallbackOnEmpty, ...deps]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { data, isLoading, error, reload: load };
}
