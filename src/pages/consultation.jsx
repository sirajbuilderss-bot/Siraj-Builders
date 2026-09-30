import { Link } from "react-router-dom";
import useReveal from "../hooks/useReveal";
import useProjectForm, { VALIDATORS } from "../hooks/useProjectForm";
import { createSubmission } from "../services/submissions";
import { CTA } from "../config/site";
import { useSiteData } from "../context/SiteDataContext";
import "../styles/consultation.css";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  projectType: "",
  location: "",
  size: "",
  budget: "",
  startDate: "",
  service: "",
  description: "",
};


/* Shared inline glyphs for the "Prefer to talk?" panel. */
const glyphProps = {
  viewBox: "0 0 24 24",
  width: 18,
  height: 18,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
};

function PhoneGlyph() {
  return (
    <svg {...glyphProps}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}

function ChatGlyph() {
  return (
    <svg {...glyphProps}>
      <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" />
    </svg>
  );
}

function MailGlyph() {
  return (
    <svg {...glyphProps}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

/* Field rules mirror the documented consultation form. Only the fields the
   documentation marks as essential are required; the rest stay optional so a
   visitor who does not yet know their budget or start date is not blocked. */
const RULES = {
  name: [VALIDATORS.required("Full name"), VALIDATORS.minLength("Full name", 2)],
  phone: [VALIDATORS.required("Phone"), VALIDATORS.phone()],
  email: [VALIDATORS.email()],
  projectType: [VALIDATORS.required("Project type")],
  location: [VALIDATORS.required("Property location")],
  description: [
    VALIDATORS.required("Project description"),
    VALIDATORS.minLength("Project description", 20),
  ],
};

/* Module scope keeps the identity stable across renders. */
const submitConsultation = (values) => createSubmission(values, "consultation");

export default function Consultation() {
  useReveal();
  const fx = useProjectForm({
    initialValues: initialForm,
    rules: RULES,
    onSubmit: submitConsultation,
  });
  const submitted = fx.isSuccess;
  const handleSubmit = fx.handleSubmit;
  const handleReset = fx.reset;
  /* Contact details come from the database, falling back to config/site.js.
     The WhatsApp CTA still hides entirely unless the number is confirmed. */
  const { contact: CONTACT, whatsappHref: wa } = useSiteData();

  return (
    <>
      <section className="page-hero">
        <div className="page-hero-bg" aria-hidden="true" />
        <div className="blueprint-grid" aria-hidden="true" />
        <svg
          className="consult-hero-motif"
          viewBox="0 0 420 360"
          aria-hidden="true"
        >
          <path className="consult-motif-line" d="M72 106h276v170H72z" />
          <path
            className="consult-motif-detail"
            d="m74 112 136 101 136-101M72 272l102-83M348 272l-102-83"
          />
          <circle className="consult-motif-dot" cx="210" cy="213" r="9" />
        </svg>

        <div className="container">
          <div className="crumbs">Siraj Builders / Consultation</div>
          <span className="eyebrow">Start with clarity</span>
          <h1>Start with clarity. Then build.</h1>
          <p className="lead">
            Before construction begins, there are important questions to answer.
            Share the basics of your project and we'll begin with a clear
            conversation about your requirements, property and next steps.
          </p>
          <div className="hero-trust">
            <span>No obligation</span>
            <span>Plain conversation</span>
            <span>Clear next step</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container consult-layout">
          <div className="reveal">
            <form
              className="form-card"
              noValidate
              aria-labelledby="formTitle"
              onSubmit={handleSubmit}
            >
              {!submitted ? (
                <>
                  <div className="form-head">
                    <span className="eyebrow">Tell us about your project</span>
                    <h2 id="formTitle">Share a few details to get started.</h2>
                    <p>
                      The more we understand about your project, the better we
                      can guide the initial conversation.
                    </p>
                  </div>

                  <div className="form-grid">
                    <div className="field">
                      <label htmlFor="name">
                        Full name <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="e.g. Ahmed Khan"
                        autoComplete="name"
                        {...fx.fieldProps("name")}
                      />
                      {fx.errorFor("name") && (
                        <span className="field-error" id="name-error" role="alert">
                          {fx.errorFor("name")}
                        </span>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor="phone">
                        Phone <span className="req">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        placeholder="e.g. +92 300 0000000"
                        autoComplete="tel"
                        {...fx.fieldProps("phone")}
                      />
                      {fx.errorFor("phone") && (
                        <span className="field-error" id="phone-error" role="alert">
                          {fx.errorFor("phone")}
                        </span>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor="email">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        {...fx.fieldProps("email")}
                      />
                      {fx.errorFor("email") && (
                        <span className="field-error" id="email-error" role="alert">
                          {fx.errorFor("email")}
                        </span>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor="projectType">
                        Project type <span className="req">*</span>
                      </label>
                      <select
                        id="projectType"
                        name="projectType"
                        {...fx.fieldProps("projectType")}
                      >
                        <option value="" disabled>
                          Select a type
                        </option>
                        <option>Residential</option>
                        <option>Commercial</option>
                        <option>Renovation &amp; Remodelling</option>
                        <option>Design &amp; Build</option>
                        <option>Other / Not sure yet</option>
                      </select>
                      {fx.errorFor("projectType") && (
                        <span className="field-error" id="projectType-error" role="alert">
                          {fx.errorFor("projectType")}
                        </span>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor="location">Property location</label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        placeholder="City / area"
                        {...fx.fieldProps("location")}
                      />
                      {fx.errorFor("location") && (
                        <span className="field-error" id="location-error" role="alert">
                          {fx.errorFor("location")}
                        </span>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor="size">Plot / property size</label>
                      <input
                        type="text"
                        id="size"
                        name="size"
                        placeholder="e.g. 10 marla / 240 sq yd"
                        {...fx.fieldProps("size")}
                      />
                      {fx.errorFor("size") && (
                        <span className="field-error" id="size-error" role="alert">
                          {fx.errorFor("size")}
                        </span>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor="budget">Estimated budget</label>
                      <input
                        type="text"
                        id="budget"
                        name="budget"
                        placeholder="Optional — approximate range"
                        {...fx.fieldProps("budget")}
                      />
                      {fx.errorFor("budget") && (
                        <span className="field-error" id="budget-error" role="alert">
                          {fx.errorFor("budget")}
                        </span>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor="startDate">Expected start</label>
                      <input
                        type="text"
                        id="startDate"
                        name="startDate"
                        placeholder="e.g. Q3 2026 / flexible"
                        {...fx.fieldProps("startDate")}
                      />
                      {fx.errorFor("startDate") && (
                        <span className="field-error" id="startDate-error" role="alert">
                          {fx.errorFor("startDate")}
                        </span>
                      )}
                    </div>

                    <div className="field full">
                      <label htmlFor="service">Required service</label>
                      <select
                        id="service"
                        name="service"
                        {...fx.fieldProps("service")}
                      >
                        <option value="" disabled>
                          Select a service
                        </option>
                        <option>Construction (full project)</option>
                        <option>Residential Construction</option>
                        <option>Commercial Construction</option>
                        <option>Renovation &amp; Remodelling</option>
                        <option>Grey Structure</option>
                        <option>Turnkey Construction</option>
                        <option>Project Management</option>
                        <option>Design &amp; Architecture</option>
                        <option>Not sure — need guidance</option>
                      </select>
                      {fx.errorFor("service") && (
                        <span className="field-error" id="service-error" role="alert">
                          {fx.errorFor("service")}
                        </span>
                      )}
                    </div>

                    <div className="field full">
                      <label htmlFor="description">Project description</label>
                      <textarea
                        id="description"
                        name="description"
                        placeholder="Tell us what you are planning, what matters most, and anything else we should know."
                        {...fx.fieldProps("description")}
                      />
                      {fx.errorFor("description") && (
                        <span className="field-error" id="description-error" role="alert">
                          {fx.errorFor("description")}
                        </span>
                      )}
                    </div>

                    <div className="form-submit full">
                      <button
                        className="btn btn-primary btn-block"
                        type="submit"
                        disabled={fx.isSubmitting}
                      >
                        {fx.isSubmitting ? "Sending…" : "Discuss My Project"}
                        {!fx.isSubmitting && <span className="arrow">→</span>}
                      </button>
                      {fx.submitError && (
                        <p className="form-submit-error" role="alert">
                          {fx.submitError}
                        </p>
                      )}
                      <p className="form-note">
                        <svg
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M12 22s8-4.5 8-11V5l-8-3-8 3v6c0 6.5 8 11 8 11z" />
                          <path d="M9 12l2 2 4-4" />
                        </svg>
                        <span>
                          Your information is used to understand your project
                          and determine the appropriate next step. It is not
                          shared with third parties.
                        </span>
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div
                  className="form-success is-active"
                  role="status"
                  aria-live="polite"
                >
                  <div className="success-icon" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      width="30"
                      height="30"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <h3>Thank you. Your project details have been received.</h3>
                  <p>
                    Our team will review the information and contact you
                    regarding the next step.
                  </p>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={handleReset}
                  >
                    Submit another project
                  </button>
                </div>
              )}
            </form>
          </div>

          <aside className="side-stack reveal" style={{ "--d": "0.15s" }}>
            <div className="side-card">
              <span className="eyebrow">What to provide</span>
              <h3>If available, share:</h3>
              <ul className="side-list">
                <li>Property location</li>
                <li>Plot / property size</li>
                <li>Any drawings or documents</li>
                <li>Project type</li>
                <li>Desired scope</li>
                <li>Expected start date</li>
                <li>Approximate budget</li>
              </ul>
              <p
                className="muted"
                style={{ fontSize: "0.82rem", marginTop: "1.1rem" }}
              >
                Don't worry if you don't have everything — a clear conversation
                can begin without it.
              </p>
            </div>

            <div className="side-card dark">
              <span className="eyebrow">Prefer to talk?</span>
              <h3>Reach us directly.</h3>
              {/* Contact routes degrade honestly: a detail that has not been
                  confirmed renders as text, never as a dead tel:/mailto: link
                  that looks clickable and does nothing. */}
              <div className="contact-quick">
                {CONTACT.phone.confirmed ? (
                  <a href={`tel:${CONTACT.phone.value}`}>
                    <PhoneGlyph />
                    <span>
                      Call us
                      <small>{CONTACT.phone.value}</small>
                    </span>
                  </a>
                ) : (
                  <span className="contact-quick-pending">
                    <PhoneGlyph />
                    <span>
                      Call us
                      <small>{CONTACT.phone.display}</small>
                    </span>
                  </span>
                )}

                {wa ? (
                  <a href={wa} target="_blank" rel="noopener noreferrer">
                    <ChatGlyph />
                    <span>
                      {CTA.whatsapp.label}
                      <small>Opens WhatsApp with your details prefilled</small>
                    </span>
                  </a>
                ) : (
                  <span className="contact-quick-pending">
                    <ChatGlyph />
                    <span>
                      {CTA.whatsapp.label}
                      <small>{CONTACT.whatsapp.display}</small>
                    </span>
                  </span>
                )}

                {CONTACT.email.confirmed ? (
                  <a href={`mailto:${CONTACT.email.value}`}>
                    <MailGlyph />
                    <span>
                      Email us
                      <small>{CONTACT.email.value}</small>
                    </span>
                  </a>
                ) : (
                  <span className="contact-quick-pending">
                    <MailGlyph />
                    <span>
                      Email us
                      <small>{CONTACT.email.display}</small>
                    </span>
                  </span>
                )}

                <Link to="/contact-us">
                  <MailGlyph />
                  <span>
                    Contact page
                    <small>Full enquiry form</small>
                  </span>
                </Link>
              </div>
            </div>

            <div className="side-card">
              <span className="eyebrow">Why start here</span>
              <h3>What a consultation gives you.</h3>
              <ul className="side-list">
                <li>Discuss your project requirements</li>
                <li>Explain your property</li>
                <li>Understand available services</li>
                <li>Identify key project considerations</li>
                <li>Determine the appropriate next step</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className="section light">
        <div className="container">
          <div
            style={{ maxWidth: 640, marginBottom: "clamp(2rem, 4vw, 3rem)" }}
          >
            <span className="eyebrow reveal">What happens next</span>
            <h2 className="h2 reveal" style={{ "--d": "0.1s" }}>
              A simple path from first message to first conversation.
            </h2>
            <p className="muted reveal" style={{ "--d": "0.18s" }}>
              No sales pressure. No assumptions. Just a structured way to
              understand your project and decide whether Siraj Builders is the
              right fit.
            </p>
          </div>

          <div className="steps-band" data-stagger>
            <article className="step-card reveal">
              <div className="num">01</div>
              <h3>You share the basics</h3>
              <p className="muted">
                Fill in the form with your project type, property details and
                what you're planning.
              </p>
            </article>
            <article className="step-card reveal">
              <div className="num">02</div>
              <h3>We review the details</h3>
              <p className="muted">
                Our team reads through your information and considers what the
                project requires.
              </p>
            </article>
            <article className="step-card reveal">
              <div className="num">03</div>
              <h3>We reach out</h3>
              <p className="muted">
                We contact you to clarify anything unclear and arrange an
                initial conversation.
              </p>
            </article>
            <article className="step-card reveal">
              <div className="num">04</div>
              <h3>We agree on next steps</h3>
              <p className="muted">
                Together we decide what the appropriate next step looks like —
                or that it isn't the right fit.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="banner">
        <div className="container banner-inner">
          <div className="reveal">
            <span className="eyebrow">Still planning?</span>
            <h2 className="h2">Have a project in mind?</h2>
            <p>
              Share the basics with our team and start with a clear conversation
              about your requirements, property and next steps.
            </p>
          </div>
          <div className="banner-cta reveal" style={{ "--d": "0.15s" }}>
            <Link className="btn btn-light" to="/projects">
              View Our Projects <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
