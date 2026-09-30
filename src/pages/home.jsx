import { Link } from "react-router-dom";
import HeroSlider from "../components/home/HeroSlider";
import { CTA } from "../config/site";
import useReveal from "../hooks/useReveal";
import useContent from "../hooks/useContent";
import { testimonials as testimonialService } from "../services/content";
import "../styles/home.css";

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4.5 8-11V5l-8-3-8 3v6c0 6.5 8 11 8 11z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 21h18M5 21v-6M10 21v-10M15 21v-14M20 21v-4" />
    </svg>
  );
}

/**
 * TESTIMONIALS
 * ----------------------------------------------------------------------------
 * This section renders nothing at all unless verified testimonials exist in
 * the database — and the table ships empty, because the project documentation
 * states only verified testimonials may appear.
 *
 * So the homepage looks exactly as it did before until a real testimonial is
 * added from the admin panel, at which point the section appears. Shipping it
 * with placeholder quotes would have been the one thing the documentation
 * explicitly forbids.
 */
function Testimonials() {
  const { data: quotes } = useContent(
    () => testimonialService.listPublic(),
    [],
    { fallbackOnEmpty: false }
  );

  if (!quotes.length) return null;

  return (
    <section className="section light">
      <div className="container">
        <div className="section-head">
          <div className="reveal">
            <span className="eyebrow">Client feedback</span>
            <h2 className="h2">What clients say about working with us.</h2>
          </div>
        </div>
        <div className="cards" data-stagger>
          {quotes.map((item, index) => (
            <figure
              className="card reveal"
              key={item.id}
              style={{ "--d": `${index * 0.08}s` }}
            >
              <div className="card-body">
                <blockquote className="muted">“{item.quote}”</blockquote>
                <figcaption>
                  <b>{item.client_name}</b>
                  {(item.project_type || item.location) && (
                    <span className="kicker">
                      {[item.project_type, item.location]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  useReveal();

  return (
    <>
      <HeroSlider />

      {/* TRUST STRIP */}
      <section className="trust-strip">
        <div className="container">
          <div className="trust-card reveal">
            <div className="trust-item">
              <span className="trust-icon" aria-hidden="true">
                <CheckIcon />
              </span>
              <div className="trust-body">
                <b>Clear scope</b>
                <span>Defined before work begins</span>
              </div>
            </div>
            <div className="trust-item">
              <span className="trust-icon" aria-hidden="true">
                <ShieldIcon />
              </span>
              <div className="trust-body">
                <b>Responsible execution</b>
                <span>Supervised on site</span>
              </div>
            </div>
            <div className="trust-item">
              <span className="trust-icon" aria-hidden="true">
                <ChatIcon />
              </span>
              <div className="trust-body">
                <b>Consistent updates</b>
                <span>Progress shared as it happens</span>
              </div>
            </div>
            <div className="trust-item">
              <span className="trust-icon" aria-hidden="true">
                <ClockIcon />
              </span>
              <div className="trust-body">
                <b>Defined handover</b>
                <span>Clear transition at completion</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTRO SPLIT */}
      <section className="section light">
        <div className="container split">
          <div className="reveal">
            <span className="eyebrow">A different construction experience</span>
            <h2 className="h2">
              A construction partner, not simply a contractor.
            </h2>
            <p className="muted" style={{ marginBottom: "1.8rem" }}>
              Construction involves hundreds of decisions—from scope and
              materials to scheduling, site coordination and final finishing.
              Siraj Builders is built around a straightforward principle:
              clients should understand their project and feel confident about
              how it is being managed.
            </p>
            <Link className="btn btn-ghost" to="/who-we-are">
              Learn About Siraj Builders <span className="arrow">→</span>
            </Link>
          </div>
          <div className="image-stack reveal" style={{ "--d": "0.15s" }}>
            <img
              src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1600&q=85"
              alt="Modern architectural building"
              loading="lazy"
            />
            <img
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=85"
              alt="Construction professional at work"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="reveal">
              <span className="eyebrow">What we do</span>
              <h2 className="h2">Solutions built around the project.</h2>
            </div>
            <div className="reveal" style={{ "--d": "0.12s" }}>
              <p className="muted">
                Whether it is a new property, commercial space or renovation,
                the right solution starts with understanding the project itself.
              </p>
            </div>
          </div>
          <div className="cards" data-stagger>
            <Link className="card reveal" to="/residential-construction">
              <div className="card-img">
                <img
                  src="https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1600&q=85"
                  alt="Residential construction"
                  loading="lazy"
                />
              </div>
              <div className="card-body">
                <div className="icon-box">01</div>
                <h3>Residential Construction</h3>
                <p className="muted">
                  From planning through construction and finishing, move from an
                  initial requirement to a completed property with a structured
                  approach.
                </p>
                <span className="kicker">
                  Explore service <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
            <Link className="card reveal" to="/commercial-construction">
              <div className="card-img">
                <img
                  src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=85"
                  alt="Commercial interior space"
                  loading="lazy"
                />
              </div>
              <div className="card-body">
                <div className="icon-box">02</div>
                <h3>Commercial Construction</h3>
                <p className="muted">
                  Functional commercial spaces require coordination, planning
                  and a clear understanding of how the finished property will be
                  used.
                </p>
                <span className="kicker">
                  Explore service <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
            <Link className="card reveal" to="/renovation-remodelling">
              <div className="card-img">
                <img
                  src="https://images.unsplash.com/photo-1531835551805-16d864c8d311?auto=format&fit=crop&w=1600&q=85"
                  alt="Renovated modern interior"
                  loading="lazy"
                />
              </div>
              <div className="card-body">
                <div className="icon-box">03</div>
                <h3>Renovation &amp; Remodelling</h3>
                <p className="muted">
                  Improve an existing property without losing sight of
                  structure, functionality, intended use or finishing quality.
                </p>
                <span className="kicker">
                  Explore service <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* SELECTED WORK
          Previously two cards linking to /project-detail?project=… for
          projects that do not exist, illustrated with stock photography.
          The documentation is explicit: "Repeat only for verified projects"
          and avoid "generic stock photography as primary proof". This section
          states the position honestly and routes to the portfolio index. */}
      <section className="section dark">
        <div className="container">
          <div className="section-head">
            <div className="reveal">
              <span className="eyebrow">Selected work</span>
              <h2 className="h2">See the work, not just the promise.</h2>
            </div>
            <div className="reveal" style={{ "--d": "0.12s" }}>
              <p className="lead muted">
                A portfolio should show the requirement behind a project and
                the work involved in bringing it together — not a wall of
                photographs.
              </p>
            </div>
          </div>
          <div className="work-teaser reveal">
            <p>
              We are documenting completed projects properly before publishing
              them: the client requirement, the constraints, how the work was
              approached and what was delivered.
            </p>
            <div className="work-teaser-actions">
              <Link className="btn btn-light" to={CTA.secondary.to}>
                {CTA.secondary.label} <span className="arrow">→</span>
              </Link>
              <Link className="btn btn-outline" to={CTA.primary.to}>
                {CTA.primary.label} <span className="arrow">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BRAND PILLARS
          Replaces the previous stats band, which counted things that were not
          achievements — "12+ project categories", "7 project experience
          principles". The documentation rules out unverified numbers as trust
          signals ("Do not fill these with invented numbers"; avoid "fake
          numbers"). Real proof belongs here once confirmed: company
          registration, PEC details, actual project count, years in operation.
          See TO-CONFIRM.md. */}
      <section className="pillars-band">
        <div className="container">
          <div className="section-head">
            <div className="reveal">
              <span className="eyebrow">How we work</span>
              <h2 className="h2">Seven things we hold to.</h2>
            </div>
            <div className="reveal" style={{ "--d": "0.12s" }}>
              <p className="muted">
                Not claims about scale — the principles that shape how a Siraj
                Builders project is planned, run and handed over.
              </p>
            </div>
          </div>
          <ul className="pillars" data-stagger>
            {[
              ["Clarity", "The client understands the project before committing."],
              ["Structured execution", "Construction follows a defined process, not an improvised sequence."],
              ["Responsible management", "The project is actively coordinated, not handed to workers."],
              ["Craftsmanship", "Attention goes to the details that determine the final result."],
              ["Communication", "Clients stay informed throughout the project."],
              ["Practical design", "The space should look good while serving its purpose."],
              ["Long-term value", "The result should remain useful and valuable."],
            ].map(([title, copy], i) => (
              <li className="pillar reveal" key={title}>
                <span className="pillar-num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <b>{title}</b>
                <p className="muted">{copy}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* WHY US */}
      <section className="section">
        <div className="container split">
          <div className="image-stack reveal">
            <img
              src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1600&q=85"
              alt="Construction planning documents"
              loading="lazy"
            />
            <img
              src="https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&w=1600&q=85"
              alt="Construction crane against city skyline"
              loading="lazy"
            />
          </div>
          <div className="reveal" style={{ "--d": "0.15s" }}>
            <span className="eyebrow">Why Siraj Builders</span>
            <h2 className="h2">What a better-managed project looks like.</h2>
            <div
              className="small-grid"
              style={{ gridTemplateColumns: "1fr 1fr" }}
            >
              <div className="mini">
                <b>Clarity</b>
                <p className="muted">
                  Understand scope and priorities before committing.
                </p>
              </div>
              <div className="mini">
                <b>Execution</b>
                <p className="muted">
                  Coordinate decisions, people, materials and stages.
                </p>
              </div>
              <div className="mini">
                <b>Communication</b>
                <p className="muted">
                  Know what happened, what is happening and what comes next.
                </p>
              </div>
              <div className="mini">
                <b>Accountability</b>
                <p className="muted">
                  Clear responsibilities and a clear path forward.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROJECT SHOWCASE TEASER */}
      <section className="teaser-band">
        <div className="container teaser-inner">
          <div className="teaser-copy reveal">
            <span className="eyebrow">Project Showcase</span>
            <h2>
              A modern project experience <em>built around visibility.</em>
            </h2>
            <p>
              Project Showcase is our approach to project visibility —
              structured communication, live progress, documented decisions, and
              clearly defined responsibilities so the project stays legible to
              the people paying for it.
            </p>
            <p>
              Progress you can see. Decisions you can trace. A project that
              doesn&apos;t require constant chasing.
            </p>
            <div className="teaser-actions">
              <Link className="btn btn-light" to="/project-showcase">
                Explore Project Showcase <span className="arrow">→</span>
              </Link>
              <Link
                className="btn btn-outline"
                to="/project-management"
                style={{ borderColor: "rgba(255,255,255,0.3)", color: "#fff" }}
              >
                See Project Management <span className="arrow">→</span>
              </Link>
            </div>
          </div>
          <div
            className="teaser-dashboard reveal"
            style={{ "--d": "0.15s" }}
            aria-hidden="true"
          >
            {/* Illustrative only. This previously carried a "Live" badge and
                concrete percentages (78% / 45% / 92%), which read as real data
                from a real client project. It is a visual device, so it is now
                labelled as one and hidden from assistive technology. */}
            <div className="dash-head">
              <span className="dash-title">
                <BuildingIcon /> Progress reporting
              </span>
              <span className="dash-note">Illustration</span>
            </div>
            <div className="dash-bars">
              <span className="dash-bar" />
              <span className="dash-bar" />
              <span className="dash-bar" />
              <span className="dash-bar" />
              <span className="dash-bar" />
              <span className="dash-bar" />
            </div>
            <div className="dash-progress">
              <div className="dash-row">
                <div>
                  <div className="dash-track">
                    <span style={{ "--fill": "78%" }} />
                  </div>
                </div>

              </div>
              <div className="dash-row">
                <div>
                  <div className="dash-track">
                    <span style={{ "--fill": "45%" }} />
                  </div>
                </div>

              </div>
              <div className="dash-row">
                <div>
                  <div className="dash-track">
                    <span style={{ "--fill": "92%" }} />
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="section light">
        <div className="container">
          <div className="section-head">
            <div className="reveal">
              <span className="eyebrow">Our process</span>
              <h2 className="h2">A clear route from idea to completion.</h2>
            </div>
            <div className="reveal" style={{ "--d": "0.12s" }}>
              <Link className="btn btn-ghost" to="/our-process">
                See Our Full Process <span className="arrow">→</span>
              </Link>
            </div>
          </div>
          <div className="process" data-stagger>
            <div className="step reveal">
              <span className="step-num">01</span>
              <h3>Consultation</h3>
              <p className="muted">
                Understand your requirements, property and objectives.
              </p>
            </div>
            <div className="step reveal">
              <span className="step-num">02</span>
              <h3>Site Assessment</h3>
              <p className="muted">
                Review the site and practical considerations.
              </p>
            </div>
            <div className="step reveal">
              <span className="step-num">03</span>
              <h3>Planning</h3>
              <p className="muted">
                Organise scope and required planning or design work.
              </p>
            </div>
            <div className="step reveal">
              <span className="step-num">04</span>
              <h3>Construction</h3>
              <p className="muted">
                Execute with appropriate coordination and supervision.
              </p>
            </div>
            <div className="step reveal">
              <span className="step-num">05</span>
              <h3>Completion</h3>
              <p className="muted">
                Review quality, resolve details and hand over.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MINI FAQ */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="reveal">
              <span className="eyebrow">Common questions</span>
              <h2 className="h2">Answers before you have to ask.</h2>
            </div>
            <div className="reveal" style={{ "--d": "0.12s" }}>
              <Link className="btn btn-ghost" to="/faq">
                See All FAQs <span className="arrow">→</span>
              </Link>
            </div>
          </div>
          <div className="mini-faq" data-stagger>
            <div className="faq-card reveal">
              <h3>How do I start a project with Siraj Builders?</h3>
              <p className="muted">
                Start by sharing the property location, project type and
                intended scope. From there we can determine the right next step.
              </p>
              <Link className="kicker" to="/faq">
                Read answer <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="faq-card reveal">
              <h3>How is a construction estimate prepared?</h3>
              <p className="muted">
                Estimates reflect the agreed scope, drawings, property
                conditions and materials — reviewed before a proper figure is
                confirmed.
              </p>
              <Link className="kicker" to="/faq">
                Read answer <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="faq-card reveal">
              <h3>How long does a construction project take?</h3>
              <p className="muted">
                Duration depends on property size, scope, site conditions and
                materials. A project-specific timeline is set once the scope is
                agreed.
              </p>
              <Link className="kicker" to="/faq">
                Read answer <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS — renders only when verified quotes exist */}
      <Testimonials />

      {/* CTA BANNER */}
      <section className="banner">
        <div className="container banner-inner">
          <div className="reveal">
            <span className="eyebrow">Start with clarity</span>
            <h2 className="h2">Have a project in mind?</h2>
            <p>
              Tell us what you are planning, where the property is located and
              what you need from your construction partner.
            </p>
          </div>
          <div className="banner-cta reveal" style={{ "--d": "0.15s" }}>
            <Link className="btn btn-light" to={CTA.primary.to}>
              {CTA.primary.label} <span className="arrow">→</span>
            </Link>
            <Link
              className="btn btn-outline"
              to="/cost-index"
              style={{ borderColor: "rgba(255,255,255,0.3)", color: "#fff" }}
            >
              View Cost Index <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
