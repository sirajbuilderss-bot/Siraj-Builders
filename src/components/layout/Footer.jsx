import { Link } from "react-router-dom";
import {
  COMPANY_LINKS,
  RESOURCE_LINKS,
  LEGAL_LINKS,
  CTA,
} from "../../config/site";
import { useSiteData } from "../../context/SiteDataContext";
import { ArrowRight, Mail, MapPin, Phone } from "../ui/Icons";
import BrandMark from "./BrandMark";

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
  tiktok: (
    <path d="M15 4v10.5a4.5 4.5 0 1 1-4-4.47v3.05a1.5 1.5 0 1 0 1 1.42V4h3c.27 1.52 1.24 2.7 3 3.25V10c-1.16-.2-2.17-.67-3-1.38V4z" />
  ),
  whatsapp_community: (
    <path d="M20.5 3.5A10.7 10.7 0 0 0 12.9 1C7 1 2.2 5.8 2.2 11.7c0 1.9.5 3.7 1.5 5.3L2 22l5.2-1.6a10.7 10.7 0 0 0 5.7 1.6h.1c5.9 0 10.7-4.8 10.7-10.7 0-2.9-1.1-5.7-3.2-7.8zM12.9 20.3c-1.7 0-3.3-.5-4.7-1.4l-.3-.2-3.1.9.9-3-.2-.3a8.7 8.7 0 0 1-1.4-4.7c0-4.8 3.9-8.7 8.7-8.7 2.3 0 4.5.9 6.1 2.5a8.6 8.6 0 0 1 2.5 6.2c0 4.8-3.9 8.7-8.5 8.7z" />
  ),
};

function SocialIcon({ name }) {
  const filled = name === "facebook" || name === "linkedin" || name === "youtube" || name === "tiktok" || name === "whatsapp_community";
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

/**
 * Only confirmed contact details are shown to visitors. Unconfirmed values
 * are setup notes for the admin, not copy for the public site.
 */
function ContactRow({ icon, label, detail, href }) {
  if (!detail.confirmed || !detail.value) return null;
  const body = (
    <>
      <span className="footer-contact-icon">{icon}</span>
      <span className="footer-contact-body">
        <small>{label}</small>
        <span>{detail.value}</span>
      </span>
    </>
  );

  if (href) {
    return (
      <a className="footer-contact-item" href={href}>
        {body}
      </a>
    );
  }
  return <div className="footer-contact-item">{body}</div>;
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
    settingValue,
  } = useSiteData();

  /* Documentation, FOOTER CTA — editable in Admin → Settings → Footer. */
  const footerCta = {
    title: settingValue("footer_cta_title", "Have a project in mind? Let's talk."),
    label: settingValue("footer_cta_label", CTA.primary.label),
    to: settingValue("footer_cta_href", CTA.primary.to),
  };

    /* A saved URL is enough to show a social icon. Empty rows stay hidden, so
      an unconfigured platform can never link to its generic homepage. */
    const activeSocials = SOCIAL_PROFILES.filter((s) => s.href);

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-cta">
          <p className="footer-cta-title">{footerCta.title}</p>
          <Link className="btn btn-light" to={footerCta.to}>
            {footerCta.label} <span className="arrow"><ArrowRight size={17} /></span>
          </Link>
        </div>

        <div className="footer-grid">
          {/* ---- BRAND ---- */}
          <div className="footer-brand">
            <Link className="brand" to="/" aria-label={`${COMPANY.name} home`}>
              <BrandMark />
              <span className="brand-name">{COMPANY.name}</span>
            </Link>

            {/* Documented footer line. Replaces the previous
                "Building excellence across Pakistan" copy, which claimed
                unverified geographic coverage and used the superlative
                language the brand guidelines rule out. */}
            <p>{settingValue("footer_tagline", COMPANY.tagline)}</p>

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
            <Link to="/services">All services</Link>
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
                icon={<Phone size={16} />}
                label="Phone"
                detail={CONTACT.phone}
                href={`tel:${CONTACT.phone.value}`}
              />
              <ContactRow
                icon={<Mail size={16} />}
                label="Email"
                detail={CONTACT.email}
                href={`mailto:${CONTACT.email.value}`}
              />
              <ContactRow
                icon={<MapPin size={16} />}
                label="Office"
                detail={CONTACT.address}
              />
              {!CONTACT.phone.confirmed && !CONTACT.email.confirmed && !CONTACT.address.confirmed && (
                <p className="footer-contact-note">
                  <Link to="/contact-us">Use the project enquiry form to tell us what you are planning.</Link>
                </p>
              )}
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
