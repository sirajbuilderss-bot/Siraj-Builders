import { Link } from "react-router-dom";
import { CTA, SERVICE_LINKS } from "../config/site";
import "../styles/not-found.css";

/**
 * Real 404 page.
 *
 * The previous router mapped `path="*"` to the About page, so every
 * mistyped or dead URL returned the About content with a 200-equivalent
 * render. That hides broken links from analytics and lets search engines
 * index unlimited duplicate copies of the About page.
 */
export default function NotFound() {
  const confirmedServices = SERVICE_LINKS.filter((service) => service.confirmed);

  return (
    <section className="notfound">
      <div className="container notfound-inner">
        <span className="eyebrow">Error 404</span>
        <h1 className="notfound-title">This page could not be found.</h1>
        <p className="notfound-lead">
          The link may be out of date or the address may have been mistyped.
          The pages below are the most useful places to pick up from.
        </p>

        <div className="notfound-actions">
          <Link className="btn btn-primary" to="/">
            Back to home <span className="arrow">→</span>
          </Link>
          <Link className="btn btn-ghost" to={CTA.primary.to}>
            {CTA.primary.label} <span className="arrow">→</span>
          </Link>
        </div>

        <nav className="notfound-links" aria-label="Suggested pages">
          <div className="notfound-group">
            <h2>Services</h2>
            {confirmedServices.map((service) => (
              <Link key={service.to} to={service.to}>
                {service.label}
              </Link>
            ))}
          </div>
          <div className="notfound-group">
            <h2>Company</h2>
            <Link to="/who-we-are">About Siraj Builders</Link>
            <Link to="/projects">Projects</Link>
            <Link to="/our-process">Our Process</Link>
            <Link to="/faq">FAQs</Link>
            <Link to="/contact-us">Contact</Link>
          </div>
        </nav>
      </div>
    </section>
  );
}
