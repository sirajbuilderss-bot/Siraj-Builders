import { useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "../ui/Icons";
import "../../styles/faq.css";

/**
 * ACCORDION
 * One open at a time. Each question is a real <button> with aria-expanded
 * and aria-controls; the answer region animates its height with the CSS
 * grid-rows technique, so there is no measuring and no layout jump.
 */
export function FaqAccordion({ items, className = "", defaultOpen = -1 }) {
  const base = useId();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`fq-acc ${className}`.trim()}>
      {items.map((item, index) => {
        const isOpen = open === index;
        const qid = `${base}-q${index}`;
        const aid = `${base}-a${index}`;
        return (
          <div className={`fq-item${isOpen ? " is-open" : ""}`} key={item.id || item.q}>
            <h3 className="fq-q-wrap">
              <button
                type="button"
                id={qid}
                className="fq-q"
                aria-expanded={isOpen}
                aria-controls={aid}
                onClick={() => setOpen(isOpen ? -1 : index)}
              >
                <span>{item.q}</span>
                <span className="fq-icon" aria-hidden="true">
                  <Plus size={18} />
                </span>
              </button>
            </h3>
            <div className="fq-a" id={aid} role="region" aria-labelledby={qid}>
              <div className="fq-a-inner">
                <p>{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * FULL FAQ BROWSER — category chips, search, grouped accordions.
 * Only answered (published) questions reach this component; unanswered
 * [TO CONFIRM] questions stay unpublished in the admin panel.
 */
export default function FaqBrowser({ groups }) {
  const [active, setActive] = useState("all");
  const [term, setTerm] = useState("");

  const total = groups.reduce((sum, g) => sum + g.items.length, 0);
  const visibleGroups = useMemo(() => {
    const t = term.trim().toLowerCase();
    return groups
      .filter((g) => active === "all" || g.key === active)
      .map((g) => ({
        ...g,
        items: t ? g.items.filter((i) => `${i.q} ${i.a}`.toLowerCase().includes(t)) : g.items,
      }))
      .filter((g) => g.items.length);
  }, [groups, active, term]);
  const shown = visibleGroups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="fq-browser">
      <div className="fq-toolbar reveal">
        <div className="fq-chips" role="group" aria-label="Filter questions by topic">
          {[{ key: "all", label: "All topics", items: { length: total } }, ...groups].map((g) => (
            <button
              type="button"
              key={g.key}
              className={active === g.key ? "is-active" : ""}
              aria-pressed={active === g.key}
              onClick={() => setActive(g.key)}
            >
              {g.label}
              <span>{g.items.length}</span>
            </button>
          ))}
        </div>
        <label className="fq-search">
          <span className="sr-only">Search questions</span>
          <input
            type="search"
            value={term}
            placeholder="Search questions…"
            onChange={(event) => setTerm(event.target.value)}
          />
        </label>
      </div>

      <p className="fq-status" aria-live="polite">
        {term ? `${shown} of ${total} questions match “${term.trim()}”` : `${shown} questions`}
      </p>

      {visibleGroups.length ? (
        <div className="fq-groups">
          {visibleGroups.map((group) => (
            <section className="fq-group reveal" key={group.key} aria-labelledby={`fq-g-${group.key}`}>
              <h2 className="fq-group-title" id={`fq-g-${group.key}`}>
                {group.label}
              </h2>
              <FaqAccordion items={group.items} />
            </section>
          ))}
        </div>
      ) : (
        <div className="fq-empty">
          <p>No questions match your search.</p>
          <p>
            Ask us directly — <Link to="/contact-us">contact Siraj Builders</Link>.
          </p>
        </div>
      )}
    </div>
  );
}
