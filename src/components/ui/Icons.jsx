/**
 * PUBLIC SITE ICONS
 * ============================================================================
 * Inline SVG, drawn on a 24×24 grid with a 1.75 stroke and `currentColor`.
 *
 * WHY THESE EXIST
 * ---------------
 * The site previously used the literal characters → ← ▶ ❙❙ inside spans. Those
 * are typographic characters, not icons, and they behave like text:
 *
 *   · they fall back to whatever glyph the user's font happens to ship, so the
 *     arrow was a different weight and a different optical size on Windows,
 *     macOS, Android and Linux — and ❙❙ (two BOX DRAWINGS characters standing
 *     in for a pause symbol) is missing outright in several common fonts,
 *     where it rendered as two tofu boxes inside the hero;
 *   · they sit on the text baseline, so they never optically centred inside a
 *     round 52px button no matter what line-height was applied;
 *   · screen readers announce them ("rightwards arrow", "black right-pointing
 *     triangle") in the middle of a button label.
 *
 * An SVG has none of those problems: it is the same shape everywhere, it is
 * centred by the flex container that holds it, and `aria-hidden` keeps it out
 * of the accessibility tree so the button's own label is what is announced.
 *
 * Every icon inherits colour from the parent, so hover and focus states are
 * still handled entirely in CSS.
 */

function Svg({ children, size = 20, className = "", ...rest }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Long, flat arrow — reads as "continue" rather than as a chevron. */
export function ArrowRight(props) {
  return (
    <Svg {...props}>
      <path d="M4 12h15" />
      <path d="M13 6l6 6-6 6" />
    </Svg>
  );
}

export function ArrowLeft(props) {
  return (
    <Svg {...props}>
      <path d="M20 12H5" />
      <path d="M11 18l-6-6 6-6" />
    </Svg>
  );
}

/** Solid shapes: a transport control should read at a glance, not as line art. */
export function Play(props) {
  return (
    <Svg {...props} strokeWidth="1.4">
      <path d="M8 5.2v13.6a.6.6 0 0 0 .92.5l10.6-6.8a.6.6 0 0 0 0-1l-10.6-6.8A.6.6 0 0 0 8 5.2Z" fill="currentColor" />
    </Svg>
  );
}

export function Pause(props) {
  return (
    <Svg {...props} strokeWidth="1.4">
      <rect x="7" y="5" width="3.6" height="14" rx="1.1" fill="currentColor" />
      <rect x="13.4" y="5" width="3.6" height="14" rx="1.1" fill="currentColor" />
    </Svg>
  );
}

const Icons = { ArrowRight, ArrowLeft, Play, Pause };
export default Icons;
