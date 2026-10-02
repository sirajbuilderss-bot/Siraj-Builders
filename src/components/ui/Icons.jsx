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

export function ArrowUp(props) {
  return (
    <Svg {...props}>
      <path d="M12 20V5" />
      <path d="m6 11 6-6 6 6" />
    </Svg>
  );
}

export function ArrowDown(props) {
  return (
    <Svg {...props}>
      <path d="M12 4v15" />
      <path d="m18 13-6 6-6-6" />
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

export function Check(props) {
  return (
    <Svg {...props}>
      <path d="M5 12.5l4.2 4.2L19 7" />
    </Svg>
  );
}

export function Plus(props) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function Close(props) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function MapPin(props) {
  return (
    <Svg {...props}>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </Svg>
  );
}

export function Phone(props) {
  return (
    <Svg {...props}>
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </Svg>
  );
}

export function Mail(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </Svg>
  );
}

export function Clock(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  );
}

export function Chat(props) {
  return (
    <Svg {...props}>
      <path d="M21 11.5a8.4 8.4 0 0 1-12.2 7.5L3 21l2-5.8A8.5 8.5 0 1 1 21 11.5z" />
    </Svg>
  );
}

export function Calendar(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </Svg>
  );
}

export function Ruler(props) {
  return (
    <Svg {...props}>
      <path d="M3 17L17 3l4 4L7 21z" />
      <path d="M7 13l2 2M10 10l2 2M13 7l2 2" />
    </Svg>
  );
}

export function Layers(props) {
  return (
    <Svg {...props}>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
    </Svg>
  );
}

export function Shield(props) {
  return (
    <Svg {...props}>
      <path d="M12 21s8-4 8-10V5l-8-3-8 3v6c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </Svg>
  );
}

const Icons = { ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Play, Pause };
export default Icons;
