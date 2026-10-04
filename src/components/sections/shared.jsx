import { Link } from "react-router-dom";
import { ArrowRight } from "../ui/Icons";
import { toEmbed } from "../../lib/video";

/** True for links that should leave the single-page app. */
export function isExternal(href) {
  return /^(https?:|mailto:|tel:|\/\/)/i.test(String(href || ""));
}

/** Internal paths use the router; everything else is a normal anchor. */
export function SmartLink({ to, children, ...rest }) {
  if (!to) return <span {...rest}>{children}</span>;
  if (isExternal(to)) {
    const newTab = /^https?:|^\/\//i.test(to);
    return (
      <a href={to} {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} {...rest}>
      {children}
    </Link>
  );
}

/** Button with the site's arrow treatment. Renders nothing without a label. */
export function Btn({ to, label, variant = "primary", className = "" }) {
  if (!label || !to) return null;
  return (
    <SmartLink to={to} className={`btn btn-${variant} ${className}`.trim()}>
      {label}
      <span className="arrow">
        <ArrowRight size={18} />
      </span>
    </SmartLink>
  );
}

/** Primary + secondary call to action from a section row. */
export function Actions({ section, dark = false, className = "" }) {
  const second = section.settings?.cta2_label && section.settings?.cta2_href;
  if (!section.cta_label && !second) return null;
  return (
    <div className={`sx-actions ${className}`.trim()}>
      <Btn to={section.cta_href} label={section.cta_label} variant={dark ? "light" : "primary"} />
      {second && (
        <Btn
          to={section.settings.cta2_href}
          label={section.settings.cta2_label}
          variant={dark ? "outline-light" : "ghost"}
        />
      )}
    </div>
  );
}

/** Body text: blank lines become paragraphs. */
export function Paras({ text, className = "sx-body" }) {
  const parts = String(text || "")
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return null;
  return (
    <div className={className}>
      {parts.map((part, index) => (
        <p key={index}>
          {part.split("\n").map((line, i, all) => (
            <span key={i}>
              {line}
              {i < all.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

/** Eyebrow + heading + optional intro, used at the top of most blocks. */
export function SectionHead({ section, align = "split", actions = null, as: Tag = "h2" }) {
  const { eyebrow, title, subtitle, body } = section;
  if (!eyebrow && !title && !subtitle && !body && !actions) return null;
  return (
    <div className={`sx-head sx-head--${align}`}>
      <div className="sx-head-main reveal">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        {title && <Tag className="h2">{title}</Tag>}
        {subtitle && !section.video_url && <p className="sx-head-subtitle">{subtitle}</p>}
      </div>
      {(body || actions) && (
        <div className="sx-head-side reveal" style={{ "--d": "0.1s" }}>
          <Paras text={body} className="sx-body sx-body--muted" />
          {actions}
        </div>
      )}
    </div>
  );
}

/** Render the optional video field shared by the section builder. */
export function SectionVideo({ section }) {
  if (!section.video_url) return null;
  const video = toEmbed(section.video_url);
  return (
    <div className="sx-video-wrap reveal">
      <div className="sx-video-frame">
        {video?.kind === "iframe" ? (
          <iframe
            src={video.src}
            title={section.title || section.label || "Related video"}
            loading="lazy"
            allow="autoplay; accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : video?.kind === "file" ? (
          <video src={video.src} controls autoPlay muted loop preload="none" playsInline aria-label={section.title || "Related video"} />
        ) : (
          <a className="sx-video-external" href={section.video_url} target="_blank" rel="noopener noreferrer">
            <span className="sx-video-play" aria-hidden="true">▶</span>
            <span>Watch the related video <ArrowRight size={16} /></span>
          </a>
        )}
      </div>
      {section.subtitle && <p className="sx-video-caption">{section.subtitle}</p>}
    </div>
  );
}

/** Outer wrapper: background theme + consistent vertical rhythm. */
export function SectionShell({ section, className = "", children, inner = "container" }) {
  const theme = section.settings?.theme || "white";
  return (
    <section
      className={`sx sx--${theme} sx-${section.type} ${className}`.trim()}
      id={section.key ? `s-${section.key}` : undefined}
      data-theme={theme}
    >
      {inner ? (
        <div className={inner}>
          {children}
          <SectionVideo section={section} />
        </div>
      ) : <>{children}<SectionVideo section={section} /></>}
    </section>
  );
}

/** Give a live section a deliberate appearance while its list content is empty. */
export function SectionFallback({ section }) {
  if (!section.isCustom) return null;
  const title = section.title || section.label || section.eyebrow || "More information";
  const description = section.body || section.subtitle;
  if (!section.eyebrow && !section.title && !description) return null;
  return (
    <SectionShell section={section}>
      <div className="sx-empty-state reveal">
        {section.eyebrow && <span className="eyebrow">{section.eyebrow}</span>}
        <h2 className="h2">{title}</h2>
        <Paras text={description} />
      </div>
    </SectionShell>
  );
}

/** Lazy, size-reserving image that never stretches. */
export function Img({ src, alt = "", className = "", ratio, eager = false, sizes }) {
  if (!src) return null;
  return (
    <div className={`sx-img ${className}`.trim()} style={ratio ? { aspectRatio: ratio } : undefined}>
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        sizes={sizes}
        onError={(event) => {
          event.currentTarget.parentElement?.classList.add("is-broken");
        }}
      />
    </div>
  );
}

export const pad2 = (n) => String(n).padStart(2, "0");
