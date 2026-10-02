/**
 * SIRAJ BUILDERS — DOCUMENTED CONTENT, ONE SOURCE
 * ============================================================================
 * Every word the public website shows by default lives here, written from
 * the Siraj Builders strategy document ("Siraj builders.pdf").
 *
 * `npm run build:content` turns this file into two outputs that therefore
 * cannot disagree:
 *
 *   src/content/defaults.json          what the website renders when the
 *                                      database is empty or unreachable
 *   database/migration-03-content.sql  the same content, seeded into Supabase
 *                                      so the admin panel opens showing it
 *
 * Rules this file follows (from the documentation):
 *   - Nothing marked [TO CONFIRM] is written as fact. Those sections exist
 *     but ship hidden (enabled: false) or with no answer, so the admin can
 *     fill them in and switch them on.
 *   - No invented numbers, names, history, locations, credentials or
 *     testimonials.
 *   - Stock photography is used only as atmosphere on non-project sections,
 *     never to represent a Siraj Builders project.
 *
 * Section shape (maps 1:1 onto public.page_sections):
 *   key, label, type, eyebrow, title, subtitle, body, items[{title, body,
 *   image}], media_url, cta_label, cta_href, enabled, settings{...}
 *
 * settings keys the renderer understands:
 *   theme       'white' | 'light' | 'dark'      section background
 *   layout      type-specific variant (see SectionRenderer.jsx)
 *   cta2_label / cta2_href                      secondary button
 *   limit       max rows for live-data sections
 *   category    filter for projects / faq sections
 *   source      'hero_slides' — the homepage hero is the slider
 */

const IMG = {
  plans: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1800&q=80",
  city: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=80",
  site: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1800&q=80",
  facade: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1800&q=80",
  interior: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=80",
  meeting: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=80",
  structure: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1800&q=80",
  documents: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1800&q=80",
  steel: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1800&q=80",
  house: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1800&q=80",
  office: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1800&q=80",
  officeWide: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80",
  crane: "https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&w=1800&q=80",
  map: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1800&q=80",
};

const t = (title, body = "") => ({ title, body });

/* Reusable closing call to action — documentation, FINAL CTA. */
const cta = (title, body, label = "Discuss Your Project", href = "/consultation", extra = {}) => ({
  key: "cta",
  label: "Call to action",
  type: "cta",
  eyebrow: "Start with clarity",
  title,
  body,
  cta_label: label,
  cta_href: href,
  settings: { theme: "dark", ...extra },
});

const hero = (eyebrow, title, body, media_url, extra = {}) => ({
  key: "hero",
  label: "Hero",
  type: "hero",
  eyebrow,
  title,
  body,
  media_url,
  ...extra,
});

/* ==========================================================================
 * PAGES
 * ======================================================================== */

const PAGES = [
  /* ------------------------------------------------------------- HOME --- */
  {
    path: "/",
    label: "Home",
    group: "Main",
    seo: {
      title: "Siraj Builders | Professional Construction & Building Services",
      description:
        "Explore Siraj Builders' professional approach to construction, project management and building solutions. Discuss your project with our team.",
    },
    sections: [
      {
        key: "hero",
        label: "Hero slider",
        type: "hero",
        title: "Construction, managed from the first plan to the final detail.",
        subtitle: "Clear planning. Responsible execution. Consistent communication.",
        body: "A well-built project begins long before construction starts. Siraj Builders brings together planning, coordination and on-site execution to create a more organised construction experience for homeowners, businesses and property investors.",
        cta_label: "Discuss Your Project",
        cta_href: "/consultation",
        settings: { source: "hero_slides", cta2_label: "View Our Projects", cta2_href: "/projects" },
      },
      {
        key: "trust",
        label: "Trust strip",
        type: "trust",
        items: [
          t("Clear scope", "Defined before work begins"),
          t("Responsible execution", "Supervised on site"),
          t("Consistent updates", "Progress shared as it happens"),
          t("Defined handover", "Clear transition at completion"),
        ],
      },
      {
        key: "intro",
        label: "Introduction",
        type: "intro",
        eyebrow: "A different construction experience",
        title: "A construction partner, not simply a contractor.",
        body:
          "Construction involves hundreds of decisions — from the first scope of work to materials, scheduling, site coordination and final finishing.\n\nSiraj Builders is built around a straightforward principle: clients should understand their project and feel confident about how it is being managed.\n\nWe focus on organised execution, practical decision-making and careful attention to the details that shape the finished result.",
        media_url: IMG.facade,
        cta_label: "Learn About Siraj Builders",
        cta_href: "/who-we-are",
        settings: { theme: "white" },
      },
      {
        key: "services",
        label: "Services",
        type: "services",
        eyebrow: "What we do",
        title: "Solutions built around the project.",
        body: "Whether the requirement is a new property, commercial space, renovation or a broader design-and-build assignment, the right solution starts by understanding the project itself.",
        cta_label: "Explore Our Services",
        cta_href: "/services",
        settings: { theme: "light", limit: 3 },
      },
      {
        key: "projects",
        label: "Projects",
        type: "projects",
        eyebrow: "Selected work",
        title: "See the work, not just the promise.",
        body: "Every completed project tells a different story. Our portfolio showcases the spaces we have delivered, the requirements behind them and the work involved in bringing each project together.",
        cta_label: "View All Projects",
        cta_href: "/projects",
        settings: { theme: "dark", limit: 3 },
      },
      {
        key: "why-us",
        label: "Why Siraj Builders",
        type: "features",
        eyebrow: "Why Siraj Builders",
        title: "What a better-managed project looks like.",
        body: "The difference is rarely one big promise. It is how the project is run, day after day.",
        media_url: IMG.plans,
        items: [
          t("Clear expectations", "Good construction starts with understanding what is being built, why it is being built and what the project requires."),
          t("Organised execution", "A structured approach helps coordinate decisions, materials, people and work across different stages."),
          t("Attention to detail", "The final result is shaped by hundreds of smaller decisions. We treat those details as part of the project, not an afterthought."),
          t("Client communication", "Construction becomes easier to manage when clients know what has happened, what is happening and what comes next."),
          t("Practical decision-making", "We focus on solutions that make sense for the property's intended use, project requirements and available resources."),
          t("Accountability", "A professional construction relationship should have clear responsibilities, clear communication and a clear path forward when decisions need to be made."),
        ],
        settings: { theme: "white", layout: "grid" },
      },
      {
        key: "process",
        label: "Process preview",
        type: "process",
        eyebrow: "Our process",
        title: "A clear route from idea to completion.",
        items: [
          t("Consultation", "Understand your requirements, property and project objectives."),
          t("Site Assessment", "Review the site and identify the practical considerations that affect the project."),
          t("Planning & Design", "Develop the project scope and coordinate the required planning and design work."),
          t("Estimation", "Establish the scope, specifications and commercial requirements."),
          t("Construction", "Move into organised execution with appropriate supervision and coordination."),
          t("Quality Review", "Review completed work and address outstanding details."),
          t("Handover", "Complete the project and transition the finished property to the client."),
        ],
        cta_label: "See Our Full Process",
        cta_href: "/our-process",
        settings: { theme: "light" },
      },
      {
        key: "stats",
        label: "Verified numbers",
        type: "stats",
        eyebrow: "In numbers",
        title: "Verified figures",
        body: "Shown only when real, verified figures are added on the Statistics screen.",
        settings: { theme: "white" },
      },
      {
        key: "testimonials",
        label: "Testimonials",
        type: "testimonials",
        eyebrow: "Client feedback",
        title: "What our clients say about working with us.",
        settings: { theme: "light", limit: 3 },
      },
      {
        key: "faq",
        label: "FAQ preview",
        type: "faq",
        eyebrow: "Common questions",
        title: "Answers before you have to ask.",
        cta_label: "See All FAQs",
        cta_href: "/faq",
        settings: { theme: "white", limit: 4 },
      },
      cta(
        "Have a project in mind? Start with a conversation.",
        "Tell us what you are planning, where the property is located and what you need from your construction partner. We will use that information to understand whether Siraj Builders is the right fit for your project and what the next step should be.",
        "Discuss Your Project",
        "/consultation",
        { cta2_label: "Contact Siraj Builders", cta2_href: "/contact-us" }
      ),
    ],
  },

  /* ------------------------------------------------------------ ABOUT --- */
  {
    path: "/who-we-are",
    label: "About",
    group: "Main",
    seo: {
      title: "About Siraj Builders | Our Approach to Construction",
      description: "Learn about Siraj Builders, our construction philosophy, project approach and commitment to professional client service.",
    },
    sections: [
      hero(
        "About Siraj Builders",
        "Built around a better way to manage construction.",
        "Siraj Builders is a construction company focused on delivering professionally managed building projects with attention to planning, execution and client communication.",
        IMG.meeting
      ),
      {
        key: "who",
        label: "Who we are",
        type: "intro",
        eyebrow: "Who we are",
        title: "Our role is to bring greater structure to that process.",
        body:
          "We understand that construction is rarely straightforward from a client's perspective. There are budgets to consider, decisions to make, timelines to manage and countless details that can affect the final outcome.\n\nWe focus on organised execution, practical decision-making and careful attention to the details that shape the finished result.",
        media_url: IMG.plans,
        settings: { theme: "white" },
      },
      {
        key: "story",
        label: "Our Story",
        type: "content",
        eyebrow: "Our story",
        title: "Good construction starts with a clear conversation.",
        body: "Most people don’t build every day. They’re trusting someone with a place that matters to them, while making a lot of decisions along the way.\n\nWe start by understanding how the property needs to work and what matters most to the client. Then we work through scope, planning and the choices that shape the build, keeping communication open as the work moves forward.\n\nA good result is more than a finished building. Clients should know what has been done, why it matters and what comes next.",
        enabled: true,
        settings: { theme: "light" },
      },
      {
        key: "mission",
        label: "Mission & vision",
        type: "features",
        eyebrow: "Purpose",
        title: "Why we do this work.",
        items: [
          t("Mission", "To deliver well-planned construction projects through responsible execution, clear communication and attention to the details that matter to our clients."),
          t("Vision", "To become a construction partner known for professional project management, dependable execution and lasting client relationships."),
        ],
        settings: { theme: "light", layout: "duo" },
      },
      {
        key: "approach",
        label: "Our approach",
        type: "content",
        eyebrow: "Our approach",
        title: "A successful project depends on more than workmanship alone.",
        body: "It requires:",
        items: [
          t("Understanding before execution."),
          t("Planning before construction."),
          t("Communication throughout."),
          t("Attention to detail until completion."),
        ],
        media_url: IMG.site,
        settings: { theme: "white", layout: "checklist" },
      },
      {
        key: "quality",
        label: "Quality commitment",
        type: "content",
        eyebrow: "Quality commitment",
        title: "Quality should be visible in the way a project is planned, managed and finished.",
        body: "Our commitment is to approach each project with care, use appropriate materials and specifications, and maintain attention to workmanship throughout the construction process.",
        settings: { theme: "light", layout: "centered" },
      },
      {
        key: "pillars",
        label: "Brand pillars",
        type: "features",
        eyebrow: "What we hold to",
        title: "Seven principles behind every project.",
        items: [
          t("Clarity", "The client understands the project before committing."),
          t("Structured execution", "Construction follows a defined process rather than an improvised sequence."),
          t("Responsible management", "The project is actively coordinated rather than simply handed over to workers."),
          t("Craftsmanship", "Attention is given to the details that determine the final result."),
          t("Communication", "Clients remain informed throughout the project."),
          t("Practical design", "The finished space should look good while serving its intended purpose."),
          t("Long-term value", "The objective is not simply to finish construction, but to create something that remains useful and valuable."),
        ],
        settings: { theme: "white", layout: "numbered" },
      },
      {
        key: "team",
        label: "Leadership",
        type: "team",
        eyebrow: "Leadership",
        title: "The people responsible for your project.",
        body: "Shown once verified team profiles are added on the Team screen.",
        settings: { theme: "light" },
      },
      cta(
        "See how we would approach your project.",
        "Share the basics — property, project type and what you need — and we will explain the next step.",
        "Discuss Your Project",
        "/consultation",
        { cta2_label: "See How We Work", cta2_href: "/our-process" }
      ),
    ],
  },

  /* --------------------------------------------------------- SERVICES --- */
  {
    path: "/services",
    label: "Services",
    group: "Main",
    seo: {
      title: "Construction Services | Siraj Builders",
      description: "Explore Siraj Builders' construction solutions, from residential and commercial projects to renovation and project management.",
    },
    sections: [
      hero(
        "Services",
        "Construction solutions for projects that deserve a structured approach.",
        "Different properties require different approaches. Our services are structured around those differences.",
        IMG.steel
      ),
      {
        key: "intro",
        label: "Introduction",
        type: "content",
        eyebrow: "How we think about services",
        title: "Different properties require different approaches.",
        body: "A new home, commercial building and renovation project may share the same basic construction principles, but their priorities, constraints and execution requirements are different.\n\nOur services are structured around those differences.",
        settings: { theme: "white", layout: "centered" },
      },
      {
        key: "list",
        label: "Services list",
        type: "services",
        eyebrow: "Our services",
        title: "Choose the service closest to your project.",
        settings: { theme: "light", layout: "full" },
      },
      {
        key: "proof",
        label: "Link to projects & process",
        type: "content",
        eyebrow: "Before you decide",
        title: "See examples of our work and what working with us involves.",
        body: "Every service follows the same principle: understand the requirement, agree the scope, then manage the work with clear communication.",
        cta_label: "View Our Projects",
        cta_href: "/projects",
        settings: { theme: "white", layout: "centered", cta2_label: "See How We Work", cta2_href: "/our-process" },
      },
      cta("Not sure which service fits?", "Tell us about the property and what you want to achieve. We will help establish the right starting point."),
    ],
  },

  /* ------------------------------------------------------ RESIDENTIAL --- */
  {
    path: "/residential-construction",
    label: "Residential Construction",
    group: "Services",
    seo: {
      title: "Residential Construction | Siraj Builders",
      description: "Professional residential construction focused on planning, coordination, workmanship and a clear client experience.",
    },
    sections: [
      hero(
        "Residential construction",
        "A home should be built around how you intend to live.",
        "From the initial requirements to the finished property, residential construction involves hundreds of decisions. Our approach focuses on bringing those decisions into a structured process so the project remains aligned with the client's requirements.",
        IMG.house
      ),
      {
        key: "deliver",
        label: "What we deliver",
        type: "content",
        eyebrow: "What we deliver",
        title: "Structured support from planning to handover.",
        body: "Depending on the agreed scope, residential construction may involve:",
        items: [
          t("Project planning"),
          t("Construction coordination"),
          t("Structural work"),
          t("Finishing"),
          t("Site supervision"),
          t("Quality review"),
          t("Client communication"),
          t("Final handover"),
        ],
        subtitle: "The exact scope is agreed for each project before work begins.",
        media_url: IMG.facade,
        settings: { theme: "white", layout: "checklist" },
      },
      {
        key: "needs",
        label: "What homeowners need",
        type: "features",
        eyebrow: "What homeowners usually need",
        title: "The concerns we plan around.",
        items: [
          t("Budget clarity", "Understanding the scope before committing."),
          t("Communication", "Knowing what is happening during construction."),
          t("Workmanship", "Confidence that important details are being handled properly."),
          t("Coordination", "Reducing the burden of managing multiple construction activities independently."),
          t("A clear finish line", "Knowing what completion and handover involve."),
        ],
        settings: { theme: "light", layout: "grid" },
      },
      {
        key: "projects",
        label: "Related projects",
        type: "projects",
        eyebrow: "Residential work",
        title: "See examples of our work.",
        cta_label: "View All Projects",
        cta_href: "/projects",
        settings: { theme: "white", category: "Residential", limit: 3, hide_empty: true },
      },
      cta(
        "Discuss your home project.",
        "Share the property location, plot size and what you want to build. We will explain the appropriate next step.",
        "Discuss Your Home Project",
        "/consultation",
        { cta2_label: "See How We Work", cta2_href: "/our-process" }
      ),
    ],
  },

  /* ------------------------------------------------------- COMMERCIAL --- */
  {
    path: "/commercial-construction",
    label: "Commercial Construction",
    group: "Services",
    seo: {
      title: "Commercial Construction | Siraj Builders",
      description: "Commercial construction planned around how the finished property will actually be used, with coordinated delivery and supervision.",
    },
    sections: [
      hero(
        "Commercial construction",
        "Commercial spaces built for how businesses operate.",
        "A commercial property needs to do more than look complete. It needs to function.",
        IMG.officeWide
      ),
      {
        key: "approach",
        label: "Our approach",
        type: "intro",
        eyebrow: "Our approach",
        title: "Planned around the business that will use it.",
        body: "That means planning for movement, usability, durability, maintenance and the practical requirements of the business occupying the space.\n\nWe begin by understanding the intended use of the property and then coordinate the construction process around the agreed project requirements.",
        media_url: IMG.office,
        settings: { theme: "white" },
      },
      {
        key: "focus",
        label: "Focus areas",
        type: "features",
        eyebrow: "Focus areas",
        title: "What a commercial project turns on.",
        items: [
          t("Functional planning", "Layouts that support how the business actually operates."),
          t("Construction coordination", "Trades, stages and decisions brought into one sequence."),
          t("Site supervision", "Work overseen on site against the agreed scope."),
          t("Material management", "Materials planned and coordinated around the programme."),
          t("Quality review", "Completed work checked before it is signed off."),
          t("Schedule coordination", "Timing managed with the business's operations in mind."),
          t("Final completion", "A defined close-out and handover."),
        ],
        subtitle: "Specific capabilities are confirmed for each project.",
        settings: { theme: "light", layout: "grid" },
      },
      {
        key: "projects",
        label: "Related projects",
        type: "projects",
        eyebrow: "Commercial work",
        title: "See examples of our work.",
        cta_label: "View All Projects",
        cta_href: "/projects",
        settings: { theme: "white", category: "Commercial", limit: 3, hide_empty: true },
      },
      cta(
        "Discuss a commercial project.",
        "Tell us how the space will be used, where it is and when you need it. We will help define the next step.",
        "Discuss a Commercial Project",
        "/consultation",
        { cta2_label: "See How We Work", cta2_href: "/our-process" }
      ),
    ],
  },

  /* ------------------------------------------------------- RENOVATION --- */
  {
    path: "/renovation-remodelling",
    label: "Renovation & Remodelling",
    group: "Services",
    seo: {
      title: "Renovation & Remodelling | Siraj Builders",
      description: "Renovation and remodelling that starts by understanding the existing property, then improves how it functions and feels.",
    },
    sections: [
      hero(
        "Renovation & remodelling",
        "Improve the space you already have.",
        "Renovation is different from building from scratch. Existing structures, services, finishes and layouts all have to be considered before changes are made.",
        IMG.interior
      ),
      {
        key: "intro",
        label: "How we approach renovation",
        type: "intro",
        eyebrow: "How we approach it",
        title: "Understand the existing property first.",
        body: "Siraj Builders approaches renovation projects by first understanding the existing property and then identifying the changes required to improve its functionality, appearance or use.",
        media_url: IMG.interior,
        settings: { theme: "white" },
      },
      {
        key: "structure",
        label: "How the project is structured",
        type: "content",
        eyebrow: "Project structure",
        title: "We can structure the project around:",
        items: [
          t("Existing property assessment"),
          t("Planning"),
          t("Construction work"),
          t("Finishing"),
          t("Material coordination"),
          t("Site management"),
          t("Final review"),
        ],
        settings: { theme: "light", layout: "checklist" },
      },
      {
        key: "objective",
        label: "The objective",
        type: "content",
        eyebrow: "The objective",
        title: "Not simply to make a space look different.",
        body: "To make it work better for the people using it.",
        settings: { theme: "white", layout: "centered" },
      },
      {
        key: "projects",
        label: "Related projects",
        type: "projects",
        eyebrow: "Renovation work",
        title: "See examples of our work.",
        cta_label: "View All Projects",
        cta_href: "/projects",
        settings: { theme: "light", category: "Renovation", limit: 3, hide_empty: true },
      },
      cta("Discuss your renovation.", "Tell us about the property as it is today and what you want to change.", "Discuss Your Renovation"),
    ],
  },

  /* --------------------------------------- DESIGN & ARCHITECTURE (TBC) --- */
  {
    path: "/design-architecture",
    label: "Design & Architecture",
    group: "Services",
    published: false,
    seo: {
      title: "Design & Architecture | Siraj Builders",
      description: "Design decisions made with construction in mind — planning and design coordination before construction begins.",
    },
    sections: [
      hero(
        "Design & architecture",
        "Design decisions made with construction in mind.",
        "Where Siraj Builders provides architectural or design services, the objective is to create a stronger connection between what is designed and what is ultimately built.",
        IMG.city
      ),
      {
        key: "scope",
        label: "Scope",
        type: "content",
        eyebrow: "Scope",
        title: "What design support can cover.",
        body: "The exact services, and whether each is provided directly or through external professionals, are confirmed for each project.",
        items: [t("Construction coordination")],
        settings: { theme: "white", layout: "checklist", note: "TO CONFIRM — add architectural planning, concept development, space planning, technical drawings, 3D visualisation and interior coordination only if offered, and state which are provided directly vs through partners." },
      },
      cta("Discuss design for your project.", "Share your brief and any drawings you already have."),
    ],
  },

  /* ----------------------------------------------- GREY STRUCTURE (TBC) -- */
  {
    path: "/grey-structure",
    label: "Grey Structure",
    group: "Services",
    published: false,
    seo: {
      title: "Grey Structure Construction | Siraj Builders",
      description: "Grey structure work coordinated with care — the structural stage that sets up everything that follows.",
    },
    sections: [
      hero(
        "Grey structure",
        "A strong structural foundation for the work that follows.",
        "The early stages set the quality, alignment and sequencing of the entire build. They deserve careful coordination.",
        IMG.structure
      ),
      {
        key: "detail",
        label: "What it involves",
        type: "content",
        eyebrow: "The approach",
        title: "Structure first. Clarity at every stage.",
        body: "From site preparation through structural work, we keep drawings, materials, workmanship and progress aligned with the agreed project requirements.",
        items: [t("Site preparation"), t("Foundation and structure"), t("Material coordination"), t("Stage-by-stage review")],
        media_url: IMG.structure,
        settings: { theme: "white", layout: "checklist", note: "TO CONFIRM — publish only once grey-structure work is a confirmed service." },
      },
      cta("Discuss your grey structure project.", "Share the plot details and drawings you already have."),
    ],
  },

  /* ------------------------------------------------- TURNKEY (TBC) ------- */
  {
    path: "/turnkey-construction",
    label: "Turnkey Construction",
    group: "Services",
    published: false,
    seo: {
      title: "Turnkey Construction | Siraj Builders",
      description: "One coordinated route from initial brief to completed property.",
    },
    sections: [
      hero(
        "Turnkey construction",
        "One coordinated route from initial brief to completed property.",
        "A turnkey project needs more than a long list of services. It needs one clear direction across design, construction, finishes and handover.",
        IMG.steel
      ),
      {
        key: "detail",
        label: "What it involves",
        type: "content",
        eyebrow: "The approach",
        title: "A complete property, managed as one project.",
        body: "We coordinate the major decisions and handoffs so the client has a clear view of scope, progress, quality and completion.",
        items: [t("Single project direction"), t("Design and build coordination"), t("Finishes and installation"), t("Final handover")],
        media_url: IMG.house,
        settings: { theme: "white", layout: "checklist", note: "TO CONFIRM — publish only once turnkey delivery is a confirmed service." },
      },
      cta("Discuss a turnkey project.", "Tell us what you want completed and where."),
    ],
  },

  /* ----------------------------------------- PROJECT MANAGEMENT (TBC) --- */
  {
    path: "/project-management",
    label: "Project Management",
    group: "Services",
    published: false,
    seo: {
      title: "Construction Project Management | Siraj Builders",
      description: "Project management that keeps decisions, people and progress moving together.",
    },
    sections: [
      hero(
        "Project management",
        "Keep decisions, people and progress moving together.",
        "Construction is a sequence of connected decisions. Project management makes ownership, timing and next steps visible.",
        IMG.documents
      ),
      {
        key: "detail",
        label: "What it involves",
        type: "content",
        eyebrow: "The approach",
        title: "The work is easier to manage when it is visible.",
        body: "We structure communication, sequencing and reviews around the agreed scope so issues can be addressed before they become expensive delays.",
        items: [t("Programme coordination"), t("Trade and site alignment"), t("Progress communication"), t("Quality and close-out")],
        media_url: IMG.documents,
        settings: { theme: "white", layout: "checklist", note: "TO CONFIRM — publish only once project management is a confirmed standalone service." },
      },
      cta("Discuss project management.", "Tell us about the project and where you need support."),
    ],
  },

  /* --------------------------------------------------------- PROJECTS --- */
  {
    path: "/projects",
    label: "Projects",
    group: "Main",
    seo: {
      title: "Projects & Portfolio | Siraj Builders",
      description: "Explore completed and ongoing Siraj Builders projects across residential, commercial and renovation work.",
    },
    sections: [
      hero(
        "Projects",
        "Projects that show how we work.",
        "A portfolio should do more than display attractive photographs. It should show the thinking, scope and execution behind the finished project.",
        IMG.crane
      ),
      {
        key: "grid",
        label: "Portfolio",
        type: "projects",
        eyebrow: "Portfolio",
        title: "Completed and ongoing work.",
        body: "Each case study follows the same structure: the client requirement, the challenge, our approach, the execution and the result.",
        settings: { theme: "light", layout: "portfolio" },
      },
      cta(
        "Have a similar project in mind?",
        "Tell us what you are planning. We will explain how we would approach it.",
        "Discuss Your Project",
        "/consultation",
        { cta2_label: "Explore Our Services", cta2_href: "/services" }
      ),
    ],
  },

  /* ------------------------------------------------------ OUR PROCESS --- */
  {
    path: "/our-process",
    label: "Our Process",
    group: "Main",
    seo: {
      title: "Our Construction Process | Siraj Builders",
      description: "See how Siraj Builders approaches construction projects from consultation and planning through execution, quality review and handover.",
    },
    sections: [
      hero(
        "Our process",
        "A construction process you can understand.",
        "The purpose of our process is simple: reduce uncertainty.",
        IMG.plans
      ),
      {
        key: "steps",
        label: "Process steps",
        type: "process",
        eyebrow: "Eight stages",
        title: "From the first conversation to handover.",
        items: [
          t("Consultation", "We start by understanding what you want to build, why you are building it and what matters most to you."),
          t("Site Assessment", "We review the property and identify practical considerations relevant to the project."),
          t("Planning & Design", "The project requirements are translated into an organised scope and the necessary design and planning work."),
          t("Estimation & Scope", "The project is reviewed in commercial and practical terms so the client understands what is included."),
          t("Project Preparation", "Before execution begins, the required coordination, materials, people and site activities are organised."),
          t("Construction & Supervision", "The agreed work moves into execution with appropriate site coordination and supervision."),
          t("Quality Review", "Completed work is reviewed and outstanding issues are identified for resolution."),
          t("Handover", "The completed project is reviewed with the client and the handover process is completed."),
        ],
        settings: { theme: "white", layout: "timeline" },
      },
      {
        key: "details",
        label: "Workflow details (to confirm)",
        type: "content",
        eyebrow: "Working details",
        title: "Approvals, payment milestones and reporting.",
        body: "",
        enabled: false,
        settings: { theme: "light", layout: "centered", note: "TO CONFIRM — exact workflow, approvals, payment milestones and reporting process. Switch on once confirmed." },
      },
      cta(
        "Start at step one.",
        "The consultation is where we understand your requirements, property and objectives.",
        "Request a Consultation",
        "/consultation",
        { cta2_label: "Read the FAQs", cta2_href: "/faq" }
      ),
    ],
  },

  /* --------------------------------------------------------- TESTIMONIALS */
  {
    path: "/testimonials",
    label: "Testimonials",
    group: "Main",
    seo: {
      title: "Client Testimonials | Siraj Builders",
      description: "What clients say about working with Siraj Builders — verified feedback only.",
    },
    sections: [
      hero(
        "Testimonials",
        "What our clients say about working with us.",
        "Only verified feedback from real clients appears on this page.",
        IMG.meeting
      ),
      {
        key: "list",
        label: "Testimonials",
        type: "testimonials",
        eyebrow: "Client feedback",
        title: "In their words.",
        settings: { theme: "light", layout: "full" },
      },
      cta("Talk to us about your project.", "Tell us what you are planning and we will explain the next step."),
    ],
  },

  /* -------------------------------------------------------------- FAQ --- */
  {
    path: "/faq",
    label: "FAQ",
    group: "Main",
    seo: {
      title: "FAQs | Siraj Builders",
      description: "Answers to common questions about starting a construction project with Siraj Builders — estimates, timelines, process and contact.",
    },
    sections: [
      hero(
        "FAQs",
        "Questions clients ask before starting.",
        "Straight answers about how a project begins, how estimates and timelines work, and what happens after you contact us.",
        IMG.documents
      ),
      {
        key: "list",
        label: "All questions",
        type: "faq",
        eyebrow: "Frequently asked",
        title: "Browse by topic.",
        settings: { theme: "white", layout: "full" },
      },
      cta(
        "Still planning your project?",
        "Discuss it with our team — the questions you have now are the right place to start.",
        "Discuss Your Project",
        "/consultation",
        { cta2_label: "Contact Us", cta2_href: "/contact-us" }
      ),
    ],
  },

  /* ---------------------------------------------------------- CONTACT --- */
  {
    path: "/contact-us",
    label: "Contact",
    group: "Main",
    seo: {
      title: "Contact Siraj Builders | Discuss Your Construction Project",
      description: "Contact Siraj Builders to discuss residential, commercial or renovation construction requirements and arrange an initial project consultation.",
    },
    sections: [
      hero(
        "Contact",
        "Let's talk about your project.",
        "Whether you are still exploring your options or already have drawings and a defined scope, the best place to begin is a conversation.",
        IMG.meeting
      ),
      {
        key: "details",
        label: "Contact details",
        type: "contact",
        eyebrow: "Get in touch",
        title: "Tell us what you’re planning.",
        body: "Use the project enquiry form to share a little about the property, what you have in mind and where you need help. We’ll use that information to guide the next step.",
        settings: { theme: "light", layout: "cards" },
      },
      {
        key: "form",
        label: "Contact form",
        type: "contact",
        eyebrow: "Contact form",
        title: "Tell us about your project.",
        body: "The more we understand about your project, the better we can guide the initial conversation.",
        items: [
          t("Property location"),
          t("Project type and intended use"),
          t("Plot or property size"),
          t("Drawings or documents"),
          t("Desired scope and timing"),
        ],
        settings: { theme: "white", layout: "form" },
      },
    ],
  },

  /* ----------------------------------------------------- CONSULTATION --- */
  {
    path: "/consultation",
    label: "Consultation",
    group: "Main",
    seo: {
      title: "Request a Consultation | Siraj Builders",
      description: "Start with clarity. Share your project requirements and request an initial consultation with Siraj Builders.",
    },
    sections: [
      hero(
        "Consultation",
        "Start with clarity. Then build.",
        "A consultation gives us an opportunity to understand your requirements before discussing the appropriate path forward.",
        IMG.plans,
        { subtitle: "No obligation. Plain conversation. Clear next step.", settings: { note: "The consultation form below this hero is built into the page." } }
      ),
      {
        key: "next",
        label: "What happens next",
        type: "process",
        eyebrow: "What happens next",
        title: "A simple path from first message to first conversation.",
        body: "After receiving your information, the team reviews the requirements and determines the appropriate next step.",
        items: [
          t("You share the basics", "Fill in the form with your project type, property details and what you are planning."),
          t("We review the details", "Our team reads through your information and considers what the project requires."),
          t("We reach out", "We contact you to clarify anything unclear and arrange an initial conversation."),
          t("We agree on next steps", "Together we decide what the appropriate next step looks like — or that it isn't the right fit."),
        ],
        settings: { theme: "light" },
      },
      cta(
        "Not ready to fill in a form?",
        "Look through our work or read how we manage a project first.",
        "View Our Projects",
        "/projects",
        { cta2_label: "See How We Work", cta2_href: "/our-process" }
      ),
    ],
  },

  /* ------------------------------------------------------- LEADERSHIP --- */
  {
    path: "/leadership",
    label: "Leadership",
    group: "Company",
    seo: {
      title: "Leadership | Siraj Builders",
      description: "Clear roles and responsibility behind every Siraj Builders project.",
    },
    sections: [
      hero(
        "Leadership",
        "Well-managed projects start with clear responsibility.",
        "Leadership in construction means knowing who decides what, coordinating across teams and being accountable for delivery.",
        IMG.meeting
      ),
      {
        key: "team",
        label: "Team profiles",
        type: "team",
        eyebrow: "Our team",
        title: "The people behind the work.",
        settings: { theme: "light" },
      },
      {
        key: "detail",
        label: "How responsibility works",
        type: "features",
        eyebrow: "How we lead",
        title: "Clear roles create better momentum.",
        body: "Decisions have owners, sites have leads and clients have a clear path for questions and updates.",
        items: [t("Accountability"), t("Communication"), t("Coordination"), t("Responsible decisions")],
        settings: { theme: "white", layout: "numbered" },
      },
      cta("Meet the team behind your project.", "Start with a conversation about what you are planning."),
    ],
  },

  /* ------------------------------------------- SUPPORTING / RESOURCES --- */
  {
    path: "/project-showcase",
    label: "Project Visibility",
    group: "Company",
    seo: { title: "Project Visibility | Siraj Builders", description: "How Siraj Builders keeps progress, decisions and responsibilities visible to clients throughout a project." },
    sections: [
      hero("Project visibility", "Know what is happening, and what comes next.", "Construction becomes easier to live with when progress, decisions and responsibilities stay visible to the people paying for the work.", IMG.documents),
      {
        key: "detail",
        label: "How visibility works",
        type: "features",
        eyebrow: "The approach",
        title: "The work is easier to manage when it is visible.",
        body: "We structure communication around the agreed scope: what has been completed, what is under way, and where a client decision is needed next. Reporting format and frequency are agreed per project.",
        items: [
          t("Structured progress updates", "What has been completed and what is under way."),
          t("Documented decisions", "Choices recorded so they can be traced later."),
          t("Defined responsibilities", "Everyone knows what they own."),
          t("Clear next steps", "Where a client decision is needed, and when."),
        ],
        settings: { theme: "white", layout: "grid" },
      },
      cta("See how this would work on your project.", "We agree the reporting format with every client."),
    ],
  },
  {
    path: "/role-definition",
    label: "Project Roles",
    group: "Company",
    seo: { title: "Project Roles | Siraj Builders", description: "How responsibilities are defined on a Siraj Builders project." },
    sections: [
      hero("Project roles", "Every project role, clearly defined.", "Projects move better when everyone knows what they own, what they do not own and where the handoffs happen.", IMG.site),
      { key: "detail", label: "Roles", type: "features", eyebrow: "Clarity reduces overlap", title: "Who does what.", body: "We define responsibilities around the project so decisions do not sit unanswered and important work does not fall between roles.", items: [t("Client direction"), t("Project management"), t("Site supervision"), t("Specialist coordination")], settings: { theme: "white", layout: "numbered" } },
      cta("Discuss how your project would be organised.", "Start with the basics of what you are planning."),
    ],
  },
  {
    path: "/subcontractors",
    label: "Subcontractors",
    group: "Company",
    seo: { title: "Subcontractors & Specialists | Siraj Builders", description: "How specialist work is coordinated around the agreed project." },
    sections: [
      hero("Subcontractors", "Specialists coordinated around the agreed project.", "External specialists add value when their scope, timing and communication remain clear.", IMG.crane),
      { key: "detail", label: "Coordination", type: "content", eyebrow: "The approach", title: "The right specialist in the right sequence.", body: "We coordinate specialist work against the drawings, programme and quality expectations of the wider project.", items: [t("Defined scope"), t("Sequenced work"), t("Site coordination"), t("Quality review")], media_url: IMG.steel, settings: { theme: "white", layout: "checklist" } },
      cta("Discuss your project.", "Tell us what you are planning."),
    ],
  },
  {
    path: "/international",
    label: "Overseas Clients",
    group: "Company",
    published: false,
    seo: { title: "Overseas Clients | Siraj Builders", description: "Clear project coordination when clients are not on site." },
    sections: [
      hero("Overseas clients", "Clear project coordination across distance.", "When clients, consultants or properties are in different locations, communication and documentation matter even more.", IMG.documents),
      { key: "detail", label: "Remote coordination", type: "features", eyebrow: "Make the project visible from anywhere", title: "What remote clients need.", body: "Structured updates, documented decisions and coordinated information help keep remote stakeholders connected to the work.", items: [t("Remote communication"), t("Documented decisions"), t("Local coordination"), t("Visible progress")], settings: { theme: "white", layout: "numbered", note: "TO CONFIRM — whether Siraj Builders actively targets overseas clients." } },
      cta("Building from abroad?", "Share the property details and how you prefer to receive updates."),
    ],
  },
  {
    path: "/affiliates",
    label: "Partners & Affiliates",
    group: "Company",
    seo: { title: "Partners & Specialists | Siraj Builders", description: "How Siraj Builders coordinates specialists so the client has one point of contact." },
    sections: [
      hero("Partners & affiliates", "A connected network, one point of contact.", "Where external specialists or partners are part of a project, roles and responsibilities should remain clear. One coordinated team, one shared scope.", IMG.site),
      { key: "intro", label: "Introduction", type: "intro", eyebrow: "Coordination", title: "Specialists without the split responsibility.", body: "Most construction projects involve more than one discipline — structural work, mechanical and electrical services, design, finishing. Each area benefits from the right specialist.\n\nThe challenge is coordinating them so the client isn't left managing multiple conversations and unclear responsibilities. That is where Siraj Builders steps in as the single point of contact.", media_url: IMG.facade, settings: { theme: "white" } },
      { key: "layers", label: "How coordination works", type: "process", eyebrow: "How coordination works", title: "Three layers that keep a multi-specialist project organised.", items: [t("Scoping the project", "Understanding which specialists are needed, when they'll be needed, and what each one is responsible for."), t("Coordinating the sequence", "Bringing specialists in at the right stage, in the right order, with the right information."), t("Keeping the client informed", "One team, one set of updates, one clear picture of progress and next steps.")], settings: { theme: "light" } },
      { key: "partners", label: "Disciplines", type: "features", eyebrow: "What specialists typically cover", title: "The disciplines a project may involve.", body: "Depending on the project, one or more of these areas may be part of the team. The exact mix is agreed per project.", items: [t("Structural engineering", "Load paths, foundations, framing and structural drawings for the building."), t("MEP services", "Mechanical, electrical and plumbing systems coordinated with the structure."), t("Architectural design", "Planning, layouts, drawings and design coordination before construction.")], settings: { theme: "white", layout: "grid" } },
      cta("Discuss your project.", "One conversation to start, one point of contact throughout."),
    ],
  },
  {
    path: "/locations",
    label: "Service Areas",
    group: "Company",
    seo: { title: "Service Areas | Siraj Builders", description: "How Siraj Builders plans around the property and its location." },
    sections: [
      hero("Service areas", "A project approach that starts with the property itself.", "Site conditions, access, local requirements and the surrounding context all shape how construction should be planned.", IMG.map),
      { key: "areas", label: "Areas served (to confirm)", type: "content", eyebrow: "Where we work", title: "Areas we serve.", body: "", enabled: false, settings: { theme: "light", layout: "centered", note: "TO CONFIRM — primary city, service areas and specific housing societies. Critical for SEO. Switch on once confirmed." } },
      { key: "detail", label: "Every location is different", type: "features", eyebrow: "Every location has its own realities", title: "What we look at first.", body: "We begin by understanding the property and its context before fixing the scope, sequence or delivery assumptions.", items: [t("Property assessment"), t("Access and logistics"), t("Local coordination"), t("Project-specific planning")], settings: { theme: "white", layout: "numbered" } },
      cta("Tell us where your property is.", "Location is one of the first things we need to understand."),
    ],
  },
  {
    path: "/cost-index",
    label: "Cost Guidance",
    group: "Company",
    seo: { title: "Construction Cost Guidance | Siraj Builders", description: "What shapes construction cost, and why a project-specific estimate starts with a clear scope." },
    sections: [
      hero("Cost guidance", "Construction cost becomes clearer when the scope is clear.", "There is no useful universal price without understanding size, specifications, site conditions, materials and intended outcome.", IMG.steel),
      { key: "detail", label: "What shapes cost", type: "features", eyebrow: "Start with decisions, not a guess", title: "The variables that shape cost.", body: "Use the initial conversation to clarify the project variables that shape cost, then develop a project-specific basis for discussion.", items: [t("Scope"), t("Size and site"), t("Materials"), t("Finishes and services")], settings: { theme: "white", layout: "numbered" } },
      cta("Get a project-specific estimate.", "An estimate is prepared from the scope, drawings and specifications — start by sharing yours.", "Request a Consultation"),
    ],
  },

  /* ------------------------------------------------------------ LEGAL --- */
  {
    path: "/privacy-policy",
    label: "Privacy Policy",
    group: "Legal",
    seo: { title: "Privacy Policy | Siraj Builders", description: "How Siraj Builders uses information shared through this website." },
    sections: [
      hero("Privacy policy", "Your project information should be handled with care.", "We use information shared through this website to understand project requirements and respond to enquiries.", ""),
      {
        key: "body",
        label: "Policy text",
        type: "content",
        eyebrow: "Summary",
        title: "Clear information, clear purpose.",
        body: "Only share the details needed to help us understand your enquiry. Contact details and project information submitted through the contact or consultation forms are used to respond to the conversation you requested and to determine the appropriate next step.\n\nIf you have a question about the information you have shared, contact us through the details on the Contact page.",
        settings: { theme: "white", layout: "prose", note: "Have the final privacy policy reviewed before launch." },
      },
    ],
  },
  {
    path: "/terms",
    label: "Terms & Conditions",
    group: "Legal",
    seo: { title: "Terms & Conditions | Siraj Builders", description: "Terms for using the Siraj Builders website." },
    sections: [
      hero("Terms & conditions", "A clear starting point for using this website.", "These terms describe the basic expectations when browsing the Siraj Builders website and submitting an enquiry.", ""),
      {
        key: "body",
        label: "Terms text",
        type: "content",
        eyebrow: "Summary",
        title: "Useful information, responsibly presented.",
        body: "Website content is provided as general project information. Final scope, pricing, timing and responsibilities are always confirmed for the individual project.\n\nSubmitting an enquiry does not create an agreement. Any project proceeds only on terms agreed in writing.",
        settings: { theme: "white", layout: "prose", note: "Have the final terms reviewed before launch." },
      },
    ],
  },
];

/* ==========================================================================
 * FAQs — documentation section 12, all 20 questions, in order.
 * Questions marked [TO CONFIRM] are seeded UNPUBLISHED with no answer.
 * ======================================================================== */

const FAQ_CATEGORIES = [
  { key: "start", label: "Getting started", sort_order: 10 },
  { key: "services", label: "Services", sort_order: 20 },
  { key: "cost", label: "Cost & payments", sort_order: 30 },
  { key: "process", label: "Process & updates", sort_order: 40 },
  { key: "contact", label: "Areas & contact", sort_order: 50 },
];

const FAQS = [
  ["start", "How do I start a project with Siraj Builders?", "Start by sharing your project requirements, property location and the type of construction work you need. Our team can then determine the appropriate next step.", true],
  ["process", "Do you provide site visits?", null],
  ["cost", "How is a construction estimate prepared?", "An estimate should be based on the project's scope, drawings/specifications, property conditions, materials and other relevant requirements.", true],
  ["services", "Can you construct a complete house?", null],
  ["services", "Do you provide grey structure construction?", null],
  ["services", "Do you handle finishing work?", null],
  ["services", "Do you provide architectural design?", null],
  ["services", "Can you renovate an existing property?", null],
  ["process", "How long does construction take?", "Project duration depends on the property's size, scope, design, site conditions, materials and other factors. A project-specific timeline should be discussed after the scope is established.", true],
  ["cost", "Can I provide my own materials?", null],
  ["cost", "How are payments structured?", null],
  ["process", "How do clients receive project updates?", null],
  ["process", "Who supervises the project?", null],
  ["services", "Do you work on commercial projects?", null],
  ["contact", "Which areas do you serve?", null],
  ["services", "Can you work from existing architectural drawings?", null],
  ["services", "Can you help with material selection?", null],
  ["start", "What information should I provide for an initial discussion?", "Ideally, provide the property location, plot/property size, project type, intended use, expected start period and any drawings or requirements already available.", true],
  ["services", "Do you offer project management?", null],
  ["contact", "How do I request a quotation?", "Use the consultation/contact form or contact Siraj Builders directly through the available communication channels.", true],
].map(([category, question, answer, home], index) => ({
  category,
  question,
  answer: answer || "",
  is_active: Boolean(answer),
  show_on_home: Boolean(home),
  sort_order: (index + 1) * 10,
}));

/* ==========================================================================
 * SERVICES — documented card copy. Only fills blank fields in the database.
 * ======================================================================== */

const SERVICES = [
  { slug: "residential-construction", title: "Residential Construction", summary: "From planning through construction and finishing, we help homeowners move from an initial requirement to a completed property with a structured approach.", cta_label: "Explore Residential Construction", image_url: IMG.house, confirmed: true },
  { slug: "commercial-construction", title: "Commercial Construction", summary: "Functional commercial spaces require coordination, planning and an understanding of how the finished property will actually be used.", cta_label: "Explore Commercial Construction", image_url: IMG.office, confirmed: true },
  { slug: "renovation-remodelling", title: "Renovation & Remodelling", summary: "Improve an existing property without losing sight of its structure, functionality or intended use.", cta_label: "Explore Renovation", image_url: IMG.interior, confirmed: true },
  { slug: "design-architecture", title: "Design & Architecture", summary: "Where design services are offered, this can cover planning, design coordination and documentation before construction begins.", cta_label: "Explore Design Services", image_url: IMG.city, confirmed: false },
  { slug: "grey-structure", title: "Grey Structure", summary: "The structural stage that sets the quality, alignment and sequencing of the entire build.", cta_label: "Explore Grey Structure", image_url: IMG.structure, confirmed: false },
  { slug: "turnkey-construction", title: "Turnkey Construction", summary: "One coordinated route from initial brief to completed property.", cta_label: "Explore Turnkey Construction", image_url: IMG.steel, confirmed: false },
  { slug: "project-management", title: "Project Management", summary: "Keep decisions, people and progress moving together across every construction stage.", cta_label: "Explore Project Management", image_url: IMG.documents, confirmed: false },
];

/*
 * Editorial media for sections whose content is already approved/documented.
 * These are atmosphere and process visuals; project-specific galleries stay
 * in Projects so stock photography is never presented as completed work.
 * Empty-only fills keep an admin's own media intact in the live CMS.
 */
const VIDEO = {
  coordination: "https://videos.pexels.com/video-files/7825537/7825537-hd_1920_1080_30fps.mp4",
  site: "https://videos.pexels.com/video-files/5594430/5594430-uhd_3840_2160_25fps.mp4",
};
const SECTION_MEDIA = {
  "/": { process: { video_url: VIDEO.coordination, subtitle: "Pexels stock footage · Coordinating work on site" } },
  "/who-we-are": { story: { media_url: IMG.meeting }, approach: { video_url: VIDEO.coordination, subtitle: "Pexels stock footage · Site coordination" } },
  "/services": { intro: { media_url: IMG.plans }, proof: { media_url: IMG.site, video_url: VIDEO.site, subtitle: "Pexels stock footage · Construction activity" } },
  "/residential-construction": { needs: { media_url: IMG.house }, deliver: { video_url: VIDEO.coordination, subtitle: "Pexels stock footage · On-site coordination" } },
  "/commercial-construction": { focus: { media_url: IMG.officeWide }, approach: { video_url: VIDEO.site, subtitle: "Pexels stock footage · Construction site activity" } },
  "/renovation-remodelling": { objective: { media_url: IMG.interior, video_url: VIDEO.coordination, subtitle: "Pexels stock footage · Coordinated construction work" } },
  "/design-architecture": { scope: { media_url: IMG.documents, video_url: VIDEO.coordination, subtitle: "Pexels stock footage · Planning and coordination" } },
  "/grey-structure": { detail: { video_url: VIDEO.site, subtitle: "Pexels stock footage · Structural work on site" } },
  "/turnkey-construction": { detail: { video_url: VIDEO.coordination, subtitle: "Pexels stock footage · Construction coordination" } },
  "/project-management": { detail: { video_url: VIDEO.coordination, subtitle: "Pexels stock footage · Managing site progress" } },
  "/projects": { grid: { video_url: VIDEO.site, subtitle: "Pexels stock footage · Active construction work" } },
  "/our-process": { steps: { video_url: VIDEO.coordination, subtitle: "Pexels stock footage · Site coordination" } },
  "/leadership": { detail: { media_url: IMG.meeting, video_url: VIDEO.coordination, subtitle: "Pexels stock footage · Team coordination" } },
  "/project-showcase": { detail: { media_url: IMG.documents, video_url: VIDEO.site, subtitle: "Pexels stock footage · Work in progress" } },
  "/role-definition": { detail: { media_url: IMG.plans, video_url: VIDEO.coordination, subtitle: "Pexels stock footage · Team coordination" } },
  "/subcontractors": { detail: { video_url: VIDEO.site, subtitle: "Pexels stock footage · Specialist work on site" } },
  "/international": { detail: { media_url: IMG.documents, video_url: VIDEO.coordination, subtitle: "Pexels stock footage · Coordinating work across a project" } },
  "/affiliates": { partners: { media_url: IMG.office, video_url: VIDEO.site, subtitle: "Pexels stock footage · Specialist work on site" } },
  "/locations": { detail: { media_url: IMG.map, video_url: VIDEO.site, subtitle: "Pexels stock footage · Site activity" } },
  "/cost-index": { detail: { media_url: IMG.plans, video_url: VIDEO.coordination, subtitle: "Pexels stock footage · Planning project scope" } },
  "/faq": { list: { video_url: VIDEO.coordination, subtitle: "Pexels stock footage · Planning a construction project" } },
  "/consultation": { next: { video_url: VIDEO.coordination, subtitle: "Pexels stock footage · Preparing for a project conversation" } },
};
for (const page of PAGES) {
  const overrides = SECTION_MEDIA[page.path] || {};
  for (const section of page.sections) {
    const media = overrides[section.key];
    if (!media) continue;
    for (const [field, value] of Object.entries(media)) {
      if (!section[field]) section[field] = value;
    }
  }
}

/* ==========================================================================
 * SITE SETTINGS added by this release (existing keys are untouched).
 * ======================================================================== */

const SETTINGS = [
  ["header_cta_label", "Discuss Your Project", "navigation", "Header button text", 10],
  ["header_cta_href", "/consultation", "navigation", "Header button link", 20],
  ["footer_cta_title", "Have a project in mind? Let's talk.", "footer", "Footer call-to-action heading", 20],
  ["footer_cta_label", "Discuss Your Project", "footer", "Footer button text", 30],
  ["footer_cta_href", "/consultation", "footer", "Footer button link", 40],
  ["whatsapp_cta_label", "Chat About Your Project", "contact", "WhatsApp button text", 60],
  ["whatsapp_message", "Hello Siraj Builders, I'd like to discuss a construction project.\n\nProject type: \nLocation: \nProperty/Plot size: \nExpected start: \n\nI'd like to understand the next steps and discuss my requirements.", "contact", "WhatsApp pre-filled message", 70],
  ["form_success_message", "Thank you. Your project details have been received. Our team will review the information and contact you regarding the next step.", "forms", "Form success message", 10],
  ["form_microcopy", "Your information is used to understand your project and determine the appropriate next step.", "forms", "Text under the forms", 20],
  ["default_og_image", "", "seo", "Default social-share image URL", 30],
];

module.exports = { IMG, PAGES, FAQ_CATEGORIES, FAQS, SERVICES, SETTINGS };
