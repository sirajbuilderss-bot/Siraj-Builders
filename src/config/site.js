/**
 * SINGLE SOURCE OF TRUTH FOR COMPANY DETAILS
 * ------------------------------------------------------------------
 * The project documentation marks the items below as [TO CONFIRM] and
 * explicitly instructs that no company details, numbers, locations or
 * credentials should be invented.
 *
 * Every placeholder is therefore left unresolved ON PURPOSE and is
 * flagged with `confirmed: false`. Components read these flags and
 * degrade gracefully — an unconfirmed phone number renders as plain
 * text rather than a dead `tel:` link, and unconfirmed locations are
 * omitted from the page instead of being filled with a guess.
 *
 * TO GO LIVE: fill in the real values and flip `confirmed` to true.
 * Nothing else in the codebase needs to change.
 */

export const COMPANY = {
  name: "Siraj Builders",
  initials: "SB",
  // Documentation, FOOTER section.
  tagline: "Construction, managed from the first plan to the final detail.",
  // Documentation, B. BRAND POSITIONING — Unique Value Proposition.
  proposition: "Built with clarity. Managed with care. Delivered with purpose.",
  // Documentation, HERO — Trust line.
  trustLine: "Clear planning. Responsible execution. Consistent communication.",
};

export const CONTACT = {
  phone: { value: "", display: "Phone number to be confirmed", confirmed: false },
  whatsapp: { value: "", display: "WhatsApp number to be confirmed", confirmed: false },
  email: { value: "", display: "Email address to be confirmed", confirmed: false },
  address: { value: "", display: "Office address to be confirmed", confirmed: false },
  hours: { value: "", display: "Business hours to be confirmed", confirmed: false },
};

/**
 * Documentation, WHATSAPP CTA COPY — prefilled message so the visitor
 * never lands in a blank conversation.
 */
export const WHATSAPP_MESSAGE = [
  "Hello Siraj Builders, I'd like to discuss a construction project.",
  "",
  "Project type: ",
  "Location: ",
  "Property/Plot size: ",
  "Expected start: ",
  "",
  "I'd like to understand the next steps and discuss my requirements.",
].join("\n");

export function whatsappLink() {
  if (!CONTACT.whatsapp.confirmed || !CONTACT.whatsapp.value) return null;
  const digits = CONTACT.whatsapp.value.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
}

/**
 * Social profiles. The documentation does not list verified accounts,
 * so these stay disabled rather than linking to generic homepages
 * (facebook.com / instagram.com), which the previous build did.
 */
export const SOCIAL_PROFILES = [
  { key: "facebook", label: "Facebook", href: "", confirmed: false },
  { key: "instagram", label: "Instagram", href: "", confirmed: false },
  { key: "linkedin", label: "LinkedIn", href: "", confirmed: false },
  { key: "youtube", label: "YouTube", href: "", confirmed: false },
  { key: "tiktok", label: "TikTok", href: "", confirmed: false },
  { key: "whatsapp_community", label: "WhatsApp Community", href: "", confirmed: false },
];

/* ---------------- NAVIGATION ----------------
   Documentation, NAVIGATION section:
   Home / About / Services ▾ / Projects / Our Process / FAQs / Contact
   Header CTA: "Discuss Your Project"
-------------------------------------------- */

export const SERVICE_LINKS = [
  { to: "/residential-construction", label: "Residential Construction", confirmed: true },
  { to: "/commercial-construction", label: "Commercial Construction", confirmed: true },
  { to: "/renovation-remodelling", label: "Renovation & Remodelling", confirmed: true },
  { to: "/design-architecture", label: "Design & Architecture", confirmed: false },
  { to: "/grey-structure", label: "Grey Structure", confirmed: false },
  { to: "/turnkey-construction", label: "Turnkey Construction", confirmed: false },
  { to: "/project-management", label: "Project Management", confirmed: false },
];

export const PRIMARY_NAV = [
  { to: "/", label: "Home" },
  { to: "/who-we-are", label: "About" },
  { to: "/projects", label: "Projects" },
  { to: "/our-process", label: "Our Process" },
  { to: "/faq", label: "FAQs" },
  { to: "/contact-us", label: "Contact" },
];

export const COMPANY_LINKS = [
  { to: "/who-we-are", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/leadership", label: "Leadership" },
  { to: "/projects", label: "Projects" },
  { to: "/our-process", label: "Our Process" },
  { to: "/testimonials", label: "Testimonials" },
  { to: "/faq", label: "FAQs" },
  { to: "/contact-us", label: "Contact" },
];

/* Previously orphaned: these routes existed and rendered content but nothing
   on the site linked to them, so they were unreachable except by typing the
   URL. Surfaced in the footer. */
export const RESOURCE_LINKS = [
  { to: "/project-showcase", label: "Project Visibility" },
  { to: "/role-definition", label: "Project Roles" },
  { to: "/subcontractors", label: "Subcontractors" },
  { to: "/affiliates", label: "Partners & Affiliates" },
  { to: "/locations", label: "Service Areas" },
  { to: "/cost-index", label: "Cost Guidance" },
];

export const LEGAL_LINKS = [
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms & Conditions" },
];

/* ---------------- CTAs ----------------
   Documentation, GLOBAL CTA STRATEGY.
--------------------------------------- */
export const CTA = {
  primary: { label: "Discuss Your Project", to: "/consultation" },
  secondary: { label: "View Our Projects", to: "/projects" },
  supporting: { label: "See How We Work", to: "/our-process" },
  highIntent: { label: "Request a Consultation", to: "/consultation" },
  whatsapp: { label: "Chat About Your Project" },
};

export const SITE_URL = "https://www.sirajbuilders.com"; // TO CONFIRM — used for canonical/OG tags.
