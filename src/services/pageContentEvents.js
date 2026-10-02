/** Shared signal for admin content writes and mounted public pages. */
export const PAGE_CONTENT_UPDATED = "sb:page-content-updated";
export const PAGE_CONTENT_STORAGE_KEY = "sb.page-content.updated";

export function notifyPageContentUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PAGE_CONTENT_UPDATED));
  try {
    window.localStorage.setItem(PAGE_CONTENT_STORAGE_KEY, String(Date.now()));
  } catch {
    // Storage can be unavailable; same-tab updates still use the event above.
  }
}
