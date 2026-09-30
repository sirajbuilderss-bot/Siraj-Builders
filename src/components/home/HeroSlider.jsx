import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import useContent from "../../hooks/useContent";
import { heroSlides, toSlideShape } from "../../services/content";
import { ArrowLeft, ArrowRight, Play, Pause } from "../ui/Icons";

/**
 * The original four slides, kept as the fallback. If Supabase has no
 * credentials, is unreachable, or the hero_slides table is empty, these
 * render exactly as they did before the site became database-driven — the
 * homepage hero is the last thing that should ever go blank.
 */
const STATIC_SLIDES = [
  {
    id: 0,
    eyebrow: "01 · Residential Construction",
    title: "Built with clarity. Managed with care.",
    lead: "A structured construction experience for homeowners who want clear planning, responsible execution and consistent communication — from the first conversation to the final handover.",
    image:
      "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=2400&q=88",
    primary: { to: "/consultation", label: "Discuss Your Project" },
    secondary: { to: "/projects", label: "View Our Projects" },
    titleTag: "h1",
  },
  {
    id: 1,
    eyebrow: "02 · Commercial Construction",
    title: "Spaces planned around how businesses work.",
    lead: "From functional planning to coordinated execution, keep commercial construction focused on the purpose of the finished space — movement, usability and durability.",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2400&q=88",
    primary: { to: "/commercial-construction", label: "Explore Commercial" },
    secondary: { to: "/consultation", label: "Start a Conversation" },
    titleTag: "h2",
  },
  {
    id: 2,
    eyebrow: "03 · Project Management",
    title: "Know what is happening. Know what comes next.",
    lead: "Professional project management brings decisions, people, materials and construction stages into a clearer route from plan to completion.",
    image:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=2400&q=88",
    primary: { to: "/project-management", label: "See Our Approach" },
    secondary: { to: "/faq", label: "Read FAQs" },
    titleTag: "h2",
  },
  {
    id: 3,
    eyebrow: "04 · Renovation & Remodelling",
    title: "Improve the space you already have.",
    lead: "Thoughtful renovation starts with understanding the existing property, then coordinating the changes that improve function, appearance and use.",
    image:
      "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=2400&q=88",
    primary: { to: "/renovation-remodelling", label: "Explore Renovation" },
    secondary: { to: "/consultation", label: "Discuss Your Project" },
    titleTag: "h2",
  },
];

const DURATION = 7000;

/** A horizontal drag beyond this many pixels counts as a swipe, not a tap. */
const SWIPE_THRESHOLD = 55;

async function loadSlides() {
  const rows = await heroSlides.listPublic();
  return rows.map(toSlideShape);
}

export default function HeroSlider() {
  const { data: SLIDES } = useContent(loadSlides, STATIC_SLIDES);
  const [index, setIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const regionRef = useRef(null);
  const touchRef = useRef(null);

  /* Respect the OS "reduce motion" setting. An unattended 7-second
     auto-advancing carousel is a WCAG 2.2.2 failure without a way to stop it,
     and is actively hostile to users with vestibular disorders. */
  const [reduceMotion, setReduceMotion] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const goTo = useCallback(
    (i) => {
      if (!SLIDES.length) return;
      setIndex((i + SLIDES.length) % SLIDES.length);
      setProgressKey((k) => k + 1);
    },
    [SLIDES.length]
  );

  /* If the slide list shrinks while the carousel is past the new end —
     an admin deactivating the slide currently showing — step back rather
     than rendering undefined. */
  useEffect(() => {
    if (index > SLIDES.length - 1) setIndex(0);
  }, [SLIDES.length, index]);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  const autoplay = !isPaused && !reduceMotion && SLIDES.length > 1;

  useEffect(() => {
    if (!autoplay) return undefined;
    timerRef.current = setTimeout(next, DURATION);
    return () => clearTimeout(timerRef.current);
  }, [autoplay, index, next, progressKey]);

  /* Pause on hover AND on keyboard focus — a keyboard user tabbing through
     slide links should not have the content change underneath them. */
  const pause = () => setIsPaused(true);
  const resume = () => {
    setIsPaused(false);
    setProgressKey((k) => k + 1);
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      prev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    }
  };

  /* Touch: on a phone the arrows are small targets at the bottom of a
     full-height hero, and a swipe is what people try first. Only the start
     and end points are recorded, so this never fights the browser's own
     vertical scrolling. */
  const onTouchStart = (event) => {
    const touch = event.changedTouches[0];
    touchRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (event) => {
    const start = touchRef.current;
    if (!start) return;
    touchRef.current = null;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    // Ignore anything that was mostly vertical — that was a scroll.
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) next();
    else prev();
  };

  const current = SLIDES[index];

  return (
    <section
      className="hero hero-slider"
      aria-label="Siraj Builders services"
      aria-roledescription="carousel"
      ref={regionRef}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={(e) => {
        if (!regionRef.current?.contains(e.relatedTarget)) resume();
      }}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="hero-slides">
        {SLIDES.map((slide, i) => {
          const active = i === index;
          const TitleTag = slide.titleTag;
          return (
            /* `aria-hidden` alone left the links inside inactive slides in
               the tab order — a keyboard user tabbed into invisible content
               with no way to see where focus had gone. `inert` removes them
               from focus and the accessibility tree together. */
            <article
              key={slide.id}
              className={"hero-slide" + (active ? " is-active" : "")}
              data-slide
              aria-hidden={!active}
              inert={!active}
              aria-roledescription="slide"
              aria-label={"Slide " + (i + 1) + " of " + SLIDES.length}
            >
              <div
                className="hero-bg"
                style={{ backgroundImage: "url('" + slide.image + "')" }}
              />
              {/* .container keeps the copy on the same left gutter as the
                  header logo and every section below. The inner .hero-copy
                  is what limits the measure — capping .container itself
                  would leave its margin-inline:auto centring the block in
                  the viewport, which pulled the hero text out of alignment
                  with the rest of the page on wide screens. */}
              <div className="container hero-content">
                <div className="hero-copy">
                  <span className="eyebrow">{slide.eyebrow}</span>
                  <TitleTag className="display">{slide.title}</TitleTag>
                  <p className="lead">{slide.lead}</p>
                  <div className="hero-actions">
                    <Link className="btn btn-primary" to={slide.primary.to}>
                      {slide.primary.label}
                      <span className="arrow">
                        <ArrowRight size={18} />
                      </span>
                    </Link>
                    <Link className="btn btn-outline" to={slide.secondary.to}>
                      {slide.secondary.label}
                      <span className="arrow">
                        <ArrowRight size={18} />
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Announces the slide change to a screen reader without moving focus.
          `polite` waits for the user to finish what they are doing. */}
      <p className="hero-live" aria-live="polite" aria-atomic="true">
        {current ? "Slide " + (index + 1) + " of " + SLIDES.length + ": " + current.title : ""}
      </p>

      <div className="hero-controls">
        <div className="container hero-controls-inner">
          <button
            className="hero-arrow"
            type="button"
            aria-label="Previous slide"
            title="Previous slide"
            onClick={prev}
          >
            <ArrowLeft size={20} />
          </button>

          {/* Centre cluster: the dots, the counter and the pause control
              travel together, so the pause button stays beside the thing it
              controls instead of drifting to the far edge on a wide screen. */}
          <div className="hero-controls-center">
            <div className="hero-dots" role="tablist" aria-label="Hero slides">
              {SLIDES.map((slide, i) => (
                <button
                  key={slide.id ?? i}
                  className={"hero-dot" + (i === index ? " is-active" : "")}
                  type="button"
                  role="tab"
                  aria-label={"Go to slide " + (i + 1)}
                  aria-selected={i === index}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>

            <span className="hero-count" aria-hidden="true">
              <b>{String(index + 1).padStart(2, "0")}</b>
              <i />
              {String(SLIDES.length).padStart(2, "0")}
            </span>

            <button
              className="hero-pause"
              type="button"
              aria-label={isPaused ? "Resume slideshow" : "Pause slideshow"}
              title={isPaused ? "Resume slideshow" : "Pause slideshow"}
              onClick={() => (isPaused ? resume() : pause())}
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          </div>

          <button
            className="hero-arrow"
            type="button"
            aria-label="Next slide"
            title="Next slide"
            onClick={next}
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {autoplay && (
        <div className="hero-progress" aria-hidden="true">
          <span key={progressKey} />
        </div>
      )}
    </section>
  );
}
