/**
 * Loading state shown while a lazily-loaded route chunk is fetched.
 * `role="status"` + `aria-live` announce the wait to screen readers
 * instead of leaving them on a silent, apparently-empty page.
 */
export default function RouteLoader() {
  return (
    <div className="route-loader" role="status" aria-live="polite">
      <span className="route-loader-spinner" aria-hidden="true" />
      <span className="sr-only">Loading page…</span>
    </div>
  );
}
