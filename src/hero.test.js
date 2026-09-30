/* eslint-disable testing-library/no-container, testing-library/no-node-access */
/**
 * HOMEPAGE HERO
 * ============================================================================
 * The hero's controls used to be the characters → ← ▶ ❙❙ inside spans. They
 * are SVG icons now, and the first test below is the one that matters: it
 * fails if a text arrow glyph ever comes back.
 *
 * Supabase credentials are absent here, so useContent serves the four static
 * fallback slides — which is also the state the live site falls back to if
 * the database is unreachable, and therefore worth testing directly.
 *
 * Run: npm test
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import HeroSlider from "./components/home/HeroSlider";

/** Arrow and transport characters that must never be rendered as text. */
const GLYPHS = /[\u2190\u2192\u2191\u2193\u25B6\u25C0\u2759\u23F8]/;

function renderHero() {
  return render(
    <MemoryRouter>
      <HeroSlider />
    </MemoryRouter>
  );
}

describe("hero controls", () => {
  test("no arrow is rendered as a text character", () => {
    const { container } = renderHero();
    expect(GLYPHS.test(container.textContent)).toBe(false);
  });

  test("the arrows and pause button are drawn as inline SVG", () => {
    const { container } = renderHero();

    const prev = screen.getByRole("button", { name: /previous slide/i });
    const next = screen.getByRole("button", { name: /next slide/i });
    const pause = screen.getByRole("button", { name: /pause slideshow/i });

    [prev, next, pause].forEach((button) => {
      expect(button.querySelector("svg")).toBeInTheDocument();
    });
  });

  test("decorative icons are hidden from assistive technology", () => {
    const { container } = renderHero();
    container.querySelectorAll("svg").forEach((svg) => {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });

  test("the call-to-action arrows sit inside the slide's buttons", () => {
    const { container } = renderHero();
    const arrow = container.querySelector(".hero-actions .arrow svg");
    expect(arrow).toBeInTheDocument();
  });

  test("the slide count is announced politely, not by moving focus", () => {
    const { container } = renderHero();
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).toBeInTheDocument();
    expect(live.textContent).toMatch(/Slide 1 of 4/);
  });

  test("the next arrow advances the carousel", async () => {
    const user = userEvent.setup();
    const { container } = renderHero();

    await user.click(screen.getByRole("button", { name: /next slide/i }));

    const live = container.querySelector('[aria-live="polite"]');
    expect(live.textContent).toMatch(/Slide 2 of 4/);
  });

  test("the previous arrow wraps around to the last slide", async () => {
    const user = userEvent.setup();
    const { container } = renderHero();

    await user.click(screen.getByRole("button", { name: /previous slide/i }));

    const live = container.querySelector('[aria-live="polite"]');
    expect(live.textContent).toMatch(/Slide 4 of 4/);
  });

  test("a dot jumps straight to its slide", async () => {
    const user = userEvent.setup();
    const { container } = renderHero();

    await user.click(screen.getByRole("tab", { name: /go to slide 3/i }));

    const live = container.querySelector('[aria-live="polite"]');
    expect(live.textContent).toMatch(/Slide 3 of 4/);
  });

  test("the pause button toggles its own label", async () => {
    const user = userEvent.setup();
    renderHero();

    await user.click(screen.getByRole("button", { name: /pause slideshow/i }));
    expect(screen.getByRole("button", { name: /resume slideshow/i })).toBeInTheDocument();
  });

  test("only the active slide is reachable by keyboard", () => {
    const { container } = renderHero();
    const slides = container.querySelectorAll(".hero-slide");

    expect(slides).toHaveLength(4);
    expect(slides[0].className).toContain("is-active");
    // Inactive slides are inert, so the links inside them are out of the tab
    // order — otherwise a keyboard user tabs into content they cannot see.
    expect(slides[1]).toHaveAttribute("aria-hidden", "true");
  });

  test("the first slide's heading is the page's h1", () => {
    const { container } = renderHero();
    const active = container.querySelector(".hero-slide.is-active");
    expect(within(active).getByRole("heading", { level: 1 })).toBeInTheDocument();
  });
});
