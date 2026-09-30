/**
 * SITE DATA CONTEXT
 * ============================================================================
 * Header, Footer, the consultation page and the contact aside all need the
 * same four things: company details, contact details, social profiles and the
 * service list. Before this file they imported those directly from
 * `src/config/site.js` as module constants.
 *
 * This provider fetches the same four things from Supabase once, at app boot,
 * and falls back to the exact static constants whenever the database cannot
 * answer. Consumers read from the context instead of importing the constants.
 *
 * `src/config/site.js` is still the single source of truth for everything
 * structural — navigation order, CTA copy, legal links — and remains the
 * fallback for everything else. It was not deleted and nothing about it
 * changed, so a site with no Supabase credentials renders byte-identically to
 * the version you sent me.
 *
 * The `confirmed` flag convention is preserved end to end. An unconfirmed
 * phone number still renders as plain text rather than a dead `tel:` link,
 * whether that flag came from the file or from the database.
 */

import { createContext, useContext, useMemo } from "react";
import {
  COMPANY as STATIC_COMPANY,
  CONTACT as STATIC_CONTACT,
  SOCIAL_PROFILES as STATIC_SOCIALS,
  SERVICE_LINKS as STATIC_SERVICES,
  WHATSAPP_MESSAGE,
} from "../config/site";
import {
  settings as settingsService,
  socialLinks as socialService,
  services as servicesService,
  toContactShape,
  toSocialShape,
  toServiceLinkShape,
} from "../services/content";
import useContent from "../hooks/useContent";

const SiteDataContext = createContext(null);

/* Static fallbacks are frozen module constants, so referencing them directly
   keeps the hook's fallback identity stable across renders. */
const FALLBACK_SETTINGS = null;

async function fetchSettings() {
  return settingsService.map();
}

async function fetchSocials() {
  return socialService.listPublic();
}

async function fetchServices() {
  return servicesService.listPublic();
}

export function SiteDataProvider({ children }) {
  const { data: settingsMap, isLoading: settingsLoading } = useContent(
    fetchSettings,
    FALLBACK_SETTINGS
  );

  const { data: socialRows } = useContent(fetchSocials, null);
  const { data: serviceRows } = useContent(fetchServices, null);

  const value = useMemo(() => {
    /* ---- Company ---- */
    const company = settingsMap
      ? {
          name: settingsMap.company_name?.value || STATIC_COMPANY.name,
          initials: settingsMap.company_initials?.value || STATIC_COMPANY.initials,
          tagline: settingsMap.company_tagline?.value || STATIC_COMPANY.tagline,
          proposition:
            settingsMap.company_proposition?.value || STATIC_COMPANY.proposition,
          trustLine:
            settingsMap.company_trust_line?.value || STATIC_COMPANY.trustLine,
        }
      : STATIC_COMPANY;

    /* ---- Contact ---- */
    const contact = settingsMap ? toContactShape(settingsMap) : STATIC_CONTACT;

    /* ---- Social profiles ---- */
    const socials =
      Array.isArray(socialRows) && socialRows.length
        ? toSocialShape(socialRows)
        : STATIC_SOCIALS;

    /* ---- Service links ---- */
    const serviceLinks =
      Array.isArray(serviceRows) && serviceRows.length
        ? toServiceLinkShape(serviceRows)
        : STATIC_SERVICES;

    /* ---- WhatsApp deep link ----
       Same rule as the original `whatsappLink()` in config/site.js: no link
       at all unless the number is both present and confirmed, so the CTA
       hides rather than opening an empty conversation. */
    const whatsappHref =
      contact.whatsapp.confirmed && contact.whatsapp.value
        ? `https://wa.me/${contact.whatsapp.value.replace(/[^\d]/g, "")}` +
          `?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
        : null;

    const settingValue = (key, fallback = "") =>
      settingsMap?.[key]?.value || fallback;

    return {
      company,
      contact,
      socials,
      serviceLinks,
      whatsappHref,
      settingValue,
      isLoading: settingsLoading,
      /* True once the database answered — useful for admin previews. */
      isDynamic: Boolean(settingsMap),
    };
  }, [settingsMap, socialRows, serviceRows, settingsLoading]);

  return (
    <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>
  );
}

/**
 * Consumers get live data when the provider is mounted and the static
 * constants when it is not — so a component rendered outside the provider
 * (a test, the admin panel) still works.
 */
export function useSiteData() {
  const context = useContext(SiteDataContext);
  if (context) return context;

  return {
    company: STATIC_COMPANY,
    contact: STATIC_CONTACT,
    socials: STATIC_SOCIALS,
    serviceLinks: STATIC_SERVICES,
    whatsappHref: null,
    settingValue: (_key, fallback = "") => fallback,
    isLoading: false,
    isDynamic: false,
  };
}

export default SiteDataContext;
