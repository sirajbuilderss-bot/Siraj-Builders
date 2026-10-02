import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useSiteMap } from "../SiteMapContext";
import { sectionTypeOf } from "../../services/sections";
import {
  IconBriefcase,
  IconChart,
  IconChevron,
  IconDashboard,
  IconFile,
  IconHelp,
  IconInbox,
  IconLayers,
  IconQuote,
  IconSearch,
  IconSettings,
  IconShield,
  IconSlides,
  IconTools,
  IconUsers,
  sectionTypeIcon,
} from "./icons";

/**
 * ADMIN SIDEBAR
 * ============================================================================
 * The navigation, and — under "Pages" — a two-level tree of the whole website:
 *
 *     Pages  ▾
 *       Home  ▸
 *         Hero Section
 *         Introduction
 *         Services Section
 *       About ▸
 *       …
 *
 * WHY A TREE AND NOT JUST A LINK
 * ------------------------------
 * The old sidebar sent every content change through a single "Page builder"
 * link, which opened a screen where the admin then had to find their page in
 * a rail and their section in a list. That is three separate acts of hunting
 * before any editing starts, and the sidebar gave no clue that the sections
 * were even there.
 *
 * Here the route to a specific piece of copy is visible from the navigation
 * itself: expand Pages, expand the page, click the section. Each section link
 * carries `?page=…&section=…`, which PageBuilderPage reads and opens the
 * editor for directly — one click from sidebar to form.
 *
 * HOVER
 * -----
 * On a device with a real pointer, hovering a row opens it after a short
 * delay, so the tree can be explored without clicking. Nothing auto-collapses
 * on mouse-out: a branch that folds itself away while the cursor travels down
 * to it is the classic reason hover menus are hated. Collapsing is always a
 * deliberate click. On touch, hover never fires and the same rows work as
 * ordinary taps.
 *
 * STATE
 * -----
 * Which branches are open is remembered in localStorage, so returning to the
 * panel does not mean re-expanding the same page every time. It is only ever
 * UI state — losing it costs nothing, so every access is wrapped and failure
 * is ignored rather than handled.
 */

/* --------------------------------------------------------------------------
 * NAVIGATION MODEL
 * ------------------------------------------------------------------------ */

export const NAV = [
  {
    group: "Overview",
    items: [
      {
        to: "/admin",
        label: "Dashboard",
        end: true,
        icon: IconDashboard,
        title: "Dashboard",
        sub: "At a glance",
      },
      {
        to: "/admin/submissions",
        label: "Submissions",
        icon: IconInbox,
        title: "Submissions",
        sub: "Enquiries from the website forms",
      },
    ],
  },
  {
    group: "Website",
    items: [
      {
        to: "/admin/builder",
        label: "Pages",
        icon: IconLayers,
        tree: true, // ← the one item that expands into the site map
        title: "Pages",
        sub: "Every page, and the sections it is built from",
      },
      {
        to: "/admin/hero",
        label: "Hero slides",
        icon: IconSlides,
        title: "Hero slides",
        sub: "The homepage carousel",
      },
      {
        to: "/admin/stats",
        label: "Statistics",
        icon: IconChart,
        title: "Statistics",
        sub: "Verified trust numbers",
      },
    ],
  },
  {
    group: "Content",
    items: [
      {
        to: "/admin/projects",
        label: "Projects",
        icon: IconBriefcase,
        title: "Projects",
        sub: "Portfolio case studies",
      },
      {
        to: "/admin/services",
        label: "Services",
        icon: IconTools,
        title: "Services",
        sub: "What the business offers",
      },
      {
        to: "/admin/pages",
        label: "SEO & publishing",
        icon: IconFile,
        title: "SEO & publishing",
        sub: "Which pages are live, and how they appear in search",
      },
      {
        to: "/admin/faqs",
        label: "FAQs",
        icon: IconHelp,
        title: "FAQs",
        sub: "Questions shown on /faq",
      },
      {
        to: "/admin/testimonials",
        label: "Testimonials",
        icon: IconQuote,
        title: "Testimonials",
        sub: "Verified client feedback",
      },
      {
        to: "/admin/team",
        label: "Team",
        icon: IconUsers,
        title: "Team members",
        sub: "Leadership and team profiles",
      },
    ],
  },
  {
    group: "Configuration",
    items: [
      {
        to: "/admin/settings",
        label: "Settings",
        icon: IconSettings,
        title: "Settings",
        sub: "Contact details, social links and footer",
      },
      {
        to: "/admin/users",
        label: "Admin users",
        icon: IconShield,
        title: "Admin users",
        sub: "Who can sign in to this panel",
      },
    ],
  },
];

const FLAT_NAV = NAV.flatMap((section) => section.items);

/** The nav item a pathname belongs to. Exported for the topbar heading. */
export function findActive(pathname) {
  return (
    FLAT_NAV.find((item) =>
      item.end ? pathname === item.to : pathname.startsWith(item.to)
    ) || FLAT_NAV[0]
  );
}

/* --------------------------------------------------------------------------
 * PERSISTED OPEN/CLOSED STATE
 * ------------------------------------------------------------------------ */

const STORE_KEY = "sb.admin.nav";

function readStore() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object") return { pagesOpen: false, open: [] };
    return {
      pagesOpen: Boolean(parsed.pagesOpen),
      open: Array.isArray(parsed.open) ? parsed.open : [],
    };
  } catch {
    // Private browsing, a quota error, corrupted JSON — none of it matters
    // enough to interrupt anyone. Start closed.
    return { pagesOpen: false, open: [] };
  }
}

function writeStore(value) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(value));
  } catch {
    /* ignore — this is a convenience, not state the panel depends on */
  }
}

/** True only where hovering is a real interaction, i.e. not a touchscreen. */
function usePointerHover() {
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setCanHover(mq.matches);
    const onChange = (event) => setCanHover(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return canHover;
}

/* --------------------------------------------------------------------------
 * SECTION LEAF
 * ------------------------------------------------------------------------ */

function SectionLink({ section, pagePath, isActive, onNavigate }) {
  const Icon = sectionTypeIcon(section.section_type);
  const type = sectionTypeOf(section.section_type);
  const name = section.label || section.section_key;

  /* "Introduction — Introduction" is what naively joining the two produced
     whenever an admin had named a section after its type, which is most of
     them. Only say the type when it adds something. */
  const parts = [name];
  if (type.label.toLowerCase() !== name.toLowerCase()) parts.push(type.label);
  if (!section.is_enabled) parts.push("hidden on the website");

  return (
    <li>
      <Link
        className={
          "ad-tree-section" +
          (isActive ? " is-active" : "") +
          (section.is_enabled ? "" : " is-off")
        }
        to={`/admin/builder?page=${encodeURIComponent(pagePath)}&section=${section.id}`}
        onClick={onNavigate}
        title={parts.join(" — ")}
      >
        <Icon size={14} className="ad-tree-ico" />
        <span className="ad-tree-label">{name}</span>
        {!section.is_enabled && (
          <span className="ad-tree-flag" aria-label="Hidden on the website">
            hidden
          </span>
        )}
      </Link>
    </li>
  );
}

/* --------------------------------------------------------------------------
 * PAGE BRANCH
 * ------------------------------------------------------------------------ */

function PageBranch({ page, isOpen, onToggle, onHoverOpen, activePage, activeSection, onNavigate }) {
  const live = page.sections.filter((s) => s.is_enabled).length;
  const isCurrent = activePage === page.path;
  const hoverTimer = useRef(null);
  const canHover = usePointerHover();

  const startHover = () => {
    if (!canHover || isOpen) return;
    clearTimeout(hoverTimer.current);
    // Long enough that dragging the cursor past a row on the way somewhere
    // else does not fling it open; short enough to feel like a response.
    hoverTimer.current = setTimeout(onHoverOpen, 170);
  };

  const cancelHover = () => clearTimeout(hoverTimer.current);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  const panelId = `ad-tree-${page.path.replace(/[^a-z0-9]+/gi, "-")}`;

  return (
    <li
      className={`ad-tree-page${isOpen ? " is-open" : ""}${isCurrent ? " is-current" : ""}`}
      onMouseEnter={startHover}
      onMouseLeave={cancelHover}
    >
      <div className="ad-tree-row">
        {/* The name navigates to this page in the builder AND opens the branch:
            an admin who clicks "Home" wants to see Home, in both senses. */}
        <Link
          className="ad-tree-name"
          to={`/admin/builder?page=${encodeURIComponent(page.path)}`}
          onClick={() => {
            if (!isOpen) onToggle();
            onNavigate();
          }}
          title={page.path}
        >
          <span className="ad-tree-label">{page.label}</span>
          <span className="ad-tree-count">
            {page.sections.length === 0 ? "—" : `${live}/${page.sections.length}`}
          </span>
        </Link>

        {/* A separate control for expanding, so the two actions never fight.
            Hidden from the tree when the page has nothing to expand into. */}
        {page.sections.length > 0 && (
          <button
            className="ad-tree-toggle"
            type="button"
            aria-expanded={isOpen}
            aria-controls={panelId}
            aria-label={`${isOpen ? "Collapse" : "Expand"} ${page.label} sections`}
            onClick={onToggle}
          >
            <IconChevron size={13} />
          </button>
        )}
      </div>

      {isOpen && page.sections.length > 0 && (
        <ul className="ad-tree-sections" id={panelId}>
          {page.sections.map((section) => (
            <SectionLink
              key={section.id}
              section={section}
              pagePath={page.path}
              isActive={isCurrent && activeSection === String(section.id)}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/* --------------------------------------------------------------------------
 * THE PAGES TREE
 * ------------------------------------------------------------------------ */

function PagesTree({ open, activePage, activeSection, onNavigate }) {
  const { grouped, loading, error, total } = useSiteMap();
  const [store, setStore] = useState(readStore);
  const [query, setQuery] = useState("");

  const setOpenPaths = useCallback((next) => {
    setStore((current) => {
      const value = { ...current, open: next };
      writeStore(value);
      return value;
    });
  }, []);

  const togglePage = useCallback(
    (path) => {
      setStore((current) => {
        const isOpen = current.open.includes(path);
        const value = {
          ...current,
          open: isOpen
            ? current.open.filter((p) => p !== path)
            : current.open.concat(path),
        };
        writeStore(value);
        return value;
      });
    },
    []
  );

  const openPage = useCallback((path) => {
    setStore((current) => {
      if (current.open.includes(path)) return current;
      const value = { ...current, open: current.open.concat(path) };
      writeStore(value);
      return value;
    });
  }, []);

  /* The page the builder is currently showing opens itself, so arriving from
     anywhere — a bookmark, a link in the page body — leaves the sidebar
     pointing at where you actually are. */
  useEffect(() => {
    if (activePage) openPage(activePage);
  }, [activePage, openPage]);

  /* Searching is a temporary view, not a change to what the admin has
     expanded: matches expand while there is a query, and the saved state
     comes back untouched when the box is cleared. */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return grouped;

    const out = [];
    for (const [group, pages] of grouped) {
      const kept = [];
      for (const page of pages) {
        const pageHit =
          page.label.toLowerCase().includes(q) || page.path.toLowerCase().includes(q);
        const sectionHits = page.sections.filter((s) =>
          `${s.label} ${s.section_key} ${s.title}`.toLowerCase().includes(q)
        );
        if (pageHit) kept.push(page);
        else if (sectionHits.length) kept.push({ ...page, sections: sectionHits });
      }
      if (kept.length) out.push([group, kept]);
    }
    return out;
  }, [grouped, query]);

  const searching = query.trim().length > 0;
  const isBranchOpen = (path) => (searching ? true : store.open.includes(path));

  if (!open) return null;

  return (
    <div className="ad-tree" role="group" aria-label="Website pages">
      {total > 12 && (
        <div className="ad-tree-search">
          <IconSearch size={13} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a page or section…"
            aria-label="Find a page or section"
          />
        </div>
      )}

      {loading && <p className="ad-tree-note">Loading pages…</p>}

      {error && !loading && (
        <p className="ad-tree-note ad-tree-note-warn">
          Sections could not be loaded.{" "}
          <Link to="/admin/builder" onClick={onNavigate}>
            See why
          </Link>
          . The pages below still open.
        </p>
      )}

      {!loading && searching && filtered.length === 0 && (
        <p className="ad-tree-note">Nothing matches “{query.trim()}”.</p>
      )}

      {filtered.map(([group, pages]) => (
        <div key={group} className="ad-tree-group">
          <div className="ad-tree-group-title">{group}</div>
          <ul className="ad-tree-pages">
            {pages.map((page) => (
              <PageBranch
                key={page.path}
                page={page}
                isOpen={isBranchOpen(page.path)}
                onToggle={() => togglePage(page.path)}
                onHoverOpen={() => openPage(page.path)}
                activePage={activePage}
                activeSection={activeSection}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </div>
      ))}

      {!loading && !searching && store.open.length > 0 && (
        <button
          className="ad-tree-collapse"
          type="button"
          onClick={() => setOpenPaths([])}
        >
          Collapse all
        </button>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------
 * SIDEBAR
 * ------------------------------------------------------------------------ */

export default function AdminSidebar({ isOpen, onNavigate, profile, onSignOut }) {
  const location = useLocation();
  const [store, setStore] = useState(readStore);
  const hoverTimer = useRef(null);
  const canHover = usePointerHover();

  const params = new URLSearchParams(location.search);
  const activePage = params.get("page") || "";
  const activeSection = params.get("section") || "";
  const onBuilder = location.pathname.startsWith("/admin/builder");

  const setPagesOpen = useCallback((next) => {
    setStore((current) => {
      const value = { ...current, pagesOpen: next };
      writeStore(value);
      return value;
    });
  }, []);

  /* Landing on the builder — from a bookmark, or from a "Go to section" link
     elsewhere in the panel — opens the tree, because the tree is the context
     for what is on screen. */
  useEffect(() => {
    if (onBuilder) setPagesOpen(true);
  }, [onBuilder, setPagesOpen]);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  const startHover = () => {
    if (!canHover || store.pagesOpen) return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setPagesOpen(true), 170);
  };

  return (
    <aside
      className={`ad-sidebar${isOpen ? " is-open" : ""}`}
      aria-label="Admin navigation"
    >
      <div className="ad-brand">
        <span className="ad-brand-mark">SB</span>
        <span className="ad-brand-text">
          <b>Siraj Builders</b>
          <span>Admin</span>
        </span>
      </div>

      <nav className="ad-nav" aria-label="Admin sections">
        {NAV.map((section) => (
          <div className="ad-nav-block" key={section.group}>
            <div className="ad-nav-group">{section.group}</div>

            {section.items.map((item) => {
              const Icon = item.icon;

              /* ---- The one expandable item ---- */
              if (item.tree) {
                return (
                  <div
                    className={`ad-nav-tree${store.pagesOpen ? " is-open" : ""}`}
                    key={item.to}
                    onMouseEnter={startHover}
                    onMouseLeave={() => clearTimeout(hoverTimer.current)}
                  >
                    <div className="ad-nav-row">
                      <NavLink
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          "ad-nav-link" + (isActive ? " is-active" : "")
                        }
                        onClick={() => {
                          setPagesOpen(true);
                          onNavigate();
                        }}
                      >
                        <Icon size={17} className="ad-nav-ico" />
                        <span>{item.label}</span>
                      </NavLink>

                      <button
                        className="ad-nav-caret"
                        type="button"
                        aria-expanded={store.pagesOpen}
                        aria-controls="ad-pages-tree"
                        aria-label={
                          store.pagesOpen
                            ? "Collapse the list of pages"
                            : "Expand the list of pages"
                        }
                        onClick={() => setPagesOpen(!store.pagesOpen)}
                      >
                        <IconChevron size={14} />
                      </button>
                    </div>

                    <div id="ad-pages-tree">
                      <PagesTree
                        open={store.pagesOpen}
                        activePage={onBuilder ? activePage || "/" : ""}
                        activeSection={onBuilder ? activeSection : ""}
                        onNavigate={onNavigate}
                      />
                    </div>
                  </div>
                );
              }

              /* ---- Ordinary leaf ---- */
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    "ad-nav-link" + (isActive ? " is-active" : "")
                  }
                  onClick={onNavigate}
                >
                  <Icon size={17} className="ad-nav-ico" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="ad-sidebar-foot">
        <div className="ad-user">
          <span className="ad-user-dot" aria-hidden="true" />
          <span className="ad-user-text">
            <b>{profile?.email}</b>
            {profile?.role ? <i>{profile.role}</i> : null}
          </span>
        </div>
        <button
          className="ad-btn ad-btn-ghost ad-btn-sm"
          type="button"
          onClick={onSignOut}
          style={{ width: "100%" }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
