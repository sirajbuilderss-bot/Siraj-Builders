/**
 * assets/include.js
 * Header + Footer ab JS ke andar hain.
 * Isse file:// (double-click) pe bhi kaam karega — server ki zaroorat nahi.
 */

(function () {
  "use strict";

  var includeScriptUrl = document.currentScript
    ? new URL(document.currentScript.src, document.baseURI)
    : new URL("assets/include.js", document.baseURI);

  // ========== HEADER HTML ==========
  var HEADER_HTML = `
<header class="site-header" id="siteHeader" data-site-nav>
  <div class="topbar">
    <div class="container">
      <div class="topbar-meta">
        <a href="tel:+920000000000" aria-label="Call Siraj Builders">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"/>
          </svg>
          +92 000 0000000
        </a>
        <a href="mailto:info@sirajbuilders.com" aria-label="Email Siraj Builders">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2"/>
            <path d="m3 7 9 6 9-6"/>
          </svg>
          info@sirajbuilders.com
        </a>
      </div>
      <a href="consultation.html">Discuss your project <span>→</span></a>
    </div>
  </div>

  <div class="nav-wrap">
    <div class="container nav-inner">
      <a class="brand" href="index.html" aria-label="Siraj Builders home">
        <span class="brand-mark">SB</span>
        <span>Siraj Builders</span>
      </a>

      <nav class="menu" aria-label="Primary navigation">
        <div class="dropdown">
          <button class="drop-toggle" type="button" aria-expanded="false">
            Services <span class="chevron">⌄</span>
          </button>
          <div class="drop-panel" aria-label="Services">
            <a href="residential-construction.html">Residential Construction</a>
            <a href="commercial-construction.html">Commercial Construction</a>
            <a href="renovation-remodelling.html">Renovation &amp; Remodelling</a>
            <a href="design-architecture.html">Design &amp; Architecture</a>
            <a href="grey-structure.html">Grey Structure</a>
            <a href="turnkey-construction.html">Turnkey Construction</a>
            <a href="project-management.html">Project Management</a>
          </div>
        </div>

        <a href="index.html" class="is-active" data-nav="index.html">Home</a>
        <a href="who-we-are.html" data-nav="who-we-are.html">About</a>
        <a href="market-sectors.html" data-nav="market-sectors.html">Projects</a>
        <a href="our-process.html" data-nav="our-process.html">Our Process</a>
        <a href="faq.html" data-nav="faq.html">FAQs</a>
        <a href="contact-us.html" data-nav="contact-us.html">Contact</a>
        <a class="btn btn-primary nav-cta" href="consultation.html">
          Discuss Your Project <span class="arrow">→</span>
        </a>
      </nav>

      <button class="hamb" type="button" aria-label="Open navigation menu" aria-expanded="false" aria-controls="mobileMenu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>

<div class="menu-backdrop" data-menu-backdrop></div>
<nav class="mobile-menu" id="mobileMenu" aria-label="Mobile navigation">
  <a href="index.html" data-nav="index.html">Home</a>
  <a href="who-we-are.html" data-nav="who-we-are.html">About</a>

  <button class="mobile-section-toggle" type="button" data-mobile-toggle="mservices" aria-expanded="false">
    Services <span>+</span>
  </button>
  <div class="mobile-sub" id="mservices">
    <a href="residential-construction.html" data-nav="residential-construction.html">Residential Construction</a>
    <a href="commercial-construction.html" data-nav="commercial-construction.html">Commercial Construction</a>
    <a href="renovation-remodelling.html" data-nav="renovation-remodelling.html">Renovation &amp; Remodelling</a>
    <a href="design-architecture.html" data-nav="design-architecture.html">Design &amp; Architecture</a>
    <a href="grey-structure.html" data-nav="grey-structure.html">Grey Structure</a>
    <a href="turnkey-construction.html" data-nav="turnkey-construction.html">Turnkey Construction</a>
    <a href="project-management.html" data-nav="project-management.html">Project Management</a>
  </div>

  <a href="market-sectors.html" data-nav="market-sectors.html">Projects</a>
  <a href="our-process.html" data-nav="our-process.html">Our Process</a>
  <a href="project-showcase.html" data-nav="project-showcase.html">Project Showcase</a>
  <a href="locations.html" data-nav="locations.html">Locations</a>
  <a href="faq.html" data-nav="faq.html">FAQs</a>
  <a href="contact-us.html" data-nav="contact-us.html">Contact</a>
  <a class="btn btn-primary" href="consultation.html">
    Discuss Your Project <span class="arrow">→</span>
  </a>
</nav>
`;

  // ========== FOOTER HTML ==========
  var FOOTER_HTML = `
<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="brand" href="index.html">
          <span class="brand-mark">SB</span><span>Siraj Builders</span>
        </a>
        <p>Construction, managed from the first plan to the final detail. Built around clarity, responsible execution and lasting value.</p>
        <div class="footer-social">
          <a href="#" aria-label="Facebook">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.25-1.5 1.55-1.5h1.65V4.6c-.29-.04-1.27-.13-2.4-.13-2.38 0-4.01 1.45-4.01 4.13v2.31H7.6V14h2.69v8h3.21z"/></svg>
          </a>
          <a href="#" aria-label="Instagram">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor"/></svg>
          </a>
          <a href="#" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.11 1 2.48 1s2.5 1.12 2.5 2.5zM.5 22h4V8h-4v14zM8.5 8h3.83v1.91h.05c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.78 2.65 4.78 6.09V22h-4v-6.41c0-1.53-.03-3.5-2.13-3.5-2.13 0-2.46 1.66-2.46 3.38V22h-3.84V8z"/></svg>
          </a>
          <a href="#" aria-label="WhatsApp">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12 0C5.4 0 0 5.4 0 12c0 2.1.55 4.15 1.6 5.95L0 24l6.3-1.63A11.9 11.9 0 0 0 12 24c6.6 0 12-5.4 12-12 0-3.2-1.25-6.2-3.5-8.5zM12 21.8c-1.9 0-3.75-.51-5.35-1.47l-.38-.23-3.74.98 1-3.65-.25-.4A9.76 9.76 0 0 1 2.2 12C2.2 6.6 6.6 2.2 12 2.2S21.8 6.6 21.8 12 17.4 21.8 12 21.8zm5.35-7.3c-.3-.15-1.75-.85-2-.95-.26-.1-.44-.15-.63.15-.2.3-.72.95-.88 1.14-.17.2-.33.22-.62.08-.3-.15-1.25-.46-2.37-1.47-.87-.79-1.46-1.76-1.63-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.33.44-.5.15-.16.2-.28.3-.46.1-.2.05-.36-.03-.5-.08-.15-.63-1.5-.86-2.05-.22-.53-.45-.46-.62-.47-.16 0-.35-.03-.53-.03-.18 0-.48.07-.72.36-.25.3-.95.93-.95 2.27 0 1.33.97 2.62 1.1 2.8.13.2 1.9 3 4.6 4.2.65.28 1.15.45 1.54.58.65.2 1.24.18 1.7.11.52-.08 1.6-.65 1.83-1.29.22-.63.22-1.18.15-1.29-.06-.13-.22-.2-.47-.35z"/></svg>
          </a>
        </div>
      </div>

      <div>
        <h4>Services</h4>
        <a href="residential-construction.html">Residential Construction</a>
        <a href="commercial-construction.html">Commercial Construction</a>
        <a href="renovation-remodelling.html">Renovation &amp; Remodelling</a>
        <a href="design-architecture.html">Design &amp; Architecture</a>
        <a href="grey-structure.html">Grey Structure</a>
        <a href="turnkey-construction.html">Turnkey Construction</a>
        <a href="project-management.html">Project Management</a>
      </div>

      <div>
        <h4>Company</h4>
        <a href="who-we-are.html">About</a>
        <a href="leadership.html">Leadership</a>
        <a href="role-definition.html">Role Definition</a>
        <a href="subcontractors.html">Subcontractors</a>
        <a href="affiliates.html">Affiliates</a>
        <a href="international.html">International</a>
        <a href="market-sectors.html">Projects</a>
        <a href="our-process.html">Our Process</a>
        <a href="project-showcase.html">Project Showcase</a>
        <a href="faq.html">FAQs</a>
      </div>

      <div>
        <h4>Get in touch</h4>
        <div class="footer-contact-list">
          <a class="footer-contact-item" href="tel:+920000000000">
            <span class="footer-contact-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"/></svg>
            </span>
            <span class="footer-contact-body"><small>Call us</small><span>+92 000 0000000</span></span>
          </a>
          <a class="footer-contact-item" href="mailto:info@sirajbuilders.com">
            <span class="footer-contact-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
            </span>
            <span class="footer-contact-body"><small>Email</small><span>info@sirajbuilders.com</span></span>
          </a>
          <a class="footer-contact-item" href="https://wa.me/920000000000" target="_blank" rel="noopener">
            <span class="footer-contact-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/></svg>
            </span>
            <span class="footer-contact-body"><small>WhatsApp</small><span>Chat with our team</span></span>
          </a>
          <div class="footer-contact-item">
            <span class="footer-contact-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </span>
            <span class="footer-contact-body"><small>Office</small><span>Address — to confirm</span></span>
          </div>
          <div class="footer-contact-item">
            <span class="footer-contact-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            </span>
            <span class="footer-contact-body"><small>Hours</small><span>Mon – Sat, business hours</span></span>
          </div>
        </div>
      </div>
    </div>

   

    <div class="footer-bottom">
      <span>© 2026 Siraj Builders. All rights reserved.</span>
      <div class="footer-legal">
        <a href="privacy-policy.html">Privacy Policy</a>
        <span aria-hidden="true">·</span>
        <a href="terms.html">Terms &amp; Conditions</a>
        <span aria-hidden="true">·</span>
        <a href="locations.html">Locations</a>
        <span aria-hidden="true">·</span>
        <a href="cost-index.html">Cost Index</a>
      </div>
    </div>
  </div>
</footer>

<button class="backtop" type="button" aria-label="Back to top">↑</button>
`;

  // ========== INJECT FUNCTION ==========
  function getBasePrefix() {
    var projectRootUrl = new URL("../", includeScriptUrl);
    var pageDirectoryUrl = new URL(".", document.baseURI);
    var relativeDirectory = pageDirectoryUrl.href.indexOf(projectRootUrl.href) === 0
      ? pageDirectoryUrl.href.slice(projectRootUrl.href.length)
      : "";
    var directoryDepth = relativeDirectory.split("/").filter(Boolean).length;
    return new Array(directoryDepth + 1).join("../");
  }

  function resolveLocalLinks(html) {
    var basePrefix = getBasePrefix();
    return html.replace(
      /href="(?!#|\/|[a-z][a-z0-9+.-]*:)([^"]+)"/gi,
      function (match, href) {
        return 'href="' + basePrefix + href + '"';
      }
    );
  }

  function inject(name, html) {
    var el = document.querySelector('[data-include="' + name + '"]');
    if (!el) return;
    el.outerHTML = resolveLocalLinks(html);
  }

  function init() {
    inject("header", HEADER_HTML);
    inject("footer", FOOTER_HTML);
    document.dispatchEvent(new CustomEvent("includes-loaded"));
    document.dispatchEvent(new CustomEvent("siraj:layout-ready"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();