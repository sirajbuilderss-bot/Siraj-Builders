import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import useContent from "../hooks/useContent";
import useReveal from "../hooks/useReveal";
import { getProjectBySlug, getProjects } from "../services/publicData";
import { useSeoOverride } from "../components/seo/Seo";
import ProjectCard, { projectHref } from "../components/projects/ProjectCard";
import { Btn, Paras } from "../components/sections/shared";
import { CheckList } from "../components/sections/blocks";
import HeroGraphic, { heroMotionVariant } from "../components/sections/HeroGraphic";
import { ArrowLeft, ArrowRight, Close } from "../components/ui/Icons";
import { toEmbed } from "../lib/video";
import RouteLoader from "../components/layout/RouteLoader";
import { CTA } from "../config/site";
import NotFound from "./NotFound";
import "../styles/sections.css";
import "../styles/projects.css";

/**
 * PROJECT CASE STUDY — /projects/:slug
 *
 * Tells the documented story in order:
 *   requirement → challenge → solution → construction approach →
 *   quality & management → result
 * with a facts panel, gallery (lightbox), videos, verified client feedback,
 * related projects and a closing call to action. Every field comes from
 * Admin → Projects; a blank field simply does not render.
 *
 * The old URL format, /project-detail?project=slug, redirects here.
 */

const STORY = [
  ["requirement", "The client requirement"],
  ["challenge", "The challenge"],
  ["solution", "Our solution"],
  ["approach", "Construction approach"],
  ["quality", "Quality & management"],
  ["result", "The result"],
];

/* ---------------------------------------------------------------- lightbox */
function Lightbox({ images, index, onClose, onMove }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onMove(1);
      if (event.key === "ArrowLeft") onMove(-1);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose, onMove]);

  const image = images[index];
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Project image viewer" onClick={onClose}>
      <button className="lightbox-close" type="button" aria-label="Close" onClick={onClose}>
        <Close size={22} />
      </button>
      {images.length > 1 && (
        <button
          className="lightbox-nav is-prev"
          type="button"
          aria-label="Previous image"
          onClick={(event) => {
            event.stopPropagation();
            onMove(-1);
          }}
        >
          <ArrowLeft size={22} />
        </button>
      )}
      <figure className="lightbox-figure" onClick={(event) => event.stopPropagation()}>
        <img src={image.url} alt={image.alt || image.caption || ""} />
        <figcaption>
          {image.caption && <span>{image.caption}</span>}
          <span className="lightbox-count">
            {index + 1} / {images.length}
          </span>
        </figcaption>
      </figure>
      {images.length > 1 && (
        <button
          className="lightbox-nav is-next"
          type="button"
          aria-label="Next image"
          onClick={(event) => {
            event.stopPropagation();
            onMove(1);
          }}
        >
          <ArrowRight size={22} />
        </button>
      )}
    </div>
  );
}

function Gallery({ images, title, isConcept = false }) {
  const [open, setOpen] = useState(-1);
  const move = useCallback(
    (step) => setOpen((current) => (current + step + images.length) % images.length),
    [images.length]
  );
  const close = useCallback(() => setOpen(-1), []);
  if (!images.length) return null;

  return (
    <section className="cs-section sx--light" aria-labelledby="cs-gallery">
      <div className="container">
        <div className="cs-section-head reveal">
          <span className="eyebrow">Gallery</span>
          <h2 className="h2" id="cs-gallery">
            {isConcept ? "Visual references" : "Project photographs"}
          </h2>
        </div>
        <ul className={`cs-gallery cs-gallery--${Math.min(images.length, 5)}`}>
          {images.map((image, index) => (
            <li key={`${image.url}-${index}`} className="reveal" style={{ "--d": `${Math.min(index, 6) * 0.05}s` }}>
              <button type="button" onClick={() => setOpen(index)} aria-label={`Open image ${index + 1} of ${images.length}`}>
                <img src={image.url} alt={image.alt || image.caption || `${title} — image ${index + 1}`} loading="lazy" decoding="async" />
                {image.caption && <span className="cs-gallery-cap">{image.caption}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {open > -1 && <Lightbox images={images} index={open} onClose={close} onMove={move} />}
    </section>
  );
}

function Videos({ videos, isConcept = false }) {
  const playable = videos.map((video) => ({ ...video, embed: toEmbed(video.url) }));
  if (!playable.length) return null;
  return (
    <section className="cs-section sx--white" aria-labelledby="cs-videos">
      <div className="container">
        <div className="cs-section-head reveal">
          <span className="eyebrow">Video</span>
          <h2 className="h2" id="cs-videos">
            {isConcept ? "Construction footage" : playable.length > 1 ? "Project videos" : "Project video"}
          </h2>
        </div>
        <div className={`cs-videos${playable.length > 1 ? " is-multi" : ""}`}>
          {playable.map((video, index) => (
            <figure className="cs-video reveal" key={`${video.url}-${index}`}>
              <div className="cs-video-frame">
                {video.embed?.kind === "iframe" ? (
                  <iframe
                    src={video.embed.src}
                    title={video.caption || `Project video ${index + 1}`}
                    loading="lazy"
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  />
                ) : video.embed?.kind === "file" ? (
                  <video src={video.embed.src} controls preload="metadata" playsInline />
                ) : (
                  <a className="cs-video-link" href={video.url} target="_blank" rel="noopener noreferrer">
                    Open video <ArrowRight size={16} />
                  </a>
                )}
              </div>
              {video.caption && <figcaption>{video.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Related({ project }) {
  const { data: all } = useContent(getProjects, [], { fallbackOnEmpty: false });
  const related = useMemo(() => {
    const others = all.filter((p) => p.slug !== project.slug);
    const same = others.filter((p) => p.category === project.category);
    return [...same, ...others.filter((p) => p.category !== project.category)].slice(0, 3);
  }, [all, project.slug, project.category]);
  if (!related.length) return null;
  return (
    <section className="cs-section sx--white" aria-labelledby="cs-related">
      <div className="container">
        <div className="cs-section-head cs-section-head--split reveal">
          <div>
            <span className="eyebrow">More work</span>
            <h2 className="h2" id="cs-related">
              Related projects
            </h2>
          </div>
          <Btn to="/projects" label="View all projects" variant="ghost" />
        </div>
        <div className="pgrid">
          {related.map((item, index) => (
            <ProjectCard project={item} index={index} key={item.slug} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ProjectDetail() {
  const params = useParams();
  const location = useLocation();
  const legacySlug = new URLSearchParams(location.search).get("project");
  const slug = params.slug || "";

  const loader = useCallback(() => (slug ? getProjectBySlug(slug) : Promise.resolve(null)), [slug]);
  const { data: project, isLoading } = useContent(loader, null, {
    fallbackOnEmpty: false,
    deps: [slug],
  });
  useReveal();

  useSeoOverride(
    project
      ? {
          title: project.seoTitle || `${project.title} | ${project.category} Project | Siraj Builders`,
          description: project.seoDescription || project.summary,
          image: project.image,
        }
      : null
  );

  /* Old links: /project-detail?project=slug → /projects/slug */
  if (!params.slug && legacySlug) return <Navigate to={projectHref(legacySlug)} replace />;
  if (isLoading) return <RouteLoader />;
  if (!project) return <NotFound />;

  const facts = [
    ["Type", project.category],
    ["Location", project.location],
    ["Status", project.status],
    ["Year", project.year],
    ["Area", project.area],
    ["Timeline", project.timeline],
    ["Scope", project.scope],
    ["Client", project.clientName],
  ].filter(([, value]) => value);
  const story = STORY.filter(([key]) => project[key]);
  const heroImage = project.banner || project.image;
  const heroMotion = heroMotionVariant(project.slug || "project");
  const serviceHref = project.serviceSlug ? `/${project.serviceSlug}` : "";

  return (
    <article className="case-study">
      {/* ---------------- HERO ---------------- */}
      <header className={`cs-hero sx-hero--motion-${heroMotion}${heroImage ? " has-image" : ""}`} style={heroImage ? { "--hero-image": `url("${heroImage}")` } : undefined}>
        <div className="sx-hero-bg" aria-hidden="true" />
        <HeroGraphic variant={heroMotion} />
        <div className="container cs-hero-inner">
          <nav className="sx-crumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link to="/projects">Projects</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{project.title}</span>
          </nav>
          <div className="cs-badges">
            {project.category && <span className="pcard-badge">{project.category}</span>}
            {project.status && !(project.isConcept && project.status === "Concept study") && <span className="pcard-badge pcard-badge--ghost">{project.status}</span>}
            {project.isConcept && <span className="pcard-badge pcard-badge--concept">Concept study</span>}
          </div>
          <h1 className="sx-hero-title">{project.title}</h1>
          {(project.location || project.year) && (
            <p className="cs-hero-meta">{[project.location, project.year].filter(Boolean).join(" · ")}</p>
          )}
          {project.summary && <p className="sx-hero-lead">{project.summary}</p>}
        </div>
      </header>


      {/* ---------------- OVERVIEW + FACTS ---------------- */}
      <section className="cs-section sx--white">
        <div className="container cs-overview">
          <div className="cs-overview-text reveal">
            <span className="eyebrow">Project overview</span>
            <h2 className="h2">{project.isConcept ? "Design brief" : project.overview ? "About the project" : project.title}</h2>
            <Paras text={project.overview || project.summary} />
            {project.features.length > 0 && (
              <>
                <h3 className="cs-subhead">Key features</h3>
                <CheckList items={project.features.map((f) => ({ title: f }))} columns={2} />
              </>
            )}
          </div>
          {facts.length > 0 && (
            <aside className="cs-facts reveal" style={{ "--d": "0.1s" }} aria-label="Project details">
              <h2 className="cs-facts-title">Project details</h2>
              <dl>
                {facts.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              {serviceHref && (
                <Link className="cs-facts-link" to={serviceHref}>
                  Explore the service behind this project <ArrowRight size={15} />
                </Link>
              )}
            </aside>
          )}
        </div>
      </section>

      {/* ---------------- THE STORY ---------------- */}
      {story.length > 0 && (
        <section className="cs-section sx--light" aria-labelledby="cs-story">
          <div className="container">
            <div className="cs-section-head reveal">
              <span className="eyebrow">Case study</span>
              <h2 className="h2" id="cs-story">
                From requirement to result
              </h2>
            </div>
            <ol className="cs-story">
              {story.map(([key, label], index) => (
                <li className="cs-story-step reveal" key={key} style={{ "--d": `${index * 0.05}s` }}>
                  <span className="cs-story-num" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3>{label}</h3>
                    <Paras text={project[key]} />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <Gallery images={project.images} title={project.title} isConcept={project.isConcept} />
      <Videos videos={project.videos} isConcept={project.isConcept} />

      {/* ---------------- FEEDBACK (verified only) ---------------- */}
      {project.feedback && (
        <section className="cs-section sx--dark" aria-label="Client feedback">
          <div className="container">
            <figure className="cs-quote reveal">
              <span className="quote-mark" aria-hidden="true">“</span>
              <blockquote>{project.feedback}</blockquote>
              {project.clientName && (
                <figcaption>
                  <b>{project.clientName}</b>
                  <span>{[project.category, project.location].filter(Boolean).join(" — ")}</span>
                </figcaption>
              )}
            </figure>
          </div>
        </section>
      )}

      <Related project={project} />

      {/* ---------------- CTA ---------------- */}
      <section className="sx-cta sx-cta--dark">
        <div className="container">
          <div className="sx-cta-inner reveal">
            <div className="sx-cta-copy">
              <span className="eyebrow">Start with clarity</span>
              <h2 className="h2">Planning a similar project?</h2>
              <p>Tell us what you are planning, where the property is and what you need from your construction partner.</p>
            </div>
            <div className="sx-actions sx-cta-actions">
              <Btn to={CTA.primary.to} label={CTA.primary.label} variant="light" />
              <Btn to="/projects" label="Back to all projects" variant="outline-light" />
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
