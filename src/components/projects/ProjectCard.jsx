import { Link } from "react-router-dom";
import { ArrowRight, Calendar, MapPin } from "../ui/Icons";
import "../../styles/projects.css";

export const projectHref = (slug) => `/projects/${encodeURIComponent(slug)}`;

/**
 * PORTFOLIO CARD
 * Fixed 4:3 image, two badges, title, one meta line, a two-line summary and
 * the action. Every card in a grid has the same height regardless of how much
 * text a project has, because the summary is clamped and the meta line is a
 * single row.
 */
export default function ProjectCard({ project, index = 0, headingLevel = 3 }) {
  const Heading = `h${headingLevel}`;
  const meta = [
    project.location && { icon: MapPin, text: project.location },
    (project.year || project.status) && {
      icon: Calendar,
      text: [project.status, project.year].filter(Boolean).join(" · "),
    },
  ].filter(Boolean);

  return (
    <article
      className="pcard reveal"
      style={{ "--d": `${Math.min(index, 5) * 0.06}s` }}
    >
      <Link className="pcard-link" to={projectHref(project.slug)} aria-label={`${project.title} — view case study`}>
        <div className={`pcard-media${project.image ? "" : " is-empty"}`}>
          {project.image ? (
            <img
              src={project.image}
              alt={`${project.title} — ${project.category} project`}
              loading="lazy"
              decoding="async"
              width="800"
              height="600"
            />
          ) : (
            <span className="pcard-placeholder" aria-hidden="true">
              {project.title.slice(0, 1)}
            </span>
          )}
          <div className="pcard-badges">
            {project.category && <span className="pcard-badge">{project.category}</span>}
            {project.isFeatured && <span className="pcard-badge pcard-badge--accent">Featured</span>}
            {project.isConcept && <span className="pcard-badge pcard-badge--concept">Concept study</span>}
          </div>
        </div>

        <div className="pcard-body">
          <Heading className="pcard-title">{project.title}</Heading>
          {meta.length > 0 && (
            <ul className="pcard-meta">
              {meta.map(({ icon: Icon, text }) => (
                <li key={text}>
                  <Icon size={15} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          )}
          {project.summary && <p className="pcard-summary">{project.summary}</p>}
          <span className="pcard-action">
            {project.isConcept ? "View concept study" : "View case study"}
            <ArrowRight size={16} />
          </span>
        </div>
      </Link>
    </article>
  );
}
