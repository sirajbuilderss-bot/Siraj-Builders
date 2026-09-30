import ContentPage from "./ContentPage";

/**
 * Project visibility & client reporting.
 *
 * This route previously rendered the same portfolio grid as
 * `/market-sectors`, producing two URLs with identical content while the
 * homepage teaser promised something different ("structured communication,
 * documented decisions, clearly defined responsibilities"). It now renders
 * its own content, matching what the homepage links to.
 */
export default function ProjectShowcase() {
  return <ContentPage />;
}
