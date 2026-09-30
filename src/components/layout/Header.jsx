import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { PRIMARY_NAV, CTA } from "../../config/site";
import { useSiteData } from "../../context/SiteDataContext";

/* ---------------- DATA ----------------
   Navigation now comes from src/config/site.js so the header, footer,
   404 page and sitemap cannot drift apart.
--------------------------------------- */

const MOBILE_EXTRA = [
  { to: "/project-showcase", label: "Project Visibility" },
  { to: "/locations", label: "Service Areas" },
];

/* ---------------- ICONS ---------------- */

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
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
      viewBox="0 0 24 24"
      width="14"
      height="14"
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

function ChevronIcon() {
  return (
    <svg
      className="chevron"
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/* ---------------- COMPONENT ---------------- */

export default function Header() {
  const { pathname } = useLocation();

  /* Company details, contact details and the service list now come from the
     database, falling back to src/config/site.js when it cannot answer. They
     are destructured under their original names so the markup below is
     unchanged — the header renders exactly as it did before. */
  const {
    company: COMPANY,
    contact: CONTACT,
    serviceLinks: SERVICE_LINKS,
  } = useSiteData();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);

  const dropdownRef = useRef(null);
  const closeTimer = useRef(null);

  const isServicePage = SERVICE_LINKS.some(
    (s) => pathname === s.to || pathname.startsWith(s.to + "/")
  );

  /* ---- scroll state ---- */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---- close everything on route change ---- */
  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
    setMobileServicesOpen(false);
  }, [pathname]);

  /* ---- lock body scroll when mobile menu open ---- */
  useEffect(() => {
    document.body.classList.toggle("no-scroll", menuOpen);
    return () => document.body.classList.remove("no-scroll");
  }, [menuOpen]);

  /* ---- click / touch outside closes dropdown ---- */
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [dropdownOpen]);

  /* ---- ESC closes everything ---- */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setDropdownOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  /* ---- clear pending hover timer on unmount ---- */
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  /* ---- hover helpers (mouse only) ---- */
  const handlePointerEnter = (e) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(closeTimer.current);
    setDropdownOpen(true);
  };

  const handlePointerLeave = (e) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setDropdownOpen(false), 150);
  };

  const isActive = (to) => {
    if (to === "/") return pathname === "/";
    return pathname === to || pathname.startsWith(to + "/");
  };

  const headerClass = [
    "site-header",
    scrolled ? "is-scrolled" : "",
    menuOpen ? "menu-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <header className={headerClass} id="siteHeader" data-site-nav>
        {/* ---------- TOP BAR ---------- */}
        <div className="topbar">
          <div className="container">
            <div className="topbar-meta">
              {CONTACT.phone.confirmed ? (
                <a
                  href={`tel:${CONTACT.phone.value}`}
                  aria-label={`Call ${COMPANY.name}`}
                >
                  <PhoneIcon />
                  <span>{CONTACT.phone.value}</span>
                </a>
              ) : (
                <span className="topbar-pending">
                  <PhoneIcon />
                  <span>{CONTACT.phone.display}</span>
                </span>
              )}
              {CONTACT.email.confirmed ? (
                <a
                  href={`mailto:${CONTACT.email.value}`}
                  aria-label={`Email ${COMPANY.name}`}
                >
                  <MailIcon />
                  <span>{CONTACT.email.value}</span>
                </a>
              ) : (
                <span className="topbar-pending">
                  <MailIcon />
                  <span>{CONTACT.email.display}</span>
                </span>
              )}
            </div>

            <Link to={CTA.primary.to} className="topbar-cta">
              {CTA.primary.label} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* ---------- MAIN NAV ---------- */}
        <div className="nav-wrap">
          <div className="container nav-inner">
            <Link className="brand" to="/" aria-label={`${COMPANY.name} home`}>
              <span className="brand-mark">{COMPANY.initials}</span>
              <span className="brand-name">{COMPANY.name}</span>
            </Link>

            <nav className="menu" aria-label="Primary navigation">
              {/* ---- Services dropdown ---- */}
              <div
                className={[
                  "dropdown",
                  dropdownOpen ? "is-open" : "",
                  isServicePage ? "is-current" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                ref={dropdownRef}
                onPointerEnter={handlePointerEnter}
                onPointerLeave={handlePointerLeave}
              >
                <button
                  className="drop-toggle"
                  type="button"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  onClick={() => setDropdownOpen((v) => !v)}
                >
                  Services
                  <ChevronIcon />
                </button>

                <div className="drop-panel" role="menu">
                  {SERVICE_LINKS.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      role="menuitem"
                      onClick={() => setDropdownOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* ---- Normal links ---- */}
              {PRIMARY_NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={isActive(item.to) ? "is-active" : undefined}
                >
                  {item.label}
                </Link>
              ))}

              <Link className="btn btn-primary nav-cta" to={CTA.primary.to}>
                {CTA.primary.label} <span className="arrow">→</span>
              </Link>
            </nav>

            <button
              className={`hamb${menuOpen ? " is-open" : ""}`}
              type="button"
              aria-label={
                menuOpen ? "Close navigation menu" : "Open navigation menu"
              }
              aria-expanded={menuOpen}
              aria-controls="mobileMenu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {/* ---------- MOBILE BACKDROP ---------- */}
      <div
        className={`menu-backdrop${menuOpen ? " is-open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* ---------- MOBILE MENU ---------- */}
      <nav
        className={`mobile-menu${menuOpen ? " is-open" : ""}`}
        id="mobileMenu"
        aria-label="Mobile navigation"
      >
        <Link to="/" onClick={() => setMenuOpen(false)}>
          Home
        </Link>

        <Link to="/who-we-are" onClick={() => setMenuOpen(false)}>
          About
        </Link>

        <button
          className="mobile-section-toggle"
          type="button"
          aria-expanded={mobileServicesOpen}
          aria-controls="mservices"
          onClick={() => setMobileServicesOpen((v) => !v)}
        >
          Services{" "}
          <span aria-hidden="true">{mobileServicesOpen ? "−" : "+"}</span>
        </button>

        <div
          className={`mobile-sub${mobileServicesOpen ? " is-open" : ""}`}
          id="mservices"
        >
          <div className="mobile-sub-inner">
            {SERVICE_LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <Link to="/projects" onClick={() => setMenuOpen(false)}>
          Projects
        </Link>

        <Link to="/our-process" onClick={() => setMenuOpen(false)}>
          Our Process
        </Link>

        {MOBILE_EXTRA.map((item) => (
          <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}>
            {item.label}
          </Link>
        ))}

        <Link to="/faq" onClick={() => setMenuOpen(false)}>
          FAQs
        </Link>

        <Link to="/contact-us" onClick={() => setMenuOpen(false)}>
          Contact
        </Link>

        <Link
          className="btn btn-primary"
          to={CTA.primary.to}
          onClick={() => setMenuOpen(false)}
        >
          {CTA.primary.label} <span className="arrow">→</span>
        </Link>
      </nav>
    </>
  );
}