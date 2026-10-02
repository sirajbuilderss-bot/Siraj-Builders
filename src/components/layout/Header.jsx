import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { PRIMARY_NAV, CTA } from "../../config/site";
import { useSiteData } from "../../context/SiteDataContext";
import { ArrowRight, Mail, Phone } from "../ui/Icons";

/* ---------------- DATA ----------------
   Navigation now comes from src/config/site.js so the header, footer,
   404 page and sitemap cannot drift apart.
--------------------------------------- */

const MOBILE_EXTRA = [
  { to: "/project-showcase", label: "Project Visibility" },
  { to: "/locations", label: "Service Areas" },
];

/* ---------------- ICONS ---------------- */

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
   are destructured under the original names. Only confirmed contact details
   appear in the public header. */
  const {
    company: COMPANY,
    contact: CONTACT,
    serviceLinks: SERVICE_LINKS,
    settingValue,
  } = useSiteData();

  /* Header button — editable in Admin → Settings → Navigation. */
  const headerCta = {
    label: settingValue("header_cta_label", CTA.primary.label),
    to: settingValue("header_cta_href", CTA.primary.to),
  };

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);

  const dropdownRef = useRef(null);
  const closeTimer = useRef(null);

  const isServicePage =
    pathname === "/services" ||
    SERVICE_LINKS.some(
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
                  <Phone size={14} />
                  <span>{CONTACT.phone.value}</span>
                </a>
              ) : null}
              {CONTACT.email.confirmed ? (
                <a
                  href={`mailto:${CONTACT.email.value}`}
                  aria-label={`Email ${COMPANY.name}`}
                >
                  <Mail size={14} />
                  <span>{CONTACT.email.value}</span>
                </a>
              ) : null}
            </div>

            <Link to={headerCta.to} className="topbar-cta">
              {headerCta.label} <ArrowRight size={15} />
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
                  <Link
                    to="/services"
                    role="menuitem"
                    className="drop-all"
                    onClick={() => setDropdownOpen(false)}
                  >
                    All services
                  </Link>
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

              <Link className="btn btn-primary nav-cta" to={headerCta.to}>
                {headerCta.label} <span className="arrow"><ArrowRight size={17} /></span>
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
            <Link to="/services" onClick={() => setMenuOpen(false)}>
              All services
            </Link>
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
          to={headerCta.to}
          onClick={() => setMenuOpen(false)}
        >
          {headerCta.label} <span className="arrow"><ArrowRight size={17} /></span>
        </Link>
      </nav>
    </>
  );
}
