import { Link } from "react-router-dom";
import useReveal from "../hooks/useReveal";
import "../styles/affiliates.css";

export default function Affiliates() {
  useReveal();

  return (
    <>
      {/* ==================== HERO ==================== */}
      <section className="aff-hero">
        <div className="aff-hero-bg" aria-hidden="true" />
        <div className="aff-hero-glow" aria-hidden="true" />

        {/* Network motif */}
        <svg
          className="aff-network"
          viewBox="0 0 500 500"
          fill="none"
          aria-hidden="true"
        >
          <circle className="aff-ring" cx="250" cy="250" r="80" />
          <circle className="aff-ring" cx="250" cy="250" r="140" />
          <circle className="aff-ring" cx="250" cy="250" r="205" />

          <line className="aff-link" x1="120" y1="140" x2="250" y2="100" />
          <line className="aff-link" x1="250" y1="100" x2="400" y2="180" />
          <line className="aff-link" x1="400" y1="180" x2="380" y2="340" />
          <line className="aff-link" x1="380" y1="340" x2="220" y2="400" />
          <line className="aff-link" x1="220" y1="400" x2="120" y2="140" />
          <line className="aff-link" x1="250" y1="100" x2="250" y2="250" />
          <line className="aff-link" x1="120" y1="140" x2="250" y2="250" />
          <line className="aff-link" x1="400" y1="180" x2="250" y2="250" />
          <line className="aff-link" x1="380" y1="340" x2="250" y2="250" />
          <line className="aff-link" x1="220" y1="400" x2="250" y2="250" />

          <circle className="aff-node" cx="120" cy="140" r="5" />
          <circle className="aff-node" cx="250" cy="100" r="5" />
          <circle className="aff-node" cx="400" cy="180" r="5" />
          <circle className="aff-node" cx="380" cy="340" r="5" />
          <circle className="aff-node" cx="220" cy="400" r="5" />

          <circle
            className="aff-node aff-node--core"
            cx="250"
            cy="250"
            r="9"
          />
        </svg>

        <div className="container aff-hero-inner">
          <div className="aff-hero-copy">
            <div className="crumbs">Siraj Builders / Affiliates</div>
            <span className="eyebrow">Affiliates</span>
            <h1>
              A connected network
              <span className="accent">around project delivery.</span>
            </h1>
            <p className="lead">
              Where external specialists or partners are part of a project,
              roles and responsibilities should remain clear. One coordinated
              team, one point of contact, one shared scope.
            </p>
            <div className="aff-trust">
              <span>Defined roles</span>
              <span>Coordinated specialists</span>
              <span>One clear point of contact</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== INTRO ==================== */}
      <section className="aff-section">
        <div className="container aff-intro">
          <div className="aff-intro-copy reveal">
            <span className="aff-index">01 · How affiliates fit</span>
            <h2 className="aff-h2">
              Specialists without the <em>split responsibility.</em>
            </h2>
            <p className="muted">
              Most construction projects involve more than one discipline —
              structural work, mechanical and electrical services, design,
              finishing. Each area benefits from the right specialist.
            </p>
            <p className="muted">
              The challenge isn't finding them. It's coordinating them so the
              client isn't left managing multiple conversations and unclear
              responsibilities. That's where Siraj Builders steps in as the
              single point of contact.
            </p>

            <ul className="aff-pills">
              <li className="aff-pill">
                <span className="aff-pill-num">01</span>
                <div className="aff-pill-body">
                  <b>Defined roles</b>
                  <span>
                    Each specialist has a clear scope and clear responsibility.
                  </span>
                </div>
              </li>
              <li className="aff-pill">
                <span className="aff-pill-num">02</span>
                <div className="aff-pill-body">
                  <b>Coordinated sequence</b>
                  <span>
                    Work is sequenced so specialists fit together properly.
                  </span>
                </div>
              </li>
              <li className="aff-pill">
                <span className="aff-pill-num">03</span>
                <div className="aff-pill-body">
                  <b>One point of contact</b>
                  <span>Clients talk to one team, not five.</span>
                </div>
              </li>
              <li className="aff-pill">
                <span className="aff-pill-num">04</span>
                <div className="aff-pill-body">
                  <b>Shared standards</b>
                  <span>Everyone works to the same quality expectation.</span>
                </div>
              </li>
            </ul>

            <Link className="btn btn-primary" to="/contact-us">
              Discuss Your Project <span className="arrow">→</span>
            </Link>
          </div>

          <div className="aff-intro-visual reveal">
            <img
              className="aff-intro-img"
              src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1600&q=85"
              alt="Coordinated construction work"
              loading="lazy"
            />
            <div className="aff-intro-badge">
              <span className="aff-intro-badge-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <div>
                <b>One coordinated team</b>
                <span>Specialists aligned under one scope.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== COORDINATION (dark) ==================== */}
      <section className="aff-section aff-section--dark">
        <div className="container aff-coord">
          <div className="aff-coord-copy reveal">
            <span className="eyebrow">How coordination works</span>
            <h2 className="aff-h2">
              Three layers that keep a multi-specialist project organised.
            </h2>
            <p className="muted">
              Coordination isn't one action — it's a continuous layer that runs
              across the whole project. These three layers are what keep a
              multi-specialist build on track.
            </p>
          </div>

          <div className="aff-layers">
            <div className="aff-layer reveal">
              <span className="aff-layer-num">01</span>
              <b>Scoping the project</b>
              <p className="muted">
                Understanding which specialists are needed, when they'll be
                needed, and what each one is responsible for.
              </p>
            </div>
            <div className="aff-layer reveal">
              <span className="aff-layer-num">02</span>
              <b>Coordinating the sequence</b>
              <p className="muted">
                Bringing specialists in at the right stage, in the right order,
                with the right information.
              </p>
            </div>
            <div className="aff-layer reveal">
              <span className="aff-layer-num">03</span>
              <b>Keeping the client informed</b>
              <p className="muted">
                One team, one set of updates, one clear picture of progress and
                next steps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SPECIALIST ROLES ==================== */}
      <section className="aff-section aff-section--light">
        <div className="container">
          <div className="aff-head">
            <div className="reveal">
              <span className="eyebrow">What specialists typically cover</span>
              <h2 className="aff-h2">
                The disciplines a project may involve.
              </h2>
            </div>
            <div className="reveal">
              <p className="muted">
                Depending on the project, one or more of these areas may be part
                of the team. The exact mix is agreed per project.
              </p>
            </div>
          </div>

          <div className="aff-roles">
            <article className="aff-role reveal">
              <div className="aff-role-top">
                <span className="aff-role-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2 2 12l10 10 10-10L12 2z" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                </span>
                <span className="aff-role-num">01</span>
              </div>
              <h3>Structural engineering</h3>
              <p className="muted">
                Load paths, foundations, framing and structural drawings for the
                building.
              </p>
            </article>

            <article className="aff-role reveal">
              <div className="aff-role-top">
                <span className="aff-role-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </span>
                <span className="aff-role-num">02</span>
              </div>
              <h3>MEP services</h3>
              <p className="muted">
                Mechanical, electrical and plumbing systems coordinated with the
                structure.
              </p>
            </article>

            <article className="aff-role reveal">
              <div className="aff-role-top">
                <span className="aff-role-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 21h18M5 21V8l7-5 7 5v13" />
                    <path d="M9 21v-6h6v6M9 12h6" />
                  </svg>
                </span>
                <span className="aff-role-num">03</span>
              </div>
              <h3>Architectural design</h3>
              <p className="muted">
                Planning, layouts, drawings and design coordination before
                construction.
              </p>
            </article>

            <article className="aff-role reveal">
              <div className="aff-role-top">
                <span className="aff-role-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 3v18" />
                  </svg>
                </span>
                <span className="aff-role-num">04</span>
              </div>
              <h3>Interior coordination</h3>
              <p className="muted">
                Finishes, joinery and materials aligned to the overall design
                intent.
              </p>
            </article>

            <article className="aff-role reveal">
              <div className="aff-role-top">
                <span className="aff-role-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </span>
                <span className="aff-role-num">05</span>
              </div>
              <h3>Surveys &amp; testing</h3>
              <p className="muted">
                Soil, site, material and quality testing where a project
                requires it.
              </p>
            </article>

            <article className="aff-role reveal">
              <div className="aff-role-top">
                <span className="aff-role-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2 3 8v8l9 6 9-6V8l-9-6z" />
                    <path d="M12 22V12M3 8l9 4 9-4" />
                  </svg>
                </span>
                <span className="aff-role-num">06</span>
              </div>
              <h3>Specialist finishes</h3>
              <p className="muted">
                Waterproofing, facades, custom joinery and other specialist
                trades.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ==================== CTA BANNER ==================== */}
      <section className="aff-banner">
        <div className="container aff-banner-inner">
          <div className="reveal">
            <span className="eyebrow">Start with clarity</span>
            <h2 className="aff-h2">
              Have a project that needs multiple specialists?
            </h2>
            <p>
              Start with the property, scope and intended outcome. We'll confirm
              the right team structure and how it will be coordinated.
            </p>
          </div>
          <div className="aff-banner-cta reveal">
            <Link className="btn btn-light" to="/consultation">
              Discuss Your Project <span className="arrow">→</span>
            </Link>
            <Link className="btn btn-outline" to="/our-process">
              See How We Work <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}