import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useContent from "../../hooks/useContent";
import {
  STATIC_SERVICES,
  getFaqGroups,
  getProjects,
  getServices,
  getStats,
  getTeam,
  getTestimonials,
  STATIC_FAQ_GROUPS,
} from "../../services/publicData";
import { useSiteData } from "../../context/SiteDataContext";
import ProjectCard from "../projects/ProjectCard";
import FaqBrowser, { FaqAccordion } from "../faq/FaqBrowser";
import ContactForm from "../contact/ContactForm";
import { Actions, Btn, Img, SectionFallback, SectionHead, SectionShell, SmartLink } from "./shared";
import { ArrowRight, Chat, Clock, Mail, MapPin, Phone } from "../ui/Icons";
import { CheckList } from "./blocks";
import { CTA } from "../../config/site";

const darkOf = (section) => section.settings?.theme === "dark";

/* ==========================================================================
 * SERVICES — cards from the Services manager
 * ======================================================================== */
export function ServicesBlock({ section }) {
  const { data: services } = useContent(getServices, STATIC_SERVICES, { fallbackOnEmpty: false });
  const limit = Number(section.settings?.limit) || 0;
  const list = limit ? services.slice(0, limit) : services;
  if (!list.length) return <SectionFallback section={section} message="Our services will be listed here soon." />;

  return (
    <SectionShell section={section}>
      <SectionHead section={section} actions={<Actions section={section} dark={darkOf(section)} />} />
      <div className="svc-grid" data-count={list.length}>
        {list.map((service, index) => (
          <Link
            className="svc-card reveal"
            to={service.to}
            key={service.slug}
            style={{ "--d": `${Math.min(index, 5) * 0.06}s` }}
          >
            <Img src={service.image} alt={service.title} ratio="16 / 10" className="svc-media" />
            <div className="svc-body">
              <span className="svc-num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <h3>{service.label}</h3>
              {service.summary && <p>{service.summary}</p>}
              <span className="svc-action">
                {service.ctaLabel}
                <ArrowRight size={16} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </SectionShell>
  );
}

/* ==========================================================================
 * PROJECTS — grid, or the full filterable portfolio (layout: portfolio)
 * ======================================================================== */
const CATEGORY_ORDER = ["Residential", "Commercial", "Renovation", "Design & Build"];

export function ProjectsBlock({ section }) {
  const { data: projects, isLoading } = useContent(getProjects, [], { fallbackOnEmpty: false });
  const portfolio = section.settings?.layout === "portfolio";
  const category = section.settings?.category;
  const limit = Number(section.settings?.limit) || 0;

  const filtered = category ? projects.filter((p) => p.category === category) : projects;
  const list = limit ? filtered.slice(0, limit) : filtered;

  if (!portfolio && !list.length && (section.settings?.hide_empty || isLoading)) return null;

  return (
    <SectionShell section={section}>
      <SectionHead
        section={section}
        actions={!portfolio && list.length ? <Actions section={section} dark={darkOf(section)} /> : null}
      />
      {portfolio ? (
        <Portfolio projects={projects} isLoading={isLoading} />
      ) : list.length ? (
        <div className="pgrid">
          {list.map((project, index) => (
            <ProjectCard project={project} index={index} key={project.slug} />
          ))}
        </div>
      ) : (
        <PortfolioEmpty dark={darkOf(section)} />
      )}
    </SectionShell>
  );
}

function Portfolio({ projects, isLoading }) {
  const [filter, setFilter] = useState("all");
  const categories = useMemo(() => {
    const present = new Set(projects.map((p) => p.category).filter(Boolean));
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }, [projects]);
  const visible = filter === "all" ? projects : projects.filter((p) => p.category === filter);

  if (isLoading && !projects.length) {
    return (
      <div className="pgrid" aria-busy="true" aria-label="Loading projects">
        {[0, 1, 2].map((n) => (
          <div className="pcard pcard--skeleton" key={n} />
        ))}
      </div>
    );
  }
  if (!projects.length) return <PortfolioEmpty />;

  return (
    <>
      {categories.length > 1 && (
        <div className="pfilters" role="group" aria-label="Filter projects by type">
          {["all", ...categories].map((item) => {
            const count = item === "all" ? projects.length : projects.filter((p) => p.category === item).length;
            return (
              <button
                type="button"
                key={item}
                className={filter === item ? "is-active" : ""}
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
              >
                {item === "all" ? "All projects" : item}
                <span className="pfilters-count">{count}</span>
              </button>
            );
          })}
        </div>
      )}
      <div className="pgrid" aria-live="polite">
        {visible.map((project, index) => (
          <ProjectCard project={project} index={index} key={project.slug} />
        ))}
      </div>
    </>
  );
}

function PortfolioEmpty({ dark = false }) {
  return (
    <div className={`pempty reveal${dark ? " pempty--dark" : ""}`}>
      <h3>Let's talk about your project.</h3>
      <p>Share the property, the work you have in mind and the support you need.</p>
      <div className="sx-actions">
        <Btn to={CTA.primary.to} label={CTA.primary.label} variant={dark ? "light" : "primary"} />
        <Btn to={CTA.supporting.to} label={CTA.supporting.label} variant={dark ? "outline-light" : "ghost"} />
      </div>
    </div>
  );
}

/* ==========================================================================
 * TESTIMONIALS — verified quotes only (see content.js)
 * ======================================================================== */
export function TestimonialsBlock({ section }) {
  const { data: quotes, isLoading } = useContent(getTestimonials, [], { fallbackOnEmpty: false });
  const full = section.settings?.layout === "full";
  const limit = full ? 0 : Number(section.settings?.limit) || 0;
  const list = limit ? quotes.slice(0, limit) : quotes;

  if (!list.length && isLoading) return null;
  if (!list.length) return null;

  return (
    <SectionShell section={section}>
      <SectionHead section={section} />
      {list.length ? (
        <div className="quotes">
          {list.map((item, index) => (
            <figure className="quote-card reveal" key={item.id} style={{ "--d": `${Math.min(index, 5) * 0.06}s` }}>
              <span className="quote-mark" aria-hidden="true">“</span>
              <blockquote>{item.quote}</blockquote>
              <figcaption>
                {item.image_url && <img src={item.image_url} alt="" loading="lazy" />}
                <span>
                  <b>{item.client_name}</b>
                  {(item.project_type || item.location) && (
                    <span>{[item.project_type, item.location].filter(Boolean).join(" — ")}</span>
                  )}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </SectionShell>
  );
}

/* ==========================================================================
 * FAQ — homepage preview, or the full browser (layout: full)
 * ======================================================================== */
export function FaqBlock({ section }) {
  const { data: groups } = useContent(getFaqGroups, STATIC_FAQ_GROUPS);
  if (section.settings?.layout === "full") {
    return (
      <SectionShell section={section}>
        <FaqBrowser groups={groups} />
      </SectionShell>
    );
  }
  const all = groups.flatMap((g) => g.items);
  const home = all.filter((item) => item.home);
  const limit = Number(section.settings?.limit) || 4;
  const list = (home.length ? home : all).slice(0, limit);
  if (!list.length) return null;

  return (
    <SectionShell section={section}>
      <div className="fq-preview">
        <div className="fq-preview-head reveal">
          {section.eyebrow && <span className="eyebrow">{section.eyebrow}</span>}
          {section.title && <h2 className="h2">{section.title}</h2>}
          {section.body && <p className="sx-body sx-body--muted">{section.body}</p>}
          <Actions section={section} dark={darkOf(section)} />
        </div>
        <FaqAccordion items={list} className="reveal" />
      </div>
    </SectionShell>
  );
}

/* ==========================================================================
 * STATS — verified numbers only; hidden until some exist
 * ======================================================================== */
export function StatsBlock({ section }) {
  const { data: stats } = useContent(getStats, [], { fallbackOnEmpty: false });
  if (!stats.length) return null;
  return (
    <SectionShell section={section}>
      <SectionHead section={{ ...section, body: "" }} />
      <dl className="stats-row">
        {stats.map((stat) => (
          <div className="stat reveal" key={stat.id}>
            <dt>{stat.label}</dt>
            <dd>
              {stat.value}
              {stat.suffix && <span>{stat.suffix}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </SectionShell>
  );
}

/* ==========================================================================
 * TEAM — verified profiles only; hidden until some exist
 * ======================================================================== */
export function TeamBlock({ section }) {
  const { data: team } = useContent(getTeam, [], { fallbackOnEmpty: false });
  if (!team.length) return null;
  const hasSampleRoles = team.some((person) => person.isSample);
  const teamSection = hasSampleRoles
    ? { ...section, eyebrow: "Project roles", title: "Clear roles keep the work moving.", body: "Planning, site coordination and quality review each play a part in a well-managed construction project." }
    : section;
  return (
    <SectionShell section={section}>
      <SectionHead section={teamSection} />
      <div className="team-grid">
        {team.map((person) => (
          <article className="team-card reveal" key={person.id}>
            {person.image_url ? (
              <Img src={person.image_url} alt={person.isSample ? `Stock portrait representing the ${person.name} role` : person.name} ratio="4 / 5" />
            ) : (
              <div className="team-initials" aria-hidden="true">
                {person.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </div>
            )}
            <div className="team-body">
              {person.isSample && <span className="team-sample-label">Project role · stock portrait</span>}
              <h3>{person.name}</h3>
              {person.role && <span className="team-role">{person.role}</span>}
              {person.bio && <p>{person.bio}</p>}
              {person.linkedin_url && (
                <SmartLink to={person.linkedin_url} className="team-link">
                  LinkedIn profile
                </SmartLink>
              )}
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

/* ==========================================================================
 * CONTACT — confirmed channel cards (layout: cards) or the enquiry form
 * (layout: form). Admin setup placeholders never reach public copy.
 * ======================================================================== */
export function ContactBlock({ section }) {
  const { contact, whatsappHref, settingValue } = useSiteData();

  if (section.settings?.layout === "form") {
    return (
      <SectionShell section={section}>
        <div className="contact-layout">
          <ContactForm heading={section.title} intro={section.body} eyebrow={section.eyebrow} />
          {section.items.length > 0 && (
            <aside className="cform-aside reveal">
              <span className="eyebrow">Useful to share</span>
              <h3>Bring what you already know.</h3>
              <CheckList items={section.items} />
              <Btn to={CTA.highIntent.to} label={CTA.highIntent.label} variant="ghost" />
            </aside>
          )}
        </div>
      </SectionShell>
    );
  }

  const cards = [
    { key: "phone", icon: Phone, label: "Call us", detail: contact.phone, href: `tel:${contact.phone.value}` },
    {
      key: "whatsapp",
      icon: Chat,
      label: settingValue("whatsapp_cta_label", CTA.whatsapp.label),
      detail: contact.whatsapp,
      href: whatsappHref,
    },
    { key: "email", icon: Mail, label: "Email", detail: contact.email, href: `mailto:${contact.email.value}` },
    { key: "address", icon: MapPin, label: "Office", detail: contact.address },
    { key: "hours", icon: Clock, label: "Business hours", detail: contact.hours },
  ];
  const availableCards = cards.filter(({ detail }) => detail.confirmed && detail.value);

  return (
    <SectionShell section={section}>
      <SectionHead section={section} />
      {availableCards.length > 0 ? (
        <div className="contact-cards">
          {availableCards.map(({ key, icon: Icon, label, detail, href }) => {
            const inner = (
              <>
                <span className="contact-card-icon" aria-hidden="true">
                  <Icon size={20} />
                </span>
                <span className="contact-card-label">{label}</span>
                <span className="contact-card-value">{detail.value}</span>
              </>
            );
            return href ? (
              <a className="contact-card reveal is-link" href={href} key={key} {...(key === "whatsapp" ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {inner}
              </a>
            ) : (
              <div className="contact-card reveal" key={key}>
                {inner}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="contact-cards">
          <p className="contact-card-empty">
            Use the enquiry form below to share your project details and what you need help with.
          </p>
        </div>
      )}
    </SectionShell>
  );
}
