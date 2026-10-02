import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getSeo } from "../../config/seo";
import { SITE_URL as STATIC_SITE_URL } from "../../config/site";
import { useSiteData } from "../../context/SiteDataContext";
import { usePageMeta } from "../../context/PageContentContext";

/**
 * HEAD TAGS
 * ----------------------------------------------------------------------------
 * Priority, highest first:
 *   1. A page-level override — the project case study sets its own title,
 *      description and share image (useSeoOverride below).
 *   2. Admin → SEO & publishing — the `pages` row for this route.
 *   3. Documented defaults (src/content/defaults.json) and config/seo.js.
 *
 * Only confirmed contact details reach the structured data, unchanged from
 * the previous release.
 */

const SeoOverrideContext = createContext(null);

export function SeoProvider({ children }) {
  const [override, setOverride] = useState(null);
  return (
    <SeoOverrideContext.Provider value={{ override, setOverride }}>
      {children}
    </SeoOverrideContext.Provider>
  );
}

/** Lets a page set its own head tags while it is mounted. */
export function useSeoOverride(seo) {
  const context = useContext(SeoOverrideContext);
  const setOverride = context?.setOverride;
  const title = seo?.title || "";
  const description = seo?.description || "";
  const image = seo?.image || "";
  useEffect(() => {
    if (!setOverride || !title) return undefined;
    setOverride({ title, description, image });
    return () => setOverride(null);
  }, [setOverride, title, description, image]);
}

function upsertMeta(selector, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

function removeMeta(selector) {
  document.head.querySelector(selector)?.remove();
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
  return el;
}

function buildStructuredData(url, company, contact) {
  const data = {
    "@context": "https://schema.org",
    "@type": "GeneralContractor",
    name: company.name,
    description: company.tagline,
    url,
  };
  if (contact.phone.confirmed && contact.phone.value) data.telephone = contact.phone.value;
  if (contact.email.confirmed && contact.email.value) data.email = contact.email.value;
  if (contact.address.confirmed && contact.address.value) {
    data.address = { "@type": "PostalAddress", streetAddress: contact.address.value };
  }
  return data;
}

export default function Seo() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, "") || "/";
  const { company, contact, settingValue } = useSiteData();
  const meta = usePageMeta(path);
  const override = useContext(SeoOverrideContext)?.override;

  useEffect(() => {
    const base = getSeo(path);
    const title = override?.title || meta.seoTitle || base.title;
    const description = override?.description || meta.seoDescription || base.description;
    const image = override?.image || meta.ogImage || settingValue("default_og_image", "");
    const siteUrl = (settingValue("site_url", STATIC_SITE_URL) || STATIC_SITE_URL).replace(/\/+$/, "");
    const url = `${siteUrl}${path === "/" ? "" : path}`;
    const noindex = base.noindex || !meta.published;

    document.title = title;
    upsertMeta('meta[name="description"]', { name: "description", content: description });
    if (base.keywords) upsertMeta('meta[name="keywords"]', { name: "keywords", content: base.keywords });
    upsertMeta('meta[name="robots"]', { name: "robots", content: noindex ? "noindex, nofollow" : "index, follow" });

    upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: override ? "article" : "website" });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: url });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: company.name });
    if (image) {
      upsertMeta('meta[property="og:image"]', { property: "og:image", content: image });
      upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });
    } else {
      removeMeta('meta[property="og:image"]');
      removeMeta('meta[name="twitter:image"]');
    }

    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });

    upsertLink("canonical", url);

    let ld = document.head.querySelector("#siraj-structured-data");
    if (!ld) {
      ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.id = "siraj-structured-data";
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify(buildStructuredData(siteUrl, company, contact));
  }, [path, company, contact, settingValue, meta, override]);

  return null;
}
