import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import useReveal from "../hooks/useReveal";
import useContent from "../hooks/useContent";
import useProjectForm, { VALIDATORS } from "../hooks/useProjectForm";
import { createSubmission } from "../services/submissions";
import {
  pages as pageService,
  projects as projectService,
  toPageShape,
  toProjectShape,
} from "../services/content";
import { useSiteData } from "../context/SiteDataContext";
import NotFound from "./NotFound";
import { CTA } from "../config/site";
import "../styles/content-pages.css";

const IMAGE =
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1800&q=85";

const CITY =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=85";
const MATERIALS =
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1800&q=85";
const DETAIL =
  "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1800&q=85";
const RENOVATION =
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=85";
const MEETING =
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=85";
const STRUCTURE =
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1800&q=85";
const MAP =
  "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1800&q=85";
const DOCUMENTS =
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1800&q=85";
const GLOBAL =
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1800&q=85";
const STEEL =
  "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1800&q=85";

/**
 * The documented copy for all 17 content pages, kept as the fallback for when
 * Supabase has no credentials, is unreachable, or the pages table is empty.
 * Editing a page in the admin panel overrides the matching entry here.
 */
const STATIC_PAGES = {
  "/who-we-are": {
    eyebrow: "Who we are",
    title: "Construction managed with clarity from the first conversation.",
    intro:
      "Siraj Builders brings planning, coordination and responsible execution together so clients understand what is happening at every stage.",
    image: MEETING,
    heading: "A construction partner, not simply a contractor.",
    body: "A well-run project depends on clear scope, visible decisions and people who take responsibility for the details. Our approach keeps the client, design and site moving in the same direction.",
    points: [
      "Clear project scope",
      "Responsible site coordination",
      "Consistent communication",
      "Defined handover",
    ],
  },
  "/residential-construction": {
    eyebrow: "Residential construction",
    title: "Homes built around the way people actually live.",
    intro:
      "From the first brief through structure, finishes and handover, every decision should serve the life the property is meant to support.",
    image: DETAIL,
    heading: "Build the home around its daily use.",
    body: "We coordinate residential work around the intended layout, materials, services, schedule and finishing requirements, keeping progress understandable as the project develops.",
    points: [
      "Planning and scope",
      "Structural coordination",
      "Finishes and materials",
      "Quality review",
    ],
  },
  "/renovation-remodelling": {
    eyebrow: "Renovation & remodelling",
    title: "Improve an existing property without losing what matters.",
    intro:
      "Good remodelling starts by understanding the building that is already there, then changing the parts that no longer serve the client.",
    image: RENOVATION,
    heading: "Respect the existing property. Improve the experience.",
    body: "We assess existing conditions, coordinate changes to layout and services, and sequence work so new finishes meet the old with intention.",
    points: [
      "Existing-condition review",
      "Layout improvements",
      "Services integration",
      "Finishing coordination",
    ],
  },
  "/design-architecture": {
    eyebrow: "Design & architecture",
    title: "Design decisions grounded in how the property needs to work.",
    intro:
      "A useful design balances ambition with site conditions, budget, materials, structure and the practical life of the finished space.",
    image: CITY,
    heading: "From design intent to buildable decisions.",
    body: "We help connect the brief, drawings and construction realities early, so the design can be carried into delivery without unnecessary surprises.",
    points: [
      "Brief development",
      "Spatial planning",
      "Material direction",
      "Construction coordination",
    ],
  },
  "/grey-structure": {
    eyebrow: "Grey structure",
    title: "A strong structural foundation for the work that follows.",
    intro:
      "The early stages set the quality, alignment and sequencing of the entire build. They deserve careful coordination.",
    image: STRUCTURE,
    heading: "Structure first. Clarity at every stage.",
    body: "From site preparation through structural work, we keep drawings, materials, workmanship and progress aligned with the agreed project requirements.",
    points: [
      "Site preparation",
      "Foundation and structure",
      "Material coordination",
      "Stage-by-stage review",
    ],
  },
  "/turnkey-construction": {
    eyebrow: "Turnkey construction",
    title: "One coordinated route from initial brief to completed property.",
    intro:
      "A turnkey project needs more than a long list of services. It needs one clear direction across design, construction, finishes and handover.",
    image: STEEL,
    heading: "A complete property, managed as one project.",
    body: "We coordinate the major decisions and handoffs so the client has a clear view of scope, progress, quality and completion.",
    points: [
      "Single project direction",
      "Design and build coordination",
      "Finishes and installation",
      "Final handover",
    ],
  },
  "/project-management": {
    eyebrow: "Project management",
    title: "Keep decisions, people and progress moving together.",
    intro:
      "Construction is a sequence of connected decisions. Project management makes ownership, timing and next steps visible.",
    image: DOCUMENTS,
    heading: "The work is easier to manage when it is visible.",
    body: "We structure communication, sequencing and reviews around the agreed scope so issues can be addressed before they become expensive delays.",
    points: [
      "Programme coordination",
      "Trade and site alignment",
      "Progress communication",
      "Quality and close-out",
    ],
  },
  "/our-process": {
    eyebrow: "Our process",
    title: "A clear route from first conversation to final handover.",
    intro:
      "Every project is different, but the need for clear stages, decisions and communication stays the same.",
    image: GLOBAL,
    heading: "Five stages. One connected project.",
    body: "We begin with the requirement, establish the scope, coordinate preparation, manage execution and review the completed work before handover.",
    points: [
      "01 — Understand",
      "02 — Plan",
      "03 — Prepare",
      "04 — Build",
      "05 — Handover",
    ],
  },
  "/leadership": {
    eyebrow: "Leadership",
    title: "Well-managed projects start with clear responsibility.",
    intro:
      "Leadership in construction means knowing who decides what, coordinating across teams and being accountable for delivery.",
    image: MAP,
    heading: "Clear roles create better momentum.",
    body: "Decisions have owners, sites have leads and clients have a clear path for questions and updates.",
    points: [
      "Accountability",
      "Communication",
      "Coordination",
      "Responsible decisions",
    ],
  },
  "/role-definition": {
    eyebrow: "Role definition",
    title: "Every project role, clearly defined.",
    intro:
      "Projects move better when everyone knows what they own, what they do not own and where the handoffs happen.",
    image: MATERIALS,
    heading: "Clarity reduces overlap.",
    body: "We define responsibilities around the project so decisions do not sit unanswered and important work does not fall between roles.",
    points: [
      "Client direction",
      "Project management",
      "Site supervision",
      "Specialist coordination",
    ],
  },
  "/subcontractors": {
    eyebrow: "Subcontractors",
    title: "Specialists coordinated around the agreed project.",
    intro:
      "External specialists add value when their scope, timing and communication remain clear.",
    image: GLOBAL,
    heading: "The right specialist in the right sequence.",
    body: "We coordinate specialist work against the drawings, programme and quality expectations of the wider project.",
    points: [
      "Defined scope",
      "Sequenced work",
      "Site coordination",
      "Quality review",
    ],
  },
  "/international": {
    eyebrow: "International projects",
    title: "Clear project coordination across distance and complexity.",
    intro:
      "When clients, consultants or properties are in different locations, communication and documentation matter even more.",
    image: DOCUMENTS,
    heading: "Make the project visible from anywhere.",
    body: "Structured updates, documented decisions and coordinated information help keep remote stakeholders connected to the work.",
    points: [
      "Remote communication",
      "Documented decisions",
      "Local coordination",
      "Visible progress",
    ],
  },
  "/locations": {
    eyebrow: "Locations",
    title: "A project approach that starts with the property itself.",
    intro:
      "Site conditions, access, local requirements and the surrounding context all shape how construction should be planned.",
    image: MAP,
    heading: "Every location has its own realities.",
    body: "We begin by understanding the property and its context before fixing the scope, sequence or delivery assumptions.",
    points: [
      "Property assessment",
      "Access and logistics",
      "Local coordination",
      "Project-specific planning",
    ],
  },
  "/cost-index": {
    eyebrow: "Cost index",
    title: "Construction cost becomes clearer when the scope is clear.",
    intro:
      "There is no useful universal price without understanding size, specifications, site conditions, materials and intended outcome.",
    image: STEEL,
    heading: "Start with decisions, not a guess.",
    body: "Use the initial conversation to clarify the project variables that shape cost, then develop a project-specific basis for discussion.",
    points: ["Scope", "Size and site", "Materials", "Finishes and services"],
  },
  "/privacy-policy": {
    eyebrow: "Privacy policy",
    title: "Your project information should be handled with care.",
    intro:
      "We use information shared through this website to understand project requirements and respond to enquiries.",
    image: DOCUMENTS,
    heading: "Clear information, clear purpose.",
    body: "Only share the details needed to help us understand your enquiry. Contact details and project information should be used for the conversation you requested.",
    points: [
      "Information you share",
      "Why it is used",
      "How enquiries are handled",
      "Your questions",
    ],
  },
  "/terms": {
    eyebrow: "Terms",
    title: "A clear starting point for using this website.",
    intro:
      "These terms describe the basic expectations when browsing the Siraj Builders website and submitting an enquiry.",
    image: GLOBAL,
    heading: "Useful information, responsibly presented.",
    body: "Website content is provided as general project information. Final scope, pricing, timing and responsibilities should always be confirmed for the individual project.",
    points: [
      "Website information",
      "Project discussions",
      "Enquiry details",
      "Responsible use",
    ],
  },
  /* The homepage teaser links here promising "structured communication,
     documented decisions and clearly defined responsibilities". This route
     previously rendered a duplicate of the portfolio grid, so the promise and
     the destination did not match. Content now follows the teaser. */
  "/project-showcase": {
    eyebrow: "Project visibility",
    title: "Know what is happening, and what comes next.",
    intro:
      "Construction becomes easier to live with when progress, decisions and responsibilities stay visible to the people paying for the work.",
    image: DOCUMENTS,
    heading: "The work is easier to manage when it is visible.",
    body: "We structure communication around the agreed scope: what has been completed, what is under way, and where a client decision is needed next. Reporting format and frequency are agreed per project.",
    points: [
      "Structured progress updates",
      "Documented decisions",
      "Defined responsibilities",
      "Clear next steps",
    ],
  },
};

/** All published pages, keyed by path — the shape STATIC_PAGES uses. */
async function loadPageMap() {
  const rows = await pageService.listPublic();
  if (!rows.length) return null; // null makes useContent keep the fallback
  return rows.reduce(
    (acc, row) => ({ ...acc, [row.path]: toPageShape(row) }),
    {}
  );
}

async function loadProjects() {
  const rows = await projectService.listPublic();
  return rows.map(toProjectShape);
}

const MOTIF_BY_EYEBROW = {
  "Who we are": "about",
  "Residential construction": "orbit",
  "Renovation & remodelling": "renovation",
  "Design & architecture": "blueprint",
  "Grey structure": "structure",
  "Turnkey construction": "turnkey",
  "Project management": "signal",
  "Our process": "process",
  Leadership: "team",
  "Role definition": "nodes",
  Subcontractors: "tools",
  "International projects": "globe",
  Locations: "location",
  "Cost index": "calculator",
  "Privacy policy": "shield",
  Terms: "document",
  "Project showcase": "showcase",
  Projects: "houses",
  FAQs: "faq",
  Contact: "contact",
  Consultation: "consultation",
  "Project case study": "case-study",
};

function HeroMotif({ variant }) {
  if (variant === "bars") {
    return (
      <svg
        className="content-hero-motif motif-bars"
        viewBox="0 0 420 360"
        aria-hidden="true"
      >
        <path className="motif-line" d="M45 305h330" />
        <rect
          className="motif-bar"
          x="75"
          y="190"
          width="48"
          height="115"
          rx="4"
        />
        <rect
          className="motif-bar"
          x="145"
          y="135"
          width="48"
          height="170"
          rx="4"
        />
        <rect
          className="motif-bar"
          x="215"
          y="88"
          width="48"
          height="217"
          rx="4"
        />
        <rect
          className="motif-bar"
          x="285"
          y="45"
          width="48"
          height="260"
          rx="4"
        />
      </svg>
    );
  }

  if (variant === "orbit") {
    return (
      <svg
        className="content-hero-motif motif-orbit"
        viewBox="0 0 420 360"
        aria-hidden="true"
      >
        <ellipse className="motif-ring" cx="220" cy="180" rx="150" ry="58" />
        <ellipse className="motif-ring" cx="220" cy="180" rx="105" ry="150" />
        <circle className="motif-core" cx="220" cy="180" r="28" />
        <circle className="motif-dot" cx="92" cy="180" r="7" />
        <circle className="motif-dot" cx="300" cy="48" r="7" />
      </svg>
    );
  }

  if (variant === "grid") {
    return (
      <svg
        className="content-hero-motif motif-grid"
        viewBox="0 0 420 360"
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <rect
            key={item}
            className="motif-cell"
            x={55 + (item % 3) * 105}
            y={55 + Math.floor(item / 3) * 115}
            width="82"
            height="88"
            rx="8"
          />
        ))}
        <circle className="motif-dot" cx="296" cy="100" r="7" />
      </svg>
    );
  }

  if (variant === "blueprint") {
    return (
      <svg
        className="content-hero-motif motif-blueprint"
        viewBox="0 0 420 360"
        aria-hidden="true"
      >
        <path
          className="motif-line"
          d="M70 300V100h110V55h170v245H70ZM180 100v200M250 55v245M70 205h280"
        />
        <path className="motif-dash" d="M45 325h330M45 35h330" />
      </svg>
    );
  }

  if (variant === "signal") {
    return (
      <svg
        className="content-hero-motif motif-signal"
        viewBox="0 0 420 360"
        aria-hidden="true"
      >
        <path
          className="motif-line"
          d="M45 270h65l38-115 42 165 45-210 42 160 42-80h56"
        />
        <circle className="motif-pulse" cx="230" cy="110" r="10" />
      </svg>
    );
  }

  if (variant === "nodes") {
    return (
      <svg
        className="content-hero-motif motif-nodes"
        viewBox="0 0 420 360"
        aria-hidden="true"
      >
        <path
          className="motif-line"
          d="M80 92 210 180 335 82M80 268l130-88 125 86M80 92v176M335 82v184"
        />
        <circle className="motif-core" cx="210" cy="180" r="25" />
        <circle className="motif-dot" cx="80" cy="92" r="8" />
        <circle className="motif-dot" cx="335" cy="82" r="8" />
        <circle className="motif-dot" cx="80" cy="268" r="8" />
        <circle className="motif-dot" cx="335" cy="268" r="8" />
      </svg>
    );
  }

  if (variant === "renovation") {
    return (
      <svg
        className="content-hero-motif motif-renovation"
        viewBox="0 0 420 360"
        aria-hidden="true"
      >
        <path
          className="motif-line"
          d="M55 300V92h310v208M55 170h310M160 92v208M265 92v208"
        />
        <path
          className="motif-detail"
          d="M85 125h45v45H85zM190 125h45v45h-45zM295 125h45v45h-45zM85 215h45v55H85zM295 215h45v55h-45z"
        />
        <path className="motif-dash" d="M42 320h336" />
      </svg>
    );
  }

  if (variant === "structure") {
    return (
      <svg
        className="content-hero-motif motif-structure"
        viewBox="0 0 420 360"
        aria-hidden="true"
      >
        <path
          className="motif-line"
          d="M65 300 210 58l145 242M105 300h210M88 255h244M115 210h190M142 165h136M169 120h82"
        />
        <path
          className="motif-detail"
          d="M210 58v242M130 300l80-242M290 300 210 58"
        />
      </svg>
    );
  }

  if (variant === "turnkey") {
    return (
      <svg
        className="content-hero-motif motif-turnkey"
        viewBox="0 0 420 360"
        aria-hidden="true"
      >
        <path
          className="motif-line"
          d="M50 265h75l35-105 42 72 42-126 42 159h84"
        />
        <circle className="motif-core" cx="210" cy="106" r="25" />
        <path className="motif-detail" d="M202 106h16M210 98v16" />
      </svg>
    );
  }

  if (variant === "team") {
    return (
      <svg
        className="content-hero-motif motif-team"
        viewBox="0 0 420 360"
        aria-hidden="true"
      >
        <circle
          className="motif-person motif-person-main"
          cx="210"
          cy="118"
          r="34"
        />
        <circle className="motif-person" cx="110" cy="190" r="25" />
        <circle className="motif-person" cx="310" cy="190" r="25" />
        <path
          className="motif-line"
          d="M180 145 130 172M240 145l50 27M110 215v54M310 215v54M160 270h100"
        />
        <path className="motif-detail" d="M195 118h30M210 103v30" />
      </svg>
    );
  }

  if (variant === "tools") {
    return (
      <svg
        className="content-hero-motif motif-tools"
        viewBox="0 0 420 360"
        aria-hidden="true"
      >
        <path
          className="motif-line"
          d="m105 90 205 205M285 82a42 42 0 0 0-8 52l-93 93a42 42 0 0 0-52 8 42 42 0 0 0 52-8l93-93a42 42 0 0 0 8-52Z"
        />
        <circle className="motif-core" cx="210" cy="180" r="30" />
        <path className="motif-detail" d="M198 180h24M210 168v24" />
      </svg>
    );
  }

  if (variant === "globe") {
    return (
      <svg
        className="content-hero-motif motif-globe"
        viewBox="0 0 420 360"
        aria-hidden="true"
      >
        <circle className="motif-ring" cx="210" cy="180" r="112" />
        <ellipse className="motif-ring" cx="210" cy="180" rx="50" ry="112" />
        <path className="motif-line" d="M98 180h224M116 125h188M116 235h188" />
        <circle className="motif-dot" cx="105" cy="180" r="7" />
        <circle className="motif-dot" cx="315" cy="180" r="7" />
      </svg>
    );
  }

  if (variant === "location") {
    return (
      <svg
        className="content-hero-motif motif-location"
        viewBox="0 0 420 360"
        aria-hidden="true"
      >
        <path
          className="motif-line"
          d="M210 310s88-82 88-158a88 88 0 1 0-176 0c0 76 88 158 88 158Z"
        />
        <circle className="motif-core" cx="210" cy="150" r="28" />
        <circle className="motif-dot" cx="210" cy="150" r="7" />
        <path className="motif-detail" d="M70 310h280" />
      </svg>
    );
  }

  if (variant === "calculator") {
    return (
      <svg
        className="content-hero-motif motif-calculator"
        viewBox="0 0 420 360"
        aria-hidden="true"
      >
        <rect
          className="motif-panel"
          x="110"
          y="45"
          width="200"
          height="270"
          rx="16"
        />
        <rect
          className="motif-detail"
          x="140"
          y="75"
          width="140"
          height="48"
          rx="6"
        />
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <circle
            key={item}
            className="motif-dot"
            cx={155 + (item % 3) * 52}
            cy={165 + Math.floor(item / 3) * 58}
            r="8"
          />
        ))}
      </svg>
    );
  }

  if (variant === "shield") {
    return (
      <svg
        className="content-hero-motif motif-shield"
        viewBox="0 0 420 360"
        aria-hidden="true"
      >
        <path
          className="motif-shield-shape"
          d="M210 42 315 82v78c0 72-47 124-105 158-58-34-105-86-105-158V82l105-40Z"
        />
        <path className="motif-detail" d="m160 180 34 34 68-76" />
      </svg>
    );
  }

  if (variant === "document") {
    return (
      <svg
        className="content-hero-motif motif-document"
        viewBox="0 0 420 360"
        aria-hidden="true"
      >
        <path
          className="motif-document-shape"
          d="M120 38h132l48 48v236H120zM252 38v52h48"
        />
        <path className="motif-line" d="M155 145h110M155 185h110M155 225h78" />
        <circle className="motif-dot" cx="278" cy="270" r="8" />
      </svg>
    );
  }

  if (variant === "showcase") {
    return (
      <svg
        className="content-hero-motif motif-showcase"
        viewBox="0 0 420 360"
        aria-hidden="true"
      >
        <rect
          className="motif-frame"
          x="62"
          y="65"
          width="296"
          height="220"
          rx="12"
        />
        <path className="motif-line" d="M82 250 166 165l48 46 44-60 80 99" />
        <circle className="motif-dot" cx="285" cy="112" r="10" />
      </svg>
    );
  }

  if (variant === "contact" || variant === "consultation") {
    return (
      <svg
        className={`content-hero-motif motif-${variant}`}
        viewBox="0 0 420 360"
        aria-hidden="true"
      >
        <path className="motif-line" d="M80 120h260v150H80z" />
        <path
          className="motif-detail"
          d="m82 125 128 94 128-94M80 268l92-82M340 268l-92-82"
        />
        <circle className="motif-dot" cx="210" cy="219" r="8" />
      </svg>
    );
  }

  if (variant === "case-study") {
    return (
      <svg
        className="content-hero-motif motif-case-study"
        viewBox="0 0 420 360"
        aria-hidden="true"
      >
        <rect
          className="motif-frame"
          x="65"
          y="62"
          width="290"
          height="230"
          rx="14"
        />
        <path
          className="motif-line"
          d="M95 245h230M95 245l62-68 42 38 57-82 69 112"
        />
        <circle className="motif-core" cx="254" cy="133" r="16" />
        <path className="motif-detail" d="M92 94h90M92 112h58" />
      </svg>
    );
  }

  if (variant === "houses") {
    return (
      <svg
        className="content-hero-motif motif-houses"
        viewBox="0 0 420 360"
        aria-hidden="true"
      >
        <path className="motif-line" d="M45 305h330" />
        <path className="motif-house" d="M72 305V170l82-72 82 72v135Z" />
        <path className="motif-house" d="M208 305V142l72-62 72 62v163Z" />
        <path
          className="motif-detail"
          d="M133 305v-74h42v74M246 305v-58h34v58M304 305v-92h28v92"
        />
        <path className="motif-detail" d="M121 153h66M257 132h46" />
        <circle className="motif-dot" cx="154" cy="98" r="7" />
        <circle className="motif-dot" cx="280" cy="80" r="7" />
      </svg>
    );
  }

  if (variant === "about") {
    return (
      <svg
        className="content-hero-motif motif-about"
        viewBox="0 0 420 360"
        aria-hidden="true"
      >
        <path
          className="motif-line"
          d="M210 172 92 92M210 172 328 92M210 172 108 278M210 172 312 278"
        />
        <circle
          className="motif-person motif-person-main"
          cx="210"
          cy="132"
          r="36"
        />
        <circle className="motif-person" cx="92" cy="70" r="25" />
        <circle className="motif-person" cx="328" cy="70" r="25" />
        <circle className="motif-person" cx="108" cy="278" r="25" />
        <circle className="motif-person" cx="312" cy="278" r="25" />
        <path
          className="motif-detail"
          d="M194 132h32M210 116v32M80 70h24M316 70h24M96 278h24M300 278h24"
        />
      </svg>
    );
  }

  if (variant === "process") {
    return (
      <svg
        className="content-hero-motif motif-process"
        viewBox="0 0 420 360"
        aria-hidden="true"
      >
        <path className="motif-line" d="M48 180h324" />
        {[52, 132, 212, 292, 372].map((x, index) => (
          <g key={x}>
            <circle className="motif-process-node" cx={x} cy="180" r="25" />
            <text className="motif-step" x={x} y="186" textAnchor="middle">
              {String(index + 1).padStart(2, "0")}
            </text>
          </g>
        ))}
        <path
          className="motif-detail"
          d="M52 235v32M132 235v32M212 235v32M292 235v32M372 235v32"
        />
      </svg>
    );
  }

  if (variant === "faq") {
    return (
      <svg
        className="content-hero-motif motif-faq"
        viewBox="0 0 420 360"
        aria-hidden="true"
      >
        <circle className="motif-faq-ring" cx="210" cy="175" r="108" />
        <path
          className="motif-question"
          d="M165 145c0-30 22-51 49-51 29 0 48 20 48 47 0 24-14 37-34 49-15 9-18 18-18 31"
        />
        <circle className="motif-core" cx="210" cy="255" r="7" />
        <circle className="motif-dot" cx="106" cy="86" r="7" />
        <circle className="motif-dot" cx="322" cy="274" r="7" />
      </svg>
    );
  }

  return (
    <svg
      className="content-hero-motif motif-route"
      viewBox="0 0 420 360"
      aria-hidden="true"
    >
      <path
        className="motif-line"
        d="M40 260c60 0 58-150 125-150s54 170 120 170 43-115 95-115"
      />
      {[40, 165, 285, 380].map((x, index) => (
        <circle
          key={x}
          className="motif-dot"
          cx={x}
          cy={[260, 110, 280, 165][index]}
          r="8"
        />
      ))}
    </svg>
  );
}

function Hero({ page }) {
  const variant = page.motif || MOTIF_BY_EYEBROW[page.eyebrow] || "route";

  return (
    <section
      className={`content-hero content-hero--${variant}`}
      style={{ "--hero-image": `url(${page.image || IMAGE})` }}
    >
      <div className="content-hero-shade" />
      <HeroMotif variant={variant} />
      <div className="container content-hero-inner">
        <span className="content-crumb">Siraj Builders / {page.eyebrow}</span>
        {/* <span className="eyebrow">{page.eyebrow}</span> */}
        <h1 className="content-hero-heading">{page.title}</h1>
        <p className="content-hero-lead">{page.intro}</p>
        <div className="content-trust content-hero-trust">
          <span>Clear scope</span>
          <span>Responsible coordination</span>
          <span>Defined next step</span>
        </div>
      </div>
    </section>
  );
}

function StandardPage({ page }) {
  return (
    <>
      <section className="section content-intro">
        <div className="container content-split">
          <div className="reveal">
            <span className="eyebrow">The approach</span>
            <h2 className="h2">{page.heading}</h2>
            <p className="muted content-copy">{page.body}</p>
            <Link className="btn btn-primary" to="/consultation">
              Discuss your project <span className="arrow">→</span>
            </Link>
          </div>
          <img
            className="content-image reveal"
            style={{ "--d": "0.15s" }}
            src={page.image || IMAGE}
            alt={page.eyebrow}
            loading="lazy"
          />
        </div>
      </section>
      <section className="section light">
        <div className="container">
          <div className="content-section-head">
            <div>
              <span className="eyebrow">What matters</span>
              <h2 className="h2">A practical framework for delivery.</h2>
            </div>
            <p className="muted">
              Each part keeps the finished property connected to the original
              requirement.
            </p>
          </div>
          <div className="content-grid" data-stagger>
            {page.points.map((point, index) => (
              <article className="content-card reveal" key={point}>
                <span className="content-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{point.replace(/^\d+\s—\s/, "")}</h3>
                <p className="muted">
                  Planned, coordinated and reviewed as part of the wider
                  project.
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="content-cta">
        <div className="container content-cta-inner">
          <div>
            <span className="eyebrow">Start with clarity</span>
            <h2>Discuss the project behind the property.</h2>
          </div>
          <Link className="btn btn-light" to="/contact-us">
            Get in touch <span className="arrow">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}

const CONTACT_FIELD_RULES = {
  name: [VALIDATORS.required("Full name"), VALIDATORS.minLength("Full name", 2)],
  phone: [VALIDATORS.required("Phone"), VALIDATORS.phone()],
  email: [VALIDATORS.email()],
  projectType: [VALIDATORS.required("Project type")],
  description: [
    VALIDATORS.required("Project description"),
    VALIDATORS.minLength("Project description", 20),
  ],
};

const CONTACT_INITIAL = {
  name: "",
  phone: "",
  email: "",
  projectType: "",
  description: "",
};

function FieldError({ name, message }) {
  if (!message) return null;
  return (
    <span className="field-error" id={`${name}-error`} role="alert">
      {message}
    </span>
  );
}

/* Defined at module scope so its identity is stable across renders — an
   inline arrow here would rebuild useProjectForm's submit handler on every
   keystroke. */
const submitContactEnquiry = (values) => createSubmission(values, "contact");

function ContactForm() {
  const { company } = useSiteData();
  const form = useProjectForm({
    initialValues: CONTACT_INITIAL,
    rules: CONTACT_FIELD_RULES,
    onSubmit: submitContactEnquiry,
  });

  if (form.isSuccess) {
    return (
      <div className="form-success" role="status" aria-live="polite">
        <span className="success-mark" aria-hidden="true">✓</span>
        {/* Documented success message. The previous copy read
            "Details captured in demo mode", which is internal language
            that should never reach a real visitor. */}
        <h2>Thank you. Your project details have been received.</h2>
        <p>
          Our team will review the information and contact you regarding the
          next step.
        </p>
        <button className="btn btn-ghost" type="button" onClick={form.reset}>
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form className="project-form" onSubmit={form.handleSubmit} noValidate>
      <div className="form-heading">
        <span className="eyebrow">Contact {company.name}</span>
        <h2>Tell us about your project.</h2>
        <p className="muted">
          The more we understand about your project, the better we can guide
          the initial conversation.
        </p>
      </div>

      <div className="form-fields">
        <label>
          Full name <span aria-hidden="true">*</span>
          <input
            {...form.fieldProps("name")}
            type="text"
            autoComplete="name"
            placeholder="Your name"
          />
          <FieldError name="name" message={form.errorFor("name")} />
        </label>

        <label>
          Phone <span aria-hidden="true">*</span>
          <input
            {...form.fieldProps("phone")}
            type="tel"
            autoComplete="tel"
            placeholder="Include country code"
          />
          <FieldError name="phone" message={form.errorFor("phone")} />
        </label>

        <label>
          Email
          <input
            {...form.fieldProps("email")}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
          <FieldError name="email" message={form.errorFor("email")} />
        </label>

        <label>
          Project type <span aria-hidden="true">*</span>
          <select {...form.fieldProps("projectType")}>
            <option value="">Select a type</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="renovation">Renovation</option>
            <option value="unsure">Not sure yet</option>
          </select>
          <FieldError
            name="projectType"
            message={form.errorFor("projectType")}
          />
        </label>

        <label className="field-wide">
          Project description <span aria-hidden="true">*</span>
          <textarea
            {...form.fieldProps("description")}
            rows={5}
            placeholder="Tell us what you are planning and what matters most."
          />
          <FieldError
            name="description"
            message={form.errorFor("description")}
          />
        </label>
      </div>

      <p className="form-microcopy">
        Your information is used to understand your project and determine the
        appropriate next step.
      </p>

      {form.submitError && (
        <p className="form-submit-error" role="alert">
          {form.submitError}
        </p>
      )}

      <button
        className="btn btn-primary"
        type="submit"
        disabled={form.isSubmitting}
      >
        {form.isSubmitting ? "Sending…" : "Discuss My Project"}
        {!form.isSubmitting && <span className="arrow">→</span>}
      </button>
    </form>
  );
}

function ContactPage() {
  const { contact } = useSiteData();
  const page = {
    eyebrow: "Contact",
    title: "Let's talk about your project.",
    intro:
      "Whether you are exploring your options or already have drawings, the best place to begin is a conversation.",
    image: IMAGE,
  };
  return (
    <>
      <Hero page={page} />
      <section className="section">
        <div className="container form-layout">
          <ContactForm />
          <aside className="contact-aside">
            <span className="eyebrow">Useful to share</span>
            <h2>Bring what you already know.</h2>
            <ul>
              {[
                "Property location",
                "Project type and intended use",
                "Approximate size",
                "Drawings or documents",
                "Desired scope and timing",
              ].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="contact-aside-details">
              {contact.email.confirmed ? (
                <a href={`mailto:${contact.email.value}`}>
                  {contact.email.value}
                </a>
              ) : (
                <span className="is-pending">{contact.email.display}</span>
              )}
              {contact.phone.confirmed ? (
                <a href={`tel:${contact.phone.value}`}>{contact.phone.value}</a>
              ) : (
                <span className="is-pending">{contact.phone.display}</span>
              )}
            </div>

            <Link className="btn btn-ghost" to={CTA.highIntent.to}>
              {CTA.highIntent.label} <span className="arrow">→</span>
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------
 * PORTFOLIO DATA
 * ------------------------------------------------------------------
 * The documentation requires that the portfolio show only verified work
 * ("Repeat only for verified projects", "Do not create a gallery consisting
 * only of pretty images") and lists every project field as outstanding:
 * name, location, type, area, year, status, scope, client requirement,
 * challenge, solution, photography, result.
 *
 * None of that has been supplied, so this array is EMPTY by design rather
 * than populated with invented projects and stock photography. The page
 * renders a documented empty state until real work is added.
 *
 * TO POPULATE: add projects through the admin panel at /admin/projects.
 * PROJECT_SHAPE below documents the fields each project carries; it maps
 * one-to-one onto the `projects` table.
 * ---------------------------------------------------------------- */

export const PROJECT_SHAPE = {
  slug: "",            // URL segment, e.g. "gulberg-residence"
  title: "",           // Verified project name
  category: "",        // Residential | Commercial | Renovation | Design & Build
  location: "",        // Verified location
  status: "",          // Completed | Ongoing
  year: "",            // Verified year
  area: "",            // Verified area
  image: "",           // Real project photography
  summary: "",         // Verified 40-60 word description
  requirement: "",     // What the client needed
  challenge: "",       // What made it distinctive
  solution: "",        // How it was approached
  result: "",          // What was delivered
};

/* Projects now come from the `projects` table — the hardcoded empty array
   that used to live here has been replaced by loadProjects() above. Add
   projects through the admin panel rather than editing this file. */

const PROJECT_FILTERS = ["all", "Residential", "Commercial", "Renovation"];

function ProjectsPage() {
  const [filter, setFilter] = useState("all");

  /* fallbackOnEmpty is false here, unlike everywhere else on the site. An
     empty portfolio is a real, documented state with its own designed empty
     view — falling back to the hardcoded empty array would be the same
     result, but falling back on empty would also mask a genuine "all
     projects deactivated" from the admin. */
  const { data: PROJECTS } = useContent(loadProjects, [], {
    fallbackOnEmpty: false,
  });

  const visible =
    filter === "all"
      ? PROJECTS
      : PROJECTS.filter((project) => project.category === filter);

  return (
    <>
      <Hero
        page={{
          eyebrow: "Projects",
          title: "Projects that show how we work.",
          intro:
            "A portfolio should do more than display attractive photographs. It should show the thinking, scope and execution behind the finished project.",
          motif: "houses",
        }}
      />
      <section className="section light">
        <div className="container">
          <div className="content-section-head">
            <div>
              <span className="eyebrow">Portfolio</span>
              <h2 className="h2">Recent work across our services.</h2>
            </div>
            {PROJECTS.length > 0 && (
              <p className="muted">
                Filter by category to see the work relevant to you.
              </p>
            )}
          </div>

          {PROJECTS.length > 0 ? (
            <>
              <div
                className="project-filters"
                role="tablist"
                aria-label="Project categories"
              >
                {PROJECT_FILTERS.map((item) => (
                  <button
                    className={filter === item ? "is-active" : ""}
                    type="button"
                    key={item}
                    role="tab"
                    aria-selected={filter === item}
                    onClick={() => setFilter(item)}
                  >
                    {item === "all" ? "All projects" : item}
                  </button>
                ))}
              </div>

              {visible.length > 0 ? (
                <div className="project-grid">
                  {visible.map((project) => (
                    <Link
                      className="showcase-card"
                      to={`/project-detail?project=${project.slug}`}
                      key={project.slug}
                    >
                      <img
                        src={project.image}
                        alt={`${project.title} — ${project.category} project`}
                        loading="lazy"
                        width="800"
                        height="600"
                      />
                      <div>
                        <span className="eyebrow">{project.category}</span>
                        <h3>{project.title}</h3>
                        <p className="muted">{project.summary}</p>
                        <span className="kicker">View case study →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="faq-empty">
                  No projects in this category yet.
                </p>
              )}
            </>
          ) : (
            /* Documented empty state — honest about the position rather than
               filling the grid with stock imagery and invented project names. */
            <div className="portfolio-empty">
              <h3>Project case studies are being prepared.</h3>
              <p className="muted">
                Rather than publish stock photography, we are documenting
                completed projects properly — the client requirement, the
                constraints, how the work was approached and what was
                delivered.
              </p>
              <p className="muted">
                If you would like to see work relevant to a specific project
                type, ask us directly and we will share what is appropriate.
              </p>
              <div className="portfolio-empty-actions">
                <Link className="btn btn-primary" to={CTA.primary.to}>
                  {CTA.primary.label} <span className="arrow">→</span>
                </Link>
                <Link className="btn btn-ghost" to={CTA.supporting.to}>
                  {CTA.supporting.label} <span className="arrow">→</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function ProjectDetail() {
  const location = useLocation();
  const slug = new URLSearchParams(location.search).get("project");
  const { data: PROJECTS, isLoading } = useContent(loadProjects, [], {
    fallbackOnEmpty: false,
  });
  const project = PROJECTS.find((item) => item.slug === slug);

  /* Wait for the fetch before deciding. Without this the page would flash a
     404 on every load while the project list was still in flight. */
  if (isLoading) {
    return (
      <section className="section">
        <div className="container">
          <p className="muted" role="status">
            Loading project…
          </p>
        </div>
      </section>
    );
  }

  /* Previously this page title-cased whatever arrived in the query string,
     so /project-detail?project=anything rendered a case study for a project
     that does not exist. Unknown or missing slugs now 404 properly. */
  if (!project) return <NotFound />;

  return (
    <>
      <Hero
        page={{
          eyebrow: "Project case study",
          title: project.title,
          intro: project.summary,
          image: project.image,
        }}
      />
      <section className="section">
        <div className="container content-split">
          <div>
            <span className="eyebrow">Project overview</span>
            <h2 className="h2">The client requirement</h2>
            <p className="muted content-copy">{project.requirement}</p>

            <h2 className="h2">The challenge</h2>
            <p className="muted content-copy">{project.challenge}</p>

            <h2 className="h2">Our approach</h2>
            <p className="muted content-copy">{project.solution}</p>

            <h2 className="h2">Result</h2>
            <p className="muted content-copy">{project.result}</p>

            <Link className="btn btn-primary" to={CTA.primary.to}>
              Discuss a similar project <span className="arrow">→</span>
            </Link>
          </div>

          <aside className="detail-panel">
            <span className="eyebrow">Project details</span>
            <h3>{project.title}</h3>
            <dl className="detail-meta">
              <dt>Type</dt>
              <dd>{project.category}</dd>
              <dt>Location</dt>
              <dd>{project.location}</dd>
              <dt>Area</dt>
              <dd>{project.area}</dd>
              <dt>Status</dt>
              <dd>{project.status}</dd>
              <dt>Year</dt>
              <dd>{project.year}</dd>
            </dl>
          </aside>
        </div>
      </section>
    </>
  );
}

export default function ContentPage({ type }) {
  useReveal();
  const location = useLocation();
  const { data: PAGES } = useContent(loadPageMap, STATIC_PAGES);

  if (type === "contact") return <ContactPage />;
  if (type === "projects") return <ProjectsPage />;
  if (type === "detail") return <ProjectDetail />;

  const page = PAGES[location.pathname] || STATIC_PAGES[location.pathname];

  // A routed page with no PAGES entry is a configuration bug, not a visitor
  // error — surface it loudly in development, fall back gracefully in prod.
  if (!page) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[ContentPage] No content configured for "${location.pathname}". ` +
          `Add a row to the pages table, or an entry to STATIC_PAGES in ` +
          `src/pages/ContentPage.jsx.`
      );
    }
    return <NotFound />;
  }

  return (
    <>
      <Hero page={page} />
      <StandardPage page={page} />
    </>
  );
}
