/**
 * ADMIN ICONS
 * ============================================================================
 * Inline SVG on a 24×24 grid, 1.7 stroke, `currentColor`.
 *
 * Deliberately not an icon library. lucide-react is ~2 kB per icon plus the
 * package, and this panel needs fourteen shapes that never change — a file of
 * paths costs nothing to install, nothing to keep in version lockstep, and
 * cannot break the build when a dependency ships a major version.
 *
 * Every icon is `aria-hidden`: the label beside it in the sidebar is the
 * accessible name, and announcing both would read the item twice.
 */

function Svg({ children, size = 18, className = "", strokeWidth = 1.7 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/* ---------------------------------------------------------------- sections */

export const IconDashboard = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7.5" height="8.5" rx="1.6" />
    <rect x="13.5" y="3" width="7.5" height="5.5" rx="1.6" />
    <rect x="13.5" y="11.5" width="7.5" height="9.5" rx="1.6" />
    <rect x="3" y="14.5" width="7.5" height="6.5" rx="1.6" />
  </Svg>
);

export const IconInbox = (p) => (
  <Svg {...p}>
    <path d="M3 13.5V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6.5" />
    <path d="M3 13.5h4.6l1.3 2.4h6.2l1.3-2.4H21v3.7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
  </Svg>
);

export const IconLayers = (p) => (
  <Svg {...p}>
    <path d="M12 3.2 3.3 7.6a.4.4 0 0 0 0 .7L12 12.8l8.7-4.5a.4.4 0 0 0 0-.7Z" />
    <path d="m4.2 12.4-.9.5a.4.4 0 0 0 0 .7l8.7 4.5 8.7-4.5a.4.4 0 0 0 0-.7l-.9-.5" />
    <path d="m4.2 16.8-.9.5a.4.4 0 0 0 0 .7l8.7 4.5 8.7-4.5a.4.4 0 0 0 0-.7l-.9-.5" />
  </Svg>
);

export const IconBriefcase = (p) => (
  <Svg {...p}>
    <rect x="2.6" y="7" width="18.8" height="13" rx="2.2" />
    <path d="M8.5 7V5.4A1.4 1.4 0 0 1 9.9 4h4.2a1.4 1.4 0 0 1 1.4 1.4V7" />
    <path d="M2.6 12.4h18.8" />
    <path d="M10.4 12.4h3.2" />
  </Svg>
);

export const IconTools = (p) => (
  <Svg {...p}>
    <path d="M14.4 6.2a3.9 3.9 0 0 1 5.3-3.6l-2.9 2.9 2.5 2.5 2.9-2.9a3.9 3.9 0 0 1-5.1 5.2L5.9 21a2 2 0 0 1-2.8-2.8L14.2 7.1a3.9 3.9 0 0 1 .2-.9Z" />
  </Svg>
);

export const IconFile = (p) => (
  <Svg {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
    <path d="M14 3v4.2a.8.8 0 0 0 .8.8H19" />
    <path d="M8.8 13h6.4M8.8 16.6h4.4" />
  </Svg>
);

export const IconHelp = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.2-2.5 3.8" />
    <path d="M12 17.2h.01" />
  </Svg>
);

export const IconQuote = (p) => (
  <Svg {...p}>
    <path d="M9.6 6.4C6.9 7.6 5.4 9.9 5.4 12.8c0 2.4 1.3 4 3.3 4s3.2-1.3 3.2-3.2-1.3-3.1-3-3.1h-.5c.2-1.2 1-2.2 2.3-2.9Z" />
    <path d="M18.6 6.4c-2.7 1.2-4.2 3.5-4.2 6.4 0 2.4 1.3 4 3.3 4s3.2-1.3 3.2-3.2-1.3-3.1-3-3.1h-.5c.2-1.2 1-2.2 2.3-2.9Z" />
  </Svg>
);

export const IconUsers = (p) => (
  <Svg {...p}>
    <circle cx="9.2" cy="8.4" r="3.4" />
    <path d="M2.8 20a6.4 6.4 0 0 1 12.8 0" />
    <path d="M16.4 5.4a3.4 3.4 0 0 1 0 6.6" />
    <path d="M18 14.6a6.4 6.4 0 0 1 3.2 5.4" />
  </Svg>
);

export const IconSlides = (p) => (
  <Svg {...p}>
    <rect x="2.6" y="5" width="18.8" height="12.2" rx="2.2" />
    <path d="m5.6 14.4 3.1-3.1a1.4 1.4 0 0 1 2 0l2.5 2.5" />
    <path d="m14.3 13.1 1.2-1.2a1.4 1.4 0 0 1 2 0l1.9 1.9" />
    <circle cx="9" cy="9" r="1.1" />
    <path d="M8 20.4h8" />
  </Svg>
);

export const IconChart = (p) => (
  <Svg {...p}>
    <path d="M4 20V4" />
    <path d="M4 20h16" />
    <rect x="7.4" y="12" width="3" height="5" rx="1" />
    <rect x="12.4" y="8.2" width="3" height="8.8" rx="1" />
    <rect x="17.4" y="10" width="3" height="7" rx="1" />
  </Svg>
);

export const IconSettings = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.1" />
    <path d="M19.5 14.3a1.5 1.5 0 0 0 .3 1.7l.1.1a1.8 1.8 0 1 1-2.6 2.6l-.1-.1a1.5 1.5 0 0 0-1.7-.3 1.5 1.5 0 0 0-.9 1.4v.2a1.8 1.8 0 1 1-3.6 0v-.1a1.5 1.5 0 0 0-1-1.4 1.5 1.5 0 0 0-1.7.3l-.1.1a1.8 1.8 0 1 1-2.6-2.6l.1-.1a1.5 1.5 0 0 0 .3-1.7 1.5 1.5 0 0 0-1.4-.9h-.2a1.8 1.8 0 1 1 0-3.6h.1a1.5 1.5 0 0 0 1.4-1 1.5 1.5 0 0 0-.3-1.7l-.1-.1a1.8 1.8 0 1 1 2.6-2.6l.1.1a1.5 1.5 0 0 0 1.7.3h.1a1.5 1.5 0 0 0 .9-1.4v-.2a1.8 1.8 0 1 1 3.6 0v.1a1.5 1.5 0 0 0 .9 1.4 1.5 1.5 0 0 0 1.7-.3l.1-.1a1.8 1.8 0 1 1 2.6 2.6l-.1.1a1.5 1.5 0 0 0-.3 1.7v.1a1.5 1.5 0 0 0 1.4.9h.2a1.8 1.8 0 1 1 0 3.6h-.1a1.5 1.5 0 0 0-1.4.9Z" />
  </Svg>
);

export const IconShield = (p) => (
  <Svg {...p}>
    <path d="M12 21.4s7.4-3.4 7.4-9.1V5.9L12 2.8 4.6 5.9v6.4c0 5.7 7.4 9.1 7.4 9.1Z" />
    <path d="m9.1 11.8 2 2 3.8-3.8" />
  </Svg>
);

export const IconHome = (p) => (
  <Svg {...p}>
    <path d="M3.4 10.6 12 3.6l8.6 7" />
    <path d="M5.4 9.3V19a1.4 1.4 0 0 0 1.4 1.4h10.4A1.4 1.4 0 0 0 18.6 19V9.3" />
    <path d="M9.8 20.4v-5.2h4.4v5.2" />
  </Svg>
);

/* ------------------------------------------------------------------ chrome */

export const IconChevron = (p) => (
  <Svg {...p} strokeWidth={2}>
    <path d="m9 5 7 7-7 7" />
  </Svg>
);

export const IconExternal = (p) => (
  <Svg {...p}>
    <path d="M14 4h6v6" />
    <path d="M20 4 11.2 12.8" />
    <path d="M18.4 14v4.6A1.4 1.4 0 0 1 17 20H5.4A1.4 1.4 0 0 1 4 18.6V7A1.4 1.4 0 0 1 5.4 5.6H10" />
  </Svg>
);

export const IconSearch = (p) => (
  <Svg {...p}>
    <circle cx="10.8" cy="10.8" r="6.4" />
    <path d="m15.6 15.6 4 4" />
  </Svg>
);

export const IconDot = (p) => (
  <Svg {...p} strokeWidth={0}>
    <circle cx="12" cy="12" r="4" fill="currentColor" />
  </Svg>
);

export const IconClose = (p) => (
  <Svg {...p} strokeWidth={2}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
);

export const IconCheck = (p) => (
  <Svg {...p}>
    <path d="m5 12.5 4.2 4.2L19 7" />
  </Svg>
);

export const IconTrash = (p) => (
  <Svg {...p}>
    <path d="M4 6h16M9 6V4h6v2m3 0-.8 14H6.8L6 6" />
    <path d="M10 10v6m4-6v6" />
  </Svg>
);

/* ------------------------------------------------------------------ mapping */

/**
 * Section-type → icon, used by the sidebar's section list so a hero, an FAQ
 * block and a statistics band are distinguishable at a glance without reading
 * every label. Falls back to a dot, which is honest about saying nothing.
 */
const SECTION_TYPE_ICONS = {
  hero: IconSlides,
  intro: IconFile,
  content: IconFile,
  services: IconTools,
  projects: IconBriefcase,
  testimonials: IconQuote,
  faq: IconHelp,
  stats: IconChart,
  process: IconLayers,
  team: IconUsers,
  cta: IconExternal,
  gallery: IconSlides,
  contact: IconInbox,
  custom: IconDot,
};

export function sectionTypeIcon(type) {
  return SECTION_TYPE_ICONS[type] || IconDot;
}

const icons = {
  IconDashboard,
  IconInbox,
  IconLayers,
  IconBriefcase,
  IconTools,
  IconFile,
  IconHelp,
  IconQuote,
  IconUsers,
  IconSlides,
  IconChart,
  IconSettings,
  IconShield,
  IconHome,
  IconChevron,
  IconExternal,
  IconSearch,
  IconDot,
  IconClose,
  IconCheck,
  IconTrash,
  sectionTypeIcon,
};

export default icons;
