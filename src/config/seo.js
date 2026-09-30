/**
 * PER-ROUTE SEO METADATA
 * ------------------------------------------------------------------
 * Titles and descriptions are taken from the project documentation
 * ("SEO Title" / "Meta Description" under each page section). Pages the
 * documentation did not specify follow the same naming pattern.
 *
 * The documentation marks the service location as [LOCATION TO CONFIRM],
 * so no city is baked into any title. `LOCATION_TOKEN` is the one place
 * to add it once confirmed.
 */

export const LOCATION_TOKEN = ""; // e.g. " in Lahore" — TO CONFIRM.

const withLocation = (text) => text.replace("[LOCATION]", LOCATION_TOKEN).trim();

export const DEFAULT_SEO = {
  title: "Siraj Builders | Professional Construction & Building Services",
  description:
    "Explore Siraj Builders' professional approach to construction, project management and building solutions. Discuss your project with our team.",
};

export const SEO_BY_PATH = {
  "/": {
    title: "Siraj Builders | Professional Construction & Building Services",
    description:
      "Explore Siraj Builders' professional approach to construction, project management and building solutions. Discuss your project with our team.",
    keywords: withLocation("construction company [LOCATION], builders [LOCATION]"),
  },
  "/who-we-are": {
    title: "About Siraj Builders | Our Approach to Construction",
    description:
      "Learn about Siraj Builders, our construction philosophy, project approach and commitment to professional client service.",
    keywords: "about Siraj Builders, professional builders, building contractor",
  },
  "/services": {
    title: "Construction Services | Siraj Builders",
    description:
      "Explore Siraj Builders' construction solutions, from residential and commercial projects to renovation and project management.",
    keywords: withLocation("construction services [LOCATION]"),
  },
  "/residential-construction": {
    title: "Residential Construction | Siraj Builders",
    description:
      "Professional residential construction focused on planning, coordination, workmanship and a clear client experience.",
    keywords: withLocation("residential construction [LOCATION]"),
  },
  "/commercial-construction": {
    title: "Commercial Construction | Siraj Builders",
    description:
      "Commercial construction planned around how the finished property will actually be used, with coordinated delivery and supervision.",
    keywords: withLocation("commercial construction [LOCATION]"),
  },
  "/renovation-remodelling": {
    title: "Renovation & Remodelling | Siraj Builders",
    description:
      "Renovation and remodelling that starts by understanding the existing property, then improves how it functions and feels.",
    keywords: withLocation("renovation contractor [LOCATION]"),
  },
  "/design-architecture": {
    title: "Design & Architecture | Siraj Builders",
    description:
      "Design and architectural coordination coordinated with construction, so design intent carries through to the finished property.",
  },
  "/grey-structure": {
    title: "Grey Structure Construction | Siraj Builders",
    description:
      "Grey structure construction with coordinated site preparation, structural work, material management and stage-by-stage review.",
  },
  "/turnkey-construction": {
    title: "Turnkey Construction | Siraj Builders",
    description:
      "Turnkey construction managed as a single project, from initial brief through design, construction, finishes and handover.",
  },
  "/project-management": {
    title: "Construction Project Management | Siraj Builders",
    description:
      "Construction project management that keeps decisions, people and progress moving together with clear ownership and reporting.",
    keywords: withLocation("construction project management [LOCATION]"),
  },
  "/projects": {
    title: "Projects & Portfolio | Siraj Builders",
    description:
      "Explore completed and ongoing Siraj Builders projects across residential, commercial and renovation work.",
    keywords: withLocation("Siraj Builders projects, construction projects [LOCATION]"),
  },
  "/project-detail": {
    title: "Project Case Study | Siraj Builders",
    description:
      "A closer look at the scope, approach and delivery focus behind a Siraj Builders project.",
  },
  "/project-showcase": {
    title: "Project Visibility & Client Reporting | Siraj Builders",
    description:
      "How Siraj Builders keeps a project legible to the client: structured communication, documented decisions and clear responsibilities.",
  },
  "/our-process": {
    title: "Our Construction Process | Siraj Builders",
    description:
      "See how Siraj Builders approaches construction projects from consultation and planning through execution, quality review and handover.",
    keywords: withLocation("construction process [LOCATION]"),
  },
  "/faq": {
    title: "Construction FAQs | Siraj Builders",
    description:
      "Answers to common questions about starting a project, estimates, timelines, supervision, quality and project communication.",
  },
  "/contact-us": {
    title: "Contact Siraj Builders | Discuss Your Construction Project",
    description:
      "Contact Siraj Builders to discuss residential, commercial or renovation construction requirements and arrange an initial project consultation.",
    keywords: withLocation("construction company contact [LOCATION]"),
  },
  "/consultation": {
    title: "Request a Consultation | Siraj Builders",
    description:
      "Start with clarity. Share your property, scope and timing, and begin a structured conversation about your construction project.",
  },
  "/locations": {
    title: "Service Areas | Siraj Builders",
    description:
      "How Siraj Builders approaches each project from the property itself — site conditions, access, logistics and local coordination.",
  },
  "/cost-index": {
    title: "Construction Cost Guidance | Siraj Builders",
    description:
      "Construction cost becomes clearer when the scope is clear. Understand the project variables that shape an estimate.",
  },
  "/leadership": {
    title: "Leadership | Siraj Builders",
    description:
      "Clear responsibility and defined ownership across the project team at Siraj Builders.",
  },
  "/role-definition": {
    title: "Project Roles & Responsibilities | Siraj Builders",
    description:
      "How Siraj Builders defines project roles so decisions have owners and work does not fall between responsibilities.",
  },
  "/subcontractors": {
    title: "Subcontractors & Specialists | Siraj Builders",
    description:
      "Specialist trades coordinated against the drawings, programme and quality expectations of the wider project.",
  },
  "/international": {
    title: "Overseas & Remote Clients | Siraj Builders",
    description:
      "Structured updates, documented decisions and local coordination that keep remote stakeholders connected to the work.",
  },
  "/affiliates": {
    title: "Partners & Affiliates | Siraj Builders",
    description:
      "Working relationships and specialist partners that support Siraj Builders project delivery.",
  },
  "/privacy-policy": {
    title: "Privacy Policy | Siraj Builders",
    description:
      "How Siraj Builders handles the information you share through this website and why it is used.",
    noindex: false,
  },
  "/terms": {
    title: "Terms & Conditions | Siraj Builders",
    description:
      "The basic expectations when browsing the Siraj Builders website and submitting an enquiry.",
  },
  "/404": {
    title: "Page Not Found | Siraj Builders",
    description: "The page you were looking for is not available.",
    noindex: true,
  },
};

export function getSeo(pathname) {
  return SEO_BY_PATH[pathname] || DEFAULT_SEO;
}
