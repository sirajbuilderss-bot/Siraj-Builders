import { Link } from "react-router-dom";
import useReveal from "../hooks/useReveal";
import "../styles/commercial-construction.css";

export default function CommercialConstruction() {
  useReveal();

  return (
    <>
      {/* ==================== HERO ==================== */}
      <section className="cc-hero">
        <div className="cc-hero-bg" aria-hidden="true" />
        <div className="cc-hero-grid" aria-hidden="true" />
        <div className="cc-hero-glow" aria-hidden="true" />

        {/* Wireframe building motif */}
        <svg
          className="cc-hero-motif"
          viewBox="0 0 400 400"
          fill="none"
          aria-hidden="true"
        >
          {/* outer facade */}
          <rect
            className="ccm-outline"
            x="50"
            y="40"
            width="300"
            height="320"
            rx="2"
          />

          {/* floor divisions */}
          <line className="ccm-floor" x1="50" y1="120" x2="350" y2="120" />
          <line className="ccm-floor" x1="50" y1="200" x2="350" y2="200" />
          <line className="ccm-floor" x1="50" y1="280" x2="350" y2="280" />

          {/* ground line */}
          <line className="ccm-ground" x1="20" y1="360" x2="380" y2="360" />

          {/* window rows */}
          <rect className="ccm-win" x="70" y="60" width="35" height="40" />
          <rect className="ccm-win" x="120" y="60" width="35" height="40" />
          <rect className="ccm-win" x="170" y="60" width="35" height="40" />
          <rect className="ccm-win ccm-win--accent" x="220" y="60" width="35" height="40" />
          <rect className="ccm-win" x="270" y="60" width="35" height="40" />

          <rect className="ccm-win" x="70" y="140" width="35" height="40" />
          <rect className="ccm-win ccm-win--accent" x="120" y="140" width="35" height="40" />
          <rect className="ccm-win" x="170" y="140" width="35" height="40" />
          <rect className="ccm-win" x="220" y="140" width="35" height="40" />
          <rect className="ccm-win" x="270" y="140" width="35" height="40" />

          <rect className="ccm-win" x="70" y="220" width="35" height="40" />
          <rect className="ccm-win" x="120" y="220" width="35" height="40" />
          <rect className="ccm-win" x="170" y="220" width="35" height="40" />
          <rect className="ccm-win ccm-win--accent" x="220" y="220" width="35" height="40" />
          <rect className="ccm-win" x="270" y="220" width="35" height="40" />

          <rect className="ccm-win" x="70" y="300" width="35" height="40" />
          <rect className="ccm-win" x="120" y="300" width="35" height="40" />
          <rect className="ccm-win" x="170" y="300" width="35" height="40" />
          <rect className="ccm-win ccm-win--door" x="220" y="300" width="75" height="40" />

          {/* corner nodes */}
          <circle className="ccm-node" cx="50" cy="40" r="3.5" />
          <circle className="ccm-node" cx="350" cy="40" r="3.5" />
          <circle className="ccm-node" cx="50" cy="360" r="3.5" />
          <circle className="ccm-node" cx="350" cy="360" r="3.5" />
        </svg>

        <div className="container cc-hero-container">
          <div className="cc-hero-content">
            <div className="cc-hero-crumbs">
              <span className="crumb-dot" aria-hidden="true" />
              Siraj Builders / Commercial Construction
            </div>

            

            <h1 className="cc-hero-title">
              Commercial spaces built
              <span className="cc-hero-title-accent">
                for how businesses operate.
              </span>
            </h1>

            <p className="cc-hero-lead">
              A commercial property needs to do more than look complete. It has
              to function — supporting movement, usability, durability,
              maintenance and the practical requirements of the business
              occupying it.
            </p>

            <ul className="cc-hero-trust">
              <li>Built for daily operation</li>
              <li>Coordinated on site</li>
              <li>Schedule-aware delivery</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ==================== INTRO ==================== */}
      <section className="section">
        <div className="container intro-grid">
          <div className="intro-copy reveal">
            <span className="intro-index">01 · The commercial approach</span>
            <h2 className="h2 intro-h2">
              Not just a building.
              <em>A working environment.</em>
            </h2>
            <p className="muted">
              A commercial project is judged by how it performs after handover —
              how easily staff move through it, how well it accommodates the
              business, how it holds up under daily use.
            </p>
            <p className="muted">
              That's why the brief isn't only about structure and finishes. It's
              about understanding the purpose of the property, then coordinating
              construction around the way the business actually works.
            </p>

            <ul className="intro-pills">
              <li className="intro-pill">
                <span className="pill-num">01</span>
                <div className="pill-body">
                  <b>Function first</b>
                  <span>
                    Layout, movement and usability considered before materials.
                  </span>
                </div>
              </li>
              <li className="intro-pill">
                <span className="pill-num">02</span>
                <div className="pill-body">
                  <b>Schedule aware</b>
                  <span>
                    Commercial timelines are treated as business constraints.
                  </span>
                </div>
              </li>
              <li className="intro-pill">
                <span className="pill-num">03</span>
                <div className="pill-body">
                  <b>Coordinated delivery</b>
                  <span>
                    Trades, services and finishes sequenced correctly.
                  </span>
                </div>
              </li>
              <li className="intro-pill">
                <span className="pill-num">04</span>
                <div className="pill-body">
                  <b>Durable finishes</b>
                  <span>
                    Materials chosen for the way commercial space is used.
                  </span>
                </div>
              </li>
            </ul>

            <Link className="btn btn-primary" to="/consultation">
              Discuss Your Project <span className="arrow">→</span>
            </Link>
          </div>

          <div className="intro-visual reveal">
            <img
              className="intro-img"
              src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=85"
              alt="Modern commercial interior space"
              loading="lazy"
            />
            <div className="intro-badge">
              <span className="intro-badge-icon" aria-hidden="true">
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
                  <path d="M3 21h18M5 21V7l7-4 7 4v14" />
                  <path d="M9 21v-6h6v6M9 12h6M9 8h6" />
                </svg>
              </span>
              <div>
                <b>Built to operate</b>
                <span>Designed around how the space is used every day.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOCUS AREAS ==================== */}
      <section className="section light">
        <div className="container">
          <div className="section-head">
            <div className="reveal">
              <span className="eyebrow">Focus areas</span>
              <h2 className="h2">Six areas a commercial project turns on.</h2>
            </div>
            <div className="reveal">
              <p className="muted">
                Every commercial project is different, but these six areas are
                what determine whether the finished space performs the way the
                business needs it to.
              </p>
            </div>
          </div>

          <div className="grid-3" data-stagger>
            <article className="focus-card reveal">
              <div className="focus-top">
                <span className="focus-icon" aria-hidden="true">
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
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </span>
                <span className="focus-num">01</span>
              </div>
              <h3>Functional planning</h3>
              <p className="muted">
                Layouts planned around how people and workflows move through the
                space — not just how it looks on a drawing.
              </p>
            </article>

            <article className="focus-card reveal">
              <div className="focus-top">
                <span className="focus-icon" aria-hidden="true">
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
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
                  </svg>
                </span>
                <span className="focus-num">02</span>
              </div>
              <h3>Construction coordination</h3>
              <p className="muted">
                Trades, services and site activities sequenced so work moves
                forward without clashing.
              </p>
            </article>

            <article className="focus-card reveal">
              <div className="focus-top">
                <span className="focus-icon" aria-hidden="true">
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
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </span>
                <span className="focus-num">03</span>
              </div>
              <h3>Site supervision</h3>
              <p className="muted">
                Work checked against the drawings and specifications as it
                progresses, not only at handover.
              </p>
            </article>

            <article className="focus-card reveal">
              <div className="focus-top">
                <span className="focus-icon" aria-hidden="true">
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
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <path d="M3.3 7l8.7 5 8.7-5M12 22V12" />
                  </svg>
                </span>
                <span className="focus-num">04</span>
              </div>
              <h3>Material management</h3>
              <p className="muted">
                Materials and finishes selected for the durability, traffic and
                maintenance realities of commercial use.
              </p>
            </article>

            <article className="focus-card reveal">
              <div className="focus-top">
                <span className="focus-icon" aria-hidden="true">
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
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </span>
                <span className="focus-num">05</span>
              </div>
              <h3>Quality review</h3>
              <p className="muted">
                Completed work reviewed and outstanding details identified
                before the space is handed over.
              </p>
            </article>

            <article className="focus-card reveal">
              <div className="focus-top">
                <span className="focus-icon" aria-hidden="true">
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
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </span>
                <span className="focus-num">06</span>
              </div>
              <h3>Schedule coordination</h3>
              <p className="muted">
                Timing made visible and managed — because commercial delays
                affect business operations.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ==================== PRIORITIES (dark) ==================== */}
      <section className="section dark">
        <div className="container priorities-grid">
          <div className="priorities-copy reveal">
            <span className="eyebrow">What businesses actually care about</span>
            <h2 className="h2">Four priorities that sit above aesthetics.</h2>
            <p className="muted">
              Commercial clients rarely judge a project by how it looks in
              photographs. They judge it by whether the space supports the
              business on day one — and every day after that.
            </p>
          </div>

          <div className="priorities-layers">
            <div className="priority-layer reveal">
              <span className="priority-num">01</span>
              <div className="priority-body">
                <b>Functional space</b>
                <p className="muted">
                  Rooms, circulation, services and storage that work for the way
                  the business actually operates.
                </p>
              </div>
            </div>

            <div className="priority-layer reveal">
              <span className="priority-num">02</span>
              <div className="priority-body">
                <b>Minimal disruption</b>
                <p className="muted">
                  Where work happens alongside a live operation, disruption is
                  planned and controlled — not left to chance.
                </p>
              </div>
            </div>

            <div className="priority-layer reveal">
              <span className="priority-num">03</span>
              <div className="priority-body">
                <b>Schedule certainty</b>
                <p className="muted">
                  Commercial timelines are business timelines. Slippage has real
                  cost, so the schedule is treated as a commitment.
                </p>
              </div>
            </div>

            <div className="priority-layer reveal">
              <span className="priority-num">04</span>
              <div className="priority-body">
                <b>Professional handover</b>
                <p className="muted">
                  A clean, complete handover — with the details resolved and
                  documentation in place so the space is ready to use.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CTA BANNER ==================== */}
      <section className="banner">
        <div className="container banner-inner">
          <div className="reveal">
            <span className="eyebrow">Start with clarity</span>
            <h2 className="h2">Discuss a commercial project.</h2>
            <p>
              Bring your property details, intended use, drawings and initial
              requirements. We'll review them and confirm the right next step.
            </p>
          </div>
          <div className="banner-cta reveal">
            <Link className="btn btn-light" to="/consultation">
              Discuss a Commercial Project <span className="arrow">→</span>
            </Link>
            <Link className="btn btn-outline" to="/cost-index">
              View Cost Index <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}