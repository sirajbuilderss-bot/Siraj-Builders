import { Link } from "react-router-dom";
import {
  COMPANY_LINKS,
  RESOURCE_LINKS,
  LEGAL_LINKS,
} from "../../config/site";
import { useSiteData } from "../../context/SiteDataContext";

/* ---------------- ICONS ---------------- */

const ICONS = {
  facebook: (
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  ),
  instagram: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </>
  ),
  linkedin: (
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
  ),
  youtube: (
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33zM9.75 15.02V8.48l5.75 3.27z" />
  ),
};

function SocialIcon({ name }) {
  const filled = name === "facebook" || name === "linkedin" || name === "youtube";
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/**
 * Renders a contact row. When a detail is still unconfirmed it renders as
 * plain text rather than a link, because a `tel:+920000000000` link is a
 * dead click that looks functional — worse than showing nothing.
 */
function ContactRow({ icon, label, detail, href }) {
  const body = (
    <>
      <span className="footer-contact-icon">{icon}</span>
      <span className="footer-contact-body">
        <small>{label}</small>
        <span>{detail.confirmed ? detail.value : detail.display}</span>
      </span>
    </>
  );

  if (detail.confirmed && href) {
    return (
      <a className="footer-contact-item" href={href}>
        {body}
      </a>
    );
  }
  return (
    <div className="footer-contact-item is-pending" aria-label={`${label} — to be confirmed`}>
      {body}
    </div>
  );
}

/* ---------------- COMPONENT ---------------- */

export default function Footer() {
  const year = new Date().getFullYear();

  /* Destructured under the original names so the markup below is untouched.
     Navigation groups that are purely structural stay in config/site.js. */
  const {
    company: COMPANY,
    contact: CONTACT,
    serviceLinks: SERVICE_LINKS,
    socials: SOCIAL_PROFILES,
  } = useSiteData();

  /* Unchanged rule: a profile appears only when it is confirmed AND has a
     URL, so the social row stays hidden rather than linking to a platform
     homepage. */
  const activeSocials = SOCIAL_PROFILES.filter((s) => s.confirmed && s.href);

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* ---- BRAND ---- */}
          <div className="footer-brand">
            <Link className="brand" to="/" aria-label={`${COMPANY.name} home`}>
              <span className="brand-mark">{COMPANY.initials}</span>
              <span className="brand-name">{COMPANY.name}</span>
            </Link>

            {/* Documented footer line. Replaces the previous
                "Building excellence across Pakistan" copy, which claimed
                unverified geographic coverage and used the superlative
                language the brand guidelines rule out. */}
            <p>{COMPANY.tagline}</p>

            {activeSocials.length > 0 && (
              <div className="footer-social">
                {activeSocials.map(({ key, label, href }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                  >
                    <SocialIcon name={key} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* ---- SERVICES ---- */}
          <nav className="footer-col" aria-label="Services">
            <h3>Services</h3>
            {SERVICE_LINKS.map((item) => (
              <Link key={item.to} to={item.to}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* ---- COMPANY ---- */}
          <nav className="footer-col" aria-label="Company">
            <h3>Company</h3>
            {COMPANY_LINKS.map((item) => (
              <Link key={item.to} to={item.to}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* ---- RESOURCES ---- */}
          <nav className="footer-col" aria-label="Resources">
            <h3>Resources</h3>
            {RESOURCE_LINKS.map((item) => (
              <Link key={item.to} to={item.to}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* ---- CONTACT ---- */}
          <div className="footer-col">
            <h3>Get in Touch</h3>
            <div className="footer-contact-list">
              <ContactRow
                icon={<PhoneIcon />}
                label="Phone"
                detail={CONTACT.phone}
                href={`tel:${CONTACT.phone.value}`}
              />
              <ContactRow
                icon={<MailIcon />}
                label="Email"
                detail={CONTACT.email}
                href={`mailto:${CONTACT.email.value}`}
              />
              <ContactRow
                icon={<MapPinIcon />}
                label="Office"
                detail={CONTACT.address}
              />
            </div>
          </div>
        </div>

        {/* ---- BOTTOM ---- */}
        <div className="footer-bottom">
          <p>
            © {year} {COMPANY.name}. All rights reserved.
          </p>
          <nav className="footer-legal" aria-label="Legal">
            {LEGAL_LINKS.map((item) => (
              <Link key={item.to} to={item.to}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}