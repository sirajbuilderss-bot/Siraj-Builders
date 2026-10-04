import { useEffect, useRef } from "react";

/** A small, softly glowing cursor for mouse and trackpad users. */
export default function CustomCursor() {
  const dotRef = useRef(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches) return undefined;

    const dot = dotRef.current;
    const root = document.documentElement;
    let x = -100;
    let y = -100;
    let targetX = x;
    let targetY = y;
    let frame;

    root.classList.add("custom-cursor-enabled");

    const move = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      dot.classList.add("is-visible");
    };
    const animate = () => {
      x += (targetX - x) * 0.24;
      y += (targetY - y) * 0.24;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      frame = window.requestAnimationFrame(animate);
    };
    const leave = () => dot.classList.remove("is-visible");
    const enter = () => dot.classList.add("is-visible");
    const down = () => dot.classList.add("is-pressed");
    const up = () => dot.classList.remove("is-pressed");
    const hover = (event) => {
      if (event.target.closest("a, button, [role='button'], input, select, textarea, label")) {
        dot.classList.add("is-interactive");
      } else {
        dot.classList.remove("is-interactive");
      }
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerenter", enter, { passive: true });
    window.addEventListener("pointerleave", leave, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("pointermove", hover, { passive: true });
    frame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerenter", enter);
      window.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointermove", hover);
      root.classList.remove("custom-cursor-enabled");
    };
  }, []);

  return <span ref={dotRef} className="custom-cursor-dot" aria-hidden="true" />;
}
