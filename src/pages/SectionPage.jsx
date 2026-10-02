import { useLocation } from "react-router-dom";
import SectionRenderer from "../components/sections/SectionRenderer";
import RouteLoader from "../components/layout/RouteLoader";
import { usePageContent } from "../context/PageContentContext";
import { auth } from "../lib/supabase";
import useReveal from "../hooks/useReveal";
import NotFound from "./NotFound";

/**
 * Every content page on the website renders through here.
 *
 *   Admin → Pages (section builder)  →  page_sections  →  this component
 *   Admin → SEO & publishing         →  pages          →  publish switch
 *
 * An unpublished page is a 404 for visitors. A signed-in admin still sees it,
 * with a bar saying so, so a page can be prepared before it goes live.
 */
export default function SectionPage({ path: forcedPath, slots }) {
  const { pathname } = useLocation();
  const path = forcedPath || pathname.replace(/\/+$/, "") || "/";
  const { isReady, sections, meta } = usePageContent(path);
  useReveal();

  if (!isReady) return <RouteLoader />;

  const isAdmin = auth.isSignedIn();
  if (!meta.published && !isAdmin) return <NotFound />;
  if (!sections.length && !slots) return <NotFound />;

  return (
    <>
      {!meta.published && (
        <div className="draft-bar" role="status">
          This page is <b>unpublished</b> — only signed-in admins can see it.
          Publish it in Admin → SEO &amp; publishing.
        </div>
      )}
      <SectionRenderer sections={sections} path={path} pageLabel={meta.label} slots={slots} />
    </>
  );
}
