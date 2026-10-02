import { Link } from "react-router-dom";
import {
  Actions,
  Img,
  Paras,
  SectionHead,
  SectionShell,
  SectionFallback,
  pad2,
} from "./shared";
import { Chat, Check, Clock, Shield } from "../ui/Icons";
import HeroGraphic, { heroMotionVariant } from "./HeroGraphic";


/* ==========================================================================
 * PAGE HERO
 * The top banner on every inner page. Breadcrumb, H1, lead, actions, and an
 * optional trust line (subtitle). Image is a darkened background; with no
 * image the hero falls back to the brand gradient.
 * ======================================================================== */
export function HeroBlock({ section, pageLabel, headingTag = "h1", path = "/" }) {
  const image = section.media_url;
  const Heading = headingTag;
  const title = section.title || section.label || pageLabel || "More information";
  return (
    <section
      className={`sx-hero sx-hero--motion-${heroMotionVariant(path)}${image ? " has-image" : ""}`}
      id="s-hero"
      style={image ? { "--hero-image": `url("${image}")` } : undefined}
    >
      <div className="sx-hero-bg" aria-hidden="true" />
      <HeroGraphic variant={heroMotionVariant(path)} />
      <div className="container sx-hero-inner">
        <nav className="sx-crumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{pageLabel || section.eyebrow}</span>
        </nav>
        {section.eyebrow && <span className="eyebrow sx-hero-eyebrow">{section.eyebrow}</span>}
        <Heading className="sx-hero-title">{title}</Heading>
        <Paras text={section.body} className="sx-hero-lead" />
        <Actions section={section} dark />
        {section.subtitle && <p className="sx-hero-trust">{section.subtitle}</p>}
      </div>
    </section>
  );
}

/* ==========================================================================
 * INTRO — text beside an image
 * ======================================================================== */
export function IntroBlock({ section, flip = false }) {
  const hasImage = Boolean(section.media_url);
  if (!section.eyebrow && !section.title && !section.body && !section.items.length && !hasImage && !section.cta_label) {
    return <SectionFallback section={section} />;
  }
  return (
    <SectionShell section={section}>
      <div className={`sx-split${hasImage ? "" : " sx-split--solo"}${flip ? " is-flipped" : ""}`}>
        <div className="sx-split-text reveal">
          {section.eyebrow && <span className="eyebrow">{section.eyebrow}</span>}
          {section.title && <h2 className="h2">{section.title}</h2>}
          {section.subtitle && !section.video_url && <p className="sx-head-subtitle">{section.subtitle}</p>}
          <Paras text={section.body} />
          {section.items.length > 0 && <CheckList items={section.items} />}
          <Actions section={section} dark={section.settings?.theme === "dark"} />
        </div>
        {hasImage && (
          <Img
            className="sx-split-media reveal"
            src={section.media_url}
            alt={section.title || section.eyebrow || ""}
            ratio="4 / 3"
          />
        )}
      </div>
    </SectionShell>
  );
}

export function CheckList({ items, columns = 1 }) {
  return (
    <ul className={`sx-checklist${columns > 1 ? " sx-checklist--cols" : ""}`}>
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`}>
          <span className="sx-check" aria-hidden="true">
            <Check size={16} />
          </span>
          <span>
            <b>{item.title}</b>
            {item.body && <span className="sx-check-sub">{item.body}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ==========================================================================
 * CONTENT — heading, text, optional checklist / image.
 * layouts: split (default) | checklist | centered | prose
 * ======================================================================== */
export function ContentBlock({ section }) {
  const layout = section.settings?.layout || "split";
  const dark = section.settings?.theme === "dark";
  if (!section.eyebrow && !section.title && !section.subtitle && !section.body && !section.items.length && !section.media_url && !section.cta_label) {
    return <SectionFallback section={section} />;
  }

  if (layout === "centered" || layout === "prose") {
    return (
      <SectionShell section={section}>
        <div className={`sx-center${layout === "prose" ? " sx-prose" : ""} reveal`}>
          {section.eyebrow && <span className="eyebrow">{section.eyebrow}</span>}
          {section.title && <h2 className="h2">{section.title}</h2>}
          <Paras text={section.body} />
          {section.items.length > 0 && <CheckList items={section.items} />}
          {section.subtitle && <p className="sx-note">{section.subtitle}</p>}
          <Actions section={section} dark={dark} className="sx-actions--center" />
        </div>
      </SectionShell>
    );
  }

  const hasImage = Boolean(section.media_url);
  const manyItems = section.items.length > 5;
  return (
    <SectionShell section={section}>
      <div className={`sx-split${hasImage ? "" : " sx-split--wide"}`}>
        <div className="sx-split-text reveal">
          {section.eyebrow && <span className="eyebrow">{section.eyebrow}</span>}
          {section.title && <h2 className="h2">{section.title}</h2>}
          <Paras text={section.body} />
          {section.items.length > 0 && (
            <CheckList items={section.items} columns={!hasImage || manyItems ? 2 : 1} />
          )}
          {section.subtitle && <p className="sx-note">{section.subtitle}</p>}
          <Actions section={section} dark={dark} />
        </div>
        {hasImage && (
          <Img
            className="sx-split-media reveal"
            src={section.media_url}
            alt={section.title || ""}
            ratio="4 / 5"
          />
        )}
      </div>
    </SectionShell>
  );
}

/* ==========================================================================
 * VIDEO — a playable clip attached to any page by the section builder.
 * ======================================================================== */
export function VideoBlock({ section }) {
  if (!section.video_url) return null;
  return (
    <SectionShell section={section}>
      <SectionHead section={section} align="split" />
    </SectionShell>
  );
}

/* ==========================================================================
 * FEATURES — cards from `items`.
 * layouts: grid (default) | numbered | duo
 * With an image, the cards sit beside it.
 * ======================================================================== */
export function FeaturesBlock({ section }) {
  const layout = section.settings?.layout || "grid";
  const items = section.items;
  const hasImage = Boolean(section.media_url) && layout === "grid";
  if (!items.length) return <SectionFallback section={section} />;

  const cards = (
    <div
      className={`sx-cards sx-cards--${layout}${hasImage ? " sx-cards--beside" : ""}`}
      data-count={items.length}
    >
      {items.map((item, index) => (
        <article className="sx-card reveal" key={`${item.title}-${index}`} style={{ "--d": `${Math.min(index, 6) * 0.06}s` }}>
          {item.image && <Img src={item.image} alt={item.title} ratio="16 / 10" className="sx-card-img" />}
          <span className="sx-card-num" aria-hidden="true">{pad2(index + 1)}</span>
          <h3>{item.title}</h3>
          {item.body && <p>{item.body}</p>}
        </article>
      ))}
    </div>
  );

  return (
    <SectionShell section={section}>
      <SectionHead
        section={section}
        actions={<Actions section={section} dark={section.settings?.theme === "dark"} />}
      />
      {hasImage ? (
        <div className="sx-features-split">
          <Img className="sx-features-media reveal" src={section.media_url} alt="" ratio="4 / 5" />
          {cards}
        </div>
      ) : (
        cards
      )}
    </SectionShell>
  );
}

/* ==========================================================================
 * TRUST STRIP — four short promises under the homepage hero
 * ======================================================================== */
const TRUST_ICONS = [Check, Shield, Chat, Clock];

export function TrustBlock({ section }) {
  if (!section.items.length) return null;
  return (
    <section className="sx-trust" id="s-trust" aria-label="How we work">
      <div className="container">
        <ul className="sx-trust-card reveal">
          {section.items.map((item, index) => {
            const Icon = TRUST_ICONS[index % TRUST_ICONS.length];
            return (
              <li className="sx-trust-item" key={`${item.title}-${index}`}>
                <span className="sx-trust-icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <span>
                  <b>{item.title}</b>
                  {item.body && <span>{item.body}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ==========================================================================
 * PROCESS — numbered stages.
 * layouts: row (default, cards) | timeline (vertical, for /our-process)
 * ======================================================================== */
export function ProcessBlock({ section }) {
  const timeline = section.settings?.layout === "timeline";
  if (!section.items.length) return null;
  return (
    <SectionShell section={section}>
      <SectionHead
        section={section}
        actions={<Actions section={section} dark={section.settings?.theme === "dark"} />}
      />
      <ol className={timeline ? "sx-timeline" : "sx-steps"} data-count={section.items.length}>
        {section.items.map((item, index) => (
          <li className="sx-step reveal" key={`${item.title}-${index}`} style={{ "--d": `${Math.min(index, 7) * 0.05}s` }}>
            <span className="sx-step-num" aria-hidden="true">{pad2(index + 1)}</span>
            <div className="sx-step-body">
              <h3>{item.title}</h3>
              {item.body && <p>{item.body}</p>}
            </div>
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}

/* ==========================================================================
 * CALL TO ACTION BANNER
 * ======================================================================== */
export function CtaBlock({ section }) {
  if (!section.eyebrow && !section.title && !section.body && !section.cta_label) {
    return <SectionFallback section={section} />;
  }
  return (
    <section className={`sx-cta sx-cta--${section.settings?.theme || "dark"}`} id={`s-${section.key}`}>
      <div className="container">
        <div className="sx-cta-inner reveal">
          <div className="sx-cta-copy">
            {section.eyebrow && <span className="eyebrow">{section.eyebrow}</span>}
            {section.title && <h2 className="h2">{section.title}</h2>}
            <Paras text={section.body} />
          </div>
          <Actions section={section} dark={section.settings?.theme !== "light"} className="sx-cta-actions" />
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
 * GALLERY — images listed in `items` (image field), optional captions
 * ======================================================================== */
export function GalleryBlock({ section }) {
  const items = section.items.filter((item) => item.image || item.title || item.body);
  const hasHeading = section.eyebrow || section.title || section.subtitle || section.body;
  if (!items.length && !section.media_url && !hasHeading) return <SectionFallback section={section} />;
  return (
    <SectionShell section={section}>
      <SectionHead section={section} />
      {section.media_url && (
        <Img
          className="sx-gallery-featured reveal"
          src={section.media_url}
          alt={section.title || section.eyebrow || ""}
          ratio="16 / 9"
        />
      )}
      {items.length > 0 && (
        <div className="sx-gallery">
          {items.map((item, index) => (
            <figure className="sx-gallery-item reveal" key={`${item.image || item.title}-${index}`}>
              {item.image ? (
                <>
                  <Img src={item.image} alt={item.title || item.body || ""} ratio="4 / 3" />
                  {(item.title || item.body) && <figcaption>{item.title || item.body}</figcaption>}
                </>
              ) : (
                <div className="sx-gallery-placeholder">
                  {item.title && <h3>{item.title}</h3>}
                  {item.body && <p>{item.body}</p>}
                </div>
              )}
            </figure>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
