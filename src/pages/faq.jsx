import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import useReveal from "../hooks/useReveal";
import useContent from "../hooks/useContent";
import { faqs as faqService } from "../services/content";
import "../styles/faq.css";

/* ============================================================
   FAQ DATA
   ============================================================ */
/**
 * The 19 documented questions, kept as the fallback for when Supabase has no
 * credentials, is unreachable, or the faqs table is empty.
 */
const STATIC_FAQ_GROUPS = [
  {
    key: "services",
    label: "Services",
    count: "04",
    items: [
      {
        q: "What services does Siraj Builders provide?",
        a: "Siraj Builders presents services around residential construction, commercial construction, renovation and remodelling, and other project delivery services shown on the website. The exact scope available for a particular project should be confirmed during the initial discussion.",
      },
      {
        q: "What types of construction projects do you handle?",
        a: "The website is structured around residential, commercial and renovation projects. Project suitability depends on the required scope, property and delivery requirements.",
      },
      {
        q: "Do you work on residential projects?",
        a: "Yes. Residential construction is presented as a core service, covering a structured approach from initial requirements through construction, finishing and handover, subject to the agreed scope.",
      },
      {
        q: "Do you handle commercial construction?",
        a: "Commercial construction is presented as a service focused on functional spaces, coordination, site supervision, material management, quality review and completion, with capabilities confirmed per project.",
      },
    ],
  },
  {
    key: "start",
    label: "Getting started",
    count: "03",
    items: [
      {
        q: "How do I start a construction project with Siraj Builders?",
        a: "Start by sharing the property location, project type, approximate size, intended use, desired scope and any drawings or requirements you already have. This provides a basis for the initial conversation.",
      },
      {
        q: "What information is needed before starting a project?",
        a: "Useful information includes the property location, plot or property size, project type, intended use, expected start period, available drawings and your main requirements.",
      },
      {
        q: "How is the project scope determined?",
        a: "The scope is developed by understanding the project requirements, property conditions, drawings or specifications and the work that needs to be coordinated. The final scope should be agreed before execution begins.",
      },
    ],
  },
  {
    key: "cost",
    label: "Cost & estimates",
    count: "03",
    items: [
      {
        q: "How is a construction estimate prepared?",
        a: "An estimate should reflect the agreed scope, drawings or specifications, property conditions, materials and other relevant project requirements. A project-specific estimate should be discussed after the scope is understood.",
      },
      {
        q: "What factors affect construction costs?",
        a: "Costs can vary with project size, scope, design requirements, site conditions, materials, finishes, specifications and other project-specific decisions. There is no single reliable price without understanding those factors.",
      },
      {
        q: "Can I request a project quotation?",
        a: "Yes. You can use the consultation or contact form to share the basics of your project. The team can then determine the appropriate next step and quotation process.",
      },
    ],
  },
  {
    key: "timeline",
    label: "Timeline",
    count: "02",
    items: [
      {
        q: "How long does a construction project usually take?",
        a: "There is no universal timeline. Duration depends on the property size, scope, design, site conditions, materials and other factors. A project-specific timeline should be discussed once the scope is established.",
      },
      {
        q: "What factors can affect the project timeline?",
        a: "Changes in scope, design decisions, site conditions, material availability, coordination requirements and other project-specific circumstances can affect timing. The agreed project plan should be used as the reference point.",
      },
    ],
  },
  {
    key: "process",
    label: "Process & communication",
    count: "03",
    items: [
      {
        q: "What is the typical construction process?",
        a: "The website describes a general route of consultation, site assessment, planning and design, estimation and scope, project preparation, construction and supervision, quality review, and handover.",
      },
      {
        q: "How do you manage project progress?",
        a: "The intended approach is structured coordination and communication so clients can understand what has been completed, what is happening and what comes next. Exact reporting arrangements should be confirmed for each project.",
      },
      {
        q: "How is communication handled during a project?",
        a: "Communication is treated as part of the service. Project discussions should keep requirements, decisions, progress and responsibilities clear throughout the agreed scope.",
      },
    ],
  },
  {
    key: "quality",
    label: "Quality & materials",
    count: "02",
    items: [
      {
        q: "How do you maintain construction quality?",
        a: "Quality is approached through planning, appropriate materials and specifications, workmanship, site supervision and a review of completed work. Specific standards or warranties should be confirmed rather than assumed.",
      },
      {
        q: "How are materials selected?",
        a: "Material choices should reflect the project requirements, specifications, intended use, budget and agreed scope. Specific material-selection support should be discussed for the project.",
      },
    ],
  },
  {
    key: "contact",
    label: "Contact",
    count: "02",
    items: [
      {
        q: "How can I request a consultation?",
        a: "Use the Contact page to provide your project details and request a consultation. The information helps establish the appropriate next step.",
      },
      {
        q: "How can I contact Siraj Builders?",
        a: "Use the website Contact page to submit your project information. Phone, WhatsApp, email and office details can be connected when the verified company details are available.",
      },
    ],
  },
];

async function loadFaqGroups() {
  const groups = await faqService.listGrouped();
  // Drop categories that have no live questions — an empty filter tab is a
  // dead end for the visitor.
  return groups.filter((group) => group.items.length > 0);
}

/* ============================================================
   PAGE
   ============================================================ */
export default function Faq() {
  useReveal();

  const { data: FAQ_GROUPS } = useContent(loadFaqGroups, STATIC_FAQ_GROUPS);

  /* Category tabs and the total are derived from whatever is loaded, so the
     counts can never drift out of step with the questions the way a
     hardcoded list would. */
  const CATEGORY_BUTTONS = useMemo(
    () => [
      {
        key: "all",
        label: "All questions",
        count: FAQ_GROUPS.reduce((sum, group) => sum + group.items.length, 0),
      },
      ...FAQ_GROUPS.map((group) => ({
        key: group.key,
        label: group.label,
        count: group.items.length,
      })),
    ],
    [FAQ_GROUPS]
  );

  const TOTAL_QUESTIONS = useMemo(
    () => FAQ_GROUPS.reduce((sum, group) => sum + group.items.length, 0),
    [FAQ_GROUPS]
  );

  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [openIds, setOpenIds] = useState(() => new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  /* ---------- Filter + group ---------- */
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ_GROUPS.map((group) => {
      const catMatch = activeCat === "all" || activeCat === group.key;
      if (!catMatch) return { ...group, items: [] };

      const items = group.items.filter((item) => {
        if (!q) return true;
        return (
          item.q.toLowerCase().includes(q) ||
          item.a.toLowerCase().includes(q)
        );
      });
      return { ...group, items };
    }).filter((group) => group.items.length > 0);
  }, [query, activeCat, FAQ_GROUPS]);

  const visibleCount = useMemo(
    () => filteredGroups.reduce((sum, group) => sum + group.items.length, 0),
    [filteredGroups],
  );

  const hasResults = visibleCount > 0;

  /* ---------- Handlers ---------- */
  function toggleItem(id) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setAllExpanded(false);
  }

  function toggleAll() {
    if (allExpanded) {
      setOpenIds(new Set());
      setAllExpanded(false);
    } else {
      const allIds = new Set();
      filteredGroups.forEach((group) => {
        group.items.forEach((item) => allIds.add(item.q));
      });
      setOpenIds(allIds);
      setAllExpanded(true);
    }
  }

  function clearSearch() {
    setQuery("");
    setActiveCat("all");
    setOpenIds(new Set());
    setAllExpanded(false);
  }

  return (
    <>
      {/* ================= PAGE HERO ================= */}
      <section className="page-hero">
        <div className="page-hero-bg" aria-hidden="true" />
        <div className="hero-glow" aria-hidden="true" />

        {/* question motif */}
        <svg
          className="q-motif"
          viewBox="0 0 400 400"
          fill="none"
          aria-hidden="true"
        >
          <circle className="orbit" cx="200" cy="200" r="150" />
          <circle
            className="orbit"
            cx="200"
            cy="200"
            r="110"
            opacity="0.6"
          />
          <circle className="ring" cx="200" cy="200" r="180" />
          <path
            className="q-path"
            d="M150 130 Q150 80 200 80 Q250 80 250 130 Q250 170 200 190 L200 230"
          />
          <circle className="dot" cx="200" cy="270" r="14" />
        </svg>

        <div className="container">
          <div className="crumbs">Siraj Builders / FAQs</div>
          <span className="eyebrow">Questions, answered clearly</span>
          <h1>
            Everything you need to know
            <span className="accent">before you build.</span>
          </h1>
          <p className="lead">
            A construction project involves decisions about scope, cost, timing
            and communication. Here are clear answers to common questions,
            without promises that depend on a project-specific assessment.
          </p>

          <div className="hero-trust">
            <span>Search what matters</span>
            <span>Filter by topic</span>
            <span>Project-specific answers on request</span>
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="section">
        <div className="container faq-layout">
          {/* ============ SIDEBAR ============ */}
          <aside className="faq-side reveal">
            <div className="side-search">
              <label className="search-label" htmlFor="faqSearch">
                Search questions
              </label>
              <div className="search-field">
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="search"
                  id="faqSearch"
                  placeholder="e.g. estimate, timeline…"
                  autoComplete="off"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button
                  type="button"
                  className={`search-clear${query ? " is-visible" : ""}`}
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="side-cats">
              <h3>Browse by topic</h3>
              <div className="cat-list">
                {CATEGORY_BUTTONS.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    className={`cat-btn${activeCat === cat.key ? " is-active" : ""}`}
                    onClick={() => setActiveCat(cat.key)}
                  >
                    <span className="cat-name">
                      <i />
                      {cat.label}
                    </span>
                    <span className="cat-count">{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="side-help">
              <span className="eyebrow">Need a real answer?</span>
              <h3>Ask about your project.</h3>
              <p>
                Some questions can only be answered once we understand the
                property, scope and requirements.
              </p>
              <Link className="btn btn-primary" to="/consultation">
                Discuss Your Project <span className="arrow">→</span>
              </Link>
            </div>
          </aside>

          {/* ============ MAIN LIST ============ */}
          <div className="faq-main reveal" style={{ "--d": "0.12s" }}>
            <div className="faq-status">
              <span className="current">
                Showing <b>{visibleCount}</b> of {TOTAL_QUESTIONS} questions
              </span>
              <button
                type="button"
                className="expand-all"
                onClick={toggleAll}
                disabled={!hasResults}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
                </svg>
                {allExpanded ? "Collapse all" : "Expand all"}
              </button>
            </div>

            {/* ---------- FILTERED GROUPS ---------- */}
            {filteredGroups.map((group) => (
              <div className="faq-group" key={group.key}>
                <div className="group-head">
                  <h3>{group.label}</h3>
                  <span className="group-count">
                    {String(group.items.length).padStart(2, "0")} questions
                  </span>
                </div>

                {group.items.map((item) => {
                  const isOpen = openIds.has(item.q);
                  return (
                    <div
                      className={`faq-item${isOpen ? " is-open" : ""}`}
                      key={item.q}
                    >
                      <button
                        type="button"
                        className="faq-q"
                        aria-expanded={isOpen}
                        onClick={() => toggleItem(item.q)}
                      >
                        <span>{item.q}</span>
                        <span className="faq-icon" aria-hidden="true" />
                      </button>
                      <div
                        className="faq-a"
                        style={{ maxHeight: isOpen ? "600px" : 0 }}
                      >
                        <div className="faq-a-inner">{item.a}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* ---------- EMPTY STATE ---------- */}
            {!hasResults && (
              <div className="faq-empty is-visible">
                <svg
                  viewBox="0 0 24 24"
                  width="44"
                  height="44"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <h3>No matching questions</h3>
                <p>
                  Try a different word, or clear the search to see all{" "}
                  {TOTAL_QUESTIONS} questions again.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={clearSearch}
                >
                  Clear search <span className="arrow">→</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= SUPPORT CARDS ================= */}
      <section className="section light">
        <div className="container">
          <div
            className="reveal"
            style={{
              maxWidth: 620,
              marginBottom: "clamp(2rem, 4vw, 3rem)",
            }}
          >
            <span className="eyebrow">Still need help?</span>
            <h2 className="h2">Three ways to move forward.</h2>
            <p className="muted">
              If the answers above don't cover your situation, the quickest path
              is to share the basics of your project.
            </p>
          </div>

          <div className="support-grid" data-stagger>
            <article className="support-card reveal">
              <div className="support-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <h3>Start a conversation</h3>
              <p>
                Share your property, scope and intended outcome. We'll review it
                and come back with the right next step.
              </p>
              <Link className="link" to="/consultation">
                Discuss your project <span aria-hidden="true">→</span>
              </Link>
            </article>

            <article className="support-card reveal">
              <div className="support-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3>See how we work</h3>
              <p>
                Understand the process, from consultation through handover,
                before you commit to anything.
              </p>
              <Link className="link" to="/our-process">
                View our process <span aria-hidden="true">→</span>
              </Link>
            </article>

            <article className="support-card reveal">
              <div className="support-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
                </svg>
              </div>
              <h3>See the work</h3>
              <p>
                Look through completed and ongoing projects to see how the
                approach translates into real work.
              </p>
              <Link className="link" to="/projects">
                View projects <span aria-hidden="true">→</span>
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* ================= CTA BANNER ================= */}
      <section className="banner">
        <div className="container banner-inner">
          <div className="reveal">
            <span className="eyebrow">Still planning?</span>
            <h2 className="h2">Have a question specific to your project?</h2>
            <p>
              Share the property, scope and intended outcome. A project
              conversation is the right place to clarify details that a general
              FAQ cannot answer.
            </p>
          </div>
          <div className="banner-cta reveal" style={{ "--d": "0.15s" }}>
            <Link className="btn btn-light" to="/consultation">
              Discuss Your Project <span className="arrow">→</span>
            </Link>
            <Link className="btn btn-outline" to="/contact-us">
              Contact Us <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}