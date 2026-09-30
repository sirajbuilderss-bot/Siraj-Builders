import ContentPage from "./ContentPage";

/**
 * Portfolio / project index.
 * Previously served at `/market-sectors`, a label that matched neither the
 * navigation ("Projects") nor the documented sitemap. `/market-sectors`
 * now redirects here.
 */
export default function Projects() {
  return <ContentPage type="projects" />;
}
