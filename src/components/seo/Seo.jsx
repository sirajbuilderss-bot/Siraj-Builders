import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getSeo } from "../../config/seo";
import { SITE_URL as STATIC_SITE_URL } from "../../config/site";
import { useSiteData } from "../../context/SiteDataContext";

/**
 * Manages document head metadata on every route change.
 *
 * The previous build shipped one static <title> and one static meta
 * description for all 26 routes, which meant every page competed for the
 * same search snippet. This applies the per-page SEO defined in the
 * project documentation.
 *
 * Implemented without react-helmet to avoid adding a dependency for
 * roughly forty lines of DOM work.
 */

function upsertMeta(selector, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
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

/**
 * Organization structured data. Only emits fields that have been
 * confirmed — the documentation forbids publishing unverified company
 * details, and invented data in JSON-LD is a search-quality liability.
 */
function buildStructuredData(url, COMPANY, CONTACT) {
  const data = {
    "@context": "https://schema.org",
    "@type": "GeneralContractor",
    name: COMPANY.name,
    description: COMPANY.tagline,
    url,
  };
  if (CONTACT.phone.confirmed && CONTACT.phone.value) {
    data.telephone = CONTACT.phone.value;
  }
  if (CONTACT.email.confirmed && CONTACT.email.value) {
    data.email = CONTACT.email.value;
  }
  if (CONTACT.address.confirmed && CONTACT.address.value) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: CONTACT.address.value,
    };
  }
  return data;
}

export default function Seo() {
  const { pathname } = useLocation();

  /* Company and contact details come from the database so that confirming a
     phone number in the admin panel also puts it into the structured data,
     rather than only into the visible header. The "only emit confirmed
     fields" rule below is unchanged and still does the real work. */
  const { company: COMPANY, contact: CONTACT, settingValue } = useSiteData();

  useEffect(() => {
    const seo = getSeo(pathname);
    const siteUrl = settingValue("site_url", STATIC_SITE_URL) || STATIC_SITE_URL;
    const url = `${siteUrl}${pathname === "/" ? "" : pathname}`;

    document.title = seo.title;

    upsertMeta('meta[name="description"]', {
      name: "description",
      content: seo.description,
    });

    if (seo.keywords) {
      upsertMeta('meta[name="keywords"]', {
        name: "keywords",
        content: seo.keywords,
      });
    }

    upsertMeta('meta[name="robots"]', {
      name: "robots",
      content: seo.noindex ? "noindex, nofollow" : "index, follow",
    });

    // Open Graph
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: seo.title });
    upsertMeta('meta[property="og:description"]', {
      property: "og:description",
      content: seo.description,
    });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: url });
    upsertMeta('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: COMPANY.name,
    });

    // Twitter
    upsertMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary_large_image",
    });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: seo.title });
    upsertMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: seo.description,
    });

    upsertLink("canonical", url);

    // Structured data
    let ld = document.head.querySelector("#siraj-structured-data");
    if (!ld) {
      ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.id = "siraj-structured-data";
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify(buildStructuredData(url, COMPANY, CONTACT));
    // COMPANY and CONTACT are included so the head is rewritten once the
    // database answers, not only on navigation.
  }, [pathname, COMPANY, CONTACT, settingValue]);

  return null;
}
