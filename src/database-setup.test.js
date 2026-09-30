/* eslint-disable testing-library/no-container, testing-library/no-node-access */
/**
 * DATABASE SETUP ERRORS
 * ============================================================================
 * The Pages screen once failed with nothing but PostgREST's own sentence:
 *
 *     Could not find the table 'public.page_sections' in the schema cache
 *
 * These tests pin down the replacement. Two things matter and both are
 * asserted below: the panel must name the exact file that fixes it, and the
 * sidebar must keep working — losing the whole navigation because one table
 * is missing would be a far worse failure than the one being reported.
 *
 * Run: npm test
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import SiteMapContext, { diagnose } from "./admin/SiteMapContext";
import PageBuilderPage from "./admin/pages/PageBuilderPage";
import AdminSidebar from "./admin/components/AdminSidebar";

/** Verbatim: what Supabase actually returned when the table was dropped. */
const MISSING_TABLE = new Error(
  "Could not find the table 'public.page_sections' in the schema cache"
);

function brokenMap(error) {
  const pages = [{ path: "/", label: "Home", group: "Main", sections: [] }];
  return {
    pages,
    grouped: [["Main", pages]],
    loading: false,
    error: diagnose(error),
    refresh: jest.fn().mockResolvedValue(null),
    pageAt: () => undefined,
    total: 0,
  };
}

function renderWith(value, ui, route = "/admin/builder") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <SiteMapContext.Provider value={value}>{ui}</SiteMapContext.Provider>
    </MemoryRouter>
  );
}

/* =========================================================== DIAGNOSIS */

describe("diagnose", () => {
  test("recognises the missing table and names the file that restores it", () => {
    const result = diagnose(MISSING_TABLE);
    expect(result.fix).toBe("repair-page-sections.sql");
    expect(result.title).toMatch(/missing/i);
  });

  test("recognises PostgreSQL's own wording for the same thing", () => {
    const result = diagnose(new Error('relation "public.page_sections" does not exist'));
    expect(result.fix).toBe("repair-page-sections.sql");
  });

  test("does not prescribe SQL for an authentication problem", () => {
    const result = diagnose(new Error("JWT expired"));
    expect(result.fix).toBeUndefined();
    expect(result.title).toMatch(/refused/i);
  });

  test("does not prescribe SQL for a network problem", () => {
    const result = diagnose(new TypeError("Failed to fetch"));
    expect(result.fix).toBeUndefined();
    expect(result.title).toMatch(/reach/i);
  });

  test("keeps the original message so it can be forwarded", () => {
    expect(diagnose(new Error("something odd")).raw).toBe("something odd");
  });
});

/* ============================================================== PANEL */

describe("the setup panel", () => {
  test("names the file, where to run it, and what to do afterwards", () => {
    renderWith(brokenMap(MISSING_TABLE), <PageBuilderPage />);

    expect(screen.getByText(/repair-page-sections\.sql/)).toBeInTheDocument();
    expect(screen.getByText(/SQL Editor/)).toBeInTheDocument();
    expect(screen.getByText(/Ctrl \+ Shift \+ R/)).toBeInTheDocument();
  });

  test("says what the fix puts back, and that running it is safe", () => {
    const { container } = renderWith(brokenMap(MISSING_TABLE), <PageBuilderPage />);
    expect(container.textContent).toMatch(/91 sections/);
    expect(container.textContent).toMatch(/mehfooz/i);
  });

  test("keeps the raw error out of the way until it is asked for", async () => {
    const user = userEvent.setup();
    const { container } = renderWith(brokenMap(MISSING_TABLE), <PageBuilderPage />);

    expect(container.textContent).not.toMatch(/schema cache/);

    await user.click(screen.getByRole("button", { name: /show technical detail/i }));
    expect(container.textContent).toMatch(/schema cache/);
  });

  test("offers a retry that asks the database again", async () => {
    const user = userEvent.setup();
    const value = brokenMap(MISSING_TABLE);
    renderWith(value, <PageBuilderPage />);

    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(value.refresh).toHaveBeenCalled();
  });
});

/* ============================================================ SIDEBAR */

describe("the sidebar survives a missing table", () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Effects expand the tree on /admin/builder; seed it so the assertion
    // does not depend on effect timing.
    window.localStorage.setItem(
      "sb.admin.nav",
      JSON.stringify({ pagesOpen: true, open: [] })
    );
  });

  test("every menu item still renders", () => {
    renderWith(
      brokenMap(MISSING_TABLE),
      <AdminSidebar isOpen onNavigate={() => {}} profile={{ email: "a@b.c" }} onSignOut={() => {}} />
    );

    ["Dashboard", "Submissions", "Projects", "Services", "Settings"].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  test("the tree explains itself rather than appearing simply empty", () => {
    renderWith(
      brokenMap(MISSING_TABLE),
      <AdminSidebar isOpen onNavigate={() => {}} profile={{ email: "a@b.c" }} onSignOut={() => {}} />
    );

    expect(screen.getByText(/Sections could not be loaded/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /see why/i })).toBeInTheDocument();
  });
});
