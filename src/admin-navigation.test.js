/* eslint-disable testing-library/no-container, testing-library/no-node-access */
/**
 * ADMIN NAVIGATION + HERO CONTROLS
 * ============================================================================
 * Covers the two things that were rebuilt: the sidebar's page/section tree
 * and the homepage hero's controls.
 *
 * The site map is supplied through the context directly rather than letting
 * SiteMapProvider call Supabase. That keeps the test about the navigation and
 * not about the network, and lets it assert on exact section names — which is
 * the whole point of the tree.
 *
 * Run: npm test
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import SiteMapContext from "./admin/SiteMapContext";
import AdminSidebar, { NAV, findActive } from "./admin/components/AdminSidebar";
import PageBuilderPage from "./admin/pages/PageBuilderPage";

/* -------------------------------------------------------------- fixtures */

const HOME_SECTIONS = [
  {
    id: "s1",
    page_path: "/",
    section_key: "hero",
    label: "Hero Section",
    section_type: "hero",
    title: "Construction, managed from the first plan to the final detail.",
    subtitle: "",
    body: "",
    items: [],
    media_url: "",
    video_url: "",
    cta_label: "Discuss Your Project",
    cta_href: "/consultation",
    is_enabled: true,
    position: 0,
  },
  {
    id: "s2",
    page_path: "/",
    section_key: "intro",
    label: "Introduction",
    section_type: "intro",
    title: "A construction partner, not simply a contractor.",
    subtitle: "",
    body: "",
    items: [],
    media_url: "",
    video_url: "",
    cta_label: "",
    cta_href: "",
    is_enabled: true,
    position: 1,
  },
  {
    id: "s3",
    page_path: "/",
    section_key: "stats",
    label: "Statistics Band",
    section_type: "stats",
    title: "",
    subtitle: "",
    body: "",
    items: [],
    media_url: "",
    video_url: "",
    cta_label: "",
    cta_href: "",
    is_enabled: false,
    position: 2,
  },
];

const PAGES = [
  { path: "/", label: "Home", group: "Main", sections: HOME_SECTIONS },
  { path: "/who-we-are", label: "About", group: "Main", sections: [] },
];

const siteMap = {
  pages: PAGES,
  grouped: [["Main", PAGES]],
  loading: false,
  error: "",
  refresh: jest.fn().mockResolvedValue(PAGES),
  pageAt: (path) => PAGES.find((page) => page.path === path),
  total: HOME_SECTIONS.length,
};

function renderSidebar({ route = "/admin/builder?page=%2F", open = null } = {}) {
  if (open) {
    window.localStorage.setItem("sb.admin.nav", JSON.stringify(open));
  }
  return render(
    <MemoryRouter initialEntries={[route]}>
      <SiteMapContext.Provider value={siteMap}>
        <AdminSidebar
          isOpen
          onNavigate={() => {}}
          profile={{ email: "admin@sirajbuilders.pk", role: "owner" }}
          onSignOut={() => {}}
        />
      </SiteMapContext.Provider>
    </MemoryRouter>
  );
}

function renderBuilder(route) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <SiteMapContext.Provider value={siteMap}>
        <PageBuilderPage />
      </SiteMapContext.Provider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

/* ============================================================== NAV MODEL */

describe("navigation model", () => {
  test("every item points at a distinct /admin route", () => {
    const routes = NAV.flatMap((group) => group.items.map((item) => item.to));
    expect(new Set(routes).size).toBe(routes.length);
    routes.forEach((route) => expect(route.startsWith("/admin")).toBe(true));
  });

  test("exactly one item expands into the site map", () => {
    const trees = NAV.flatMap((group) => group.items).filter((item) => item.tree);
    expect(trees).toHaveLength(1);
    expect(trees[0].to).toBe("/admin/builder");
  });

  test("every item carries an icon, a title and a subtitle", () => {
    NAV.flatMap((group) => group.items).forEach((item) => {
      expect(typeof item.icon).toBe("function");
      expect(item.title).toBeTruthy();
      expect(item.sub).toBeTruthy();
    });
  });

  test("findActive maps a pathname to its heading", () => {
    expect(findActive("/admin").title).toBe("Dashboard");
    expect(findActive("/admin/builder").title).toBe("Pages");
    expect(findActive("/admin/pages").title).toBe("Page copy");
    expect(findActive("/admin/users").title).toBe("Admin users");
  });
});

/* ================================================================= TREE */

describe("sidebar pages tree", () => {
  test("the Pages item offers a disclosure control, collapsed by default", () => {
    renderSidebar({ route: "/admin" });
    const caret = screen.getByRole("button", { name: /expand the list of pages/i });
    expect(caret).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Hero Section")).not.toBeInTheDocument();
  });

  test("clicking the caret reveals every page on the website", async () => {
    const user = userEvent.setup();
    renderSidebar({ route: "/admin" });

    await user.click(screen.getByRole("button", { name: /expand the list of pages/i }));

    expect(screen.getByRole("link", { name: /Home/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /About/ })).toBeInTheDocument();
  });

  test("expanding a page reveals the sections it is built from", async () => {
    const user = userEvent.setup();
    renderSidebar({ route: "/admin", open: { pagesOpen: true, open: [] } });

    expect(screen.queryByText("Hero Section")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /expand home sections/i }));

    expect(screen.getByText("Hero Section")).toBeInTheDocument();
    expect(screen.getByText("Introduction")).toBeInTheDocument();
    expect(screen.getByText("Statistics Band")).toBeInTheDocument();
  });

  test("a section link carries its page and id, so it can open the editor", () => {
    renderSidebar({ route: "/admin", open: { pagesOpen: true, open: ["/"] } });

    const link = screen.getByText("Hero Section").closest("a");
    expect(link.getAttribute("href")).toContain("section=s1");
    expect(decodeURIComponent(link.getAttribute("href"))).toContain("page=/");
  });

  test("a hidden section is listed, dimmed and labelled", () => {
    renderSidebar({ route: "/admin", open: { pagesOpen: true, open: ["/"] } });

    const link = screen.getByText("Statistics Band").closest("a");
    expect(link.className).toContain("is-off");
    expect(within(link).getByText("hidden")).toBeInTheDocument();
  });

  test("each page reports how many of its sections are live", () => {
    renderSidebar({ route: "/admin", open: { pagesOpen: true, open: [] } });

    // Home: three sections, one hidden.
    expect(screen.getByText("2/3")).toBeInTheDocument();
    // About has none, so there is nothing to count and no toggle to offer.
    expect(
      screen.queryByRole("button", { name: /expand about sections/i })
    ).not.toBeInTheDocument();
  });

  test("the section named in the URL is marked as the current one", () => {
    renderSidebar({
      route: "/admin/builder?page=%2F&section=s2",
      open: { pagesOpen: true, open: ["/"] },
    });

    expect(screen.getByText("Introduction").closest("a").className).toContain("is-active");
    expect(screen.getByText("Hero Section").closest("a").className).not.toContain("is-active");
  });

  test("what is expanded survives a remount", async () => {
    const user = userEvent.setup();
    const { unmount } = renderSidebar({ route: "/admin" });

    await user.click(screen.getByRole("button", { name: /expand the list of pages/i }));
    await user.click(screen.getByRole("button", { name: /expand home sections/i }));
    unmount();

    renderSidebar({ route: "/admin" });
    expect(screen.getByText("Hero Section")).toBeInTheDocument();
  });
});

/* ============================================================== BUILDER */

describe("page builder deep links", () => {
  test("opens on the page named in the URL", () => {
    renderBuilder("/admin/builder?page=%2Fwho-we-are");
    expect(screen.getByText("This page has no sections yet")).toBeInTheDocument();
  });

  test("a section id in the URL opens that section's editor", () => {
    renderBuilder("/admin/builder?page=%2F&section=s1");

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Edit section")).toBeInTheDocument();
    expect(
      within(dialog).getByDisplayValue(
        "Construction, managed from the first plan to the final detail."
      )
    ).toBeInTheDocument();
  });

  test("the editor states the page, section and position before any field", () => {
    renderBuilder("/admin/builder?page=%2F&section=s2");

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Home")).toBeInTheDocument();
    expect(within(dialog).getByText("Middle · 2 of 3")).toBeInTheDocument();
  });

  test("no section id means no editor", () => {
    renderBuilder("/admin/builder?page=%2F");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("a stale section id is ignored rather than opening an empty form", () => {
    renderBuilder("/admin/builder?page=%2F&section=deleted-long-ago");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Hero Section")).toBeInTheDocument();
  });

  test("the editor only offers the fields the section type actually renders", () => {
    const { unmount } = renderBuilder("/admin/builder?page=%2F&section=s1");
    expect(screen.getByText("Image URL")).toBeInTheDocument();
    expect(screen.queryByText("List items")).not.toBeInTheDocument();
    unmount();

    renderBuilder("/admin/builder?page=%2F&section=s2");
    expect(screen.queryByText("Image URL")).not.toBeInTheDocument();
  });
});
