import { useEffect } from "react";

/**
 * SCROLL REVEAL
 * ----------------------------------------------------------------------------
 * Adds `is-visible` / `in-view` to every `.reveal` element as it scrolls into
 * view.
 *
 * The previous version only looked for `.reveal` elements once, when the page
 * first mounted. Anything that arrived later — a database-driven section, a
 * project grid, testimonials — kept `opacity: 0` forever. A MutationObserver
 * now picks up elements added after mount, so dynamic content animates in the
 * same way as static content.
 *
 * Reduced motion and browsers without IntersectionObserver get everything
 * visible immediately.
 */
export default function useReveal() {
  useEffect(() => {
    const show = (el) => el.classList.add("in-view", "is-visible");
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || !("IntersectionObserver" in window)) {
      const showAll = () => document.querySelectorAll(".reveal").forEach(show);
      showAll();
      if (!("MutationObserver" in window)) return undefined;
      const mo = new MutationObserver(showAll);
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            show(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    const watched = new WeakSet();
    const scan = () => {
      document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => {
        if (watched.has(el)) return;
        watched.add(el);
        io.observe(el);
      });
    };
    scan();

    let frame = 0;
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(frame);
      mo.disconnect();
      io.disconnect();
    };
  }, []);
}
