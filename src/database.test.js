/* eslint-disable testing-library/no-container, testing-library/no-node-access */
/**
 * DATABASE INTEGRATION TEST
 * ============================================================================
 * `routes.test.js` runs with no Supabase credentials, so it only ever proves
 * the static fallback path. This file proves the other half: that content
 * coming *from the database* actually reaches the screen, and that a form
 * submission actually becomes an INSERT with the right columns.
 *
 * Supabase is mocked at the `fetch` boundary rather than by stubbing the
 * service layer, so the real query builder, the real URL construction and the
 * real row→props converters are all exercised. A typo in a column name or a
 * broken PostgREST filter fails here.
 *
 * Every fixture value below is deliberately distinct from the hardcoded
 * content, so a passing assertion can only mean the database value won.
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";

/* src/lib/supabase.js reads its configuration once, at module load. The env
   vars therefore have to be set before anything pulls that module in, which
   is why App is `require`d at the bottom of this block rather than imported
   at the top — ES imports are hoisted above module-level statements, so an
   `import App` here would load supabase.js with an empty configuration.
   Testing Library is imported normally above, so its automatic cleanup hook
   still registers during Jest's collection phase. */
const SUPABASE_URL = "https://testproject.supabase.co";

process.env.REACT_APP_SUPABASE_URL = SUPABASE_URL;
process.env.REACT_APP_SUPABASE_ANON_KEY = "test-anon-key";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const App = require("./App").default;

/* --------------------------------------------------------------------------
 * Fixtures — none of these strings appear anywhere in src/
 * ------------------------------------------------------------------------ */

const FIXTURES = {
  site_settings: [
    { key: "company_name", value: "Siraj Builders", display: "", is_confirmed: true, group_name: "company", sort_order: 10 },
    { key: "contact_phone", value: "+92 300 7654321", display: "", is_confirmed: true, group_name: "contact", sort_order: 10 },
    { key: "contact_email", value: "hello@dbfixture.test", display: "", is_confirmed: true, group_name: "contact", sort_order: 30 },
    { key: "contact_whatsapp", value: "", display: "WhatsApp pending", is_confirmed: false, group_name: "contact", sort_order: 20 },
  ],
  social_links: [
    { id: "s1", key: "facebook", label: "Facebook", href: "https://facebook.com/dbfixture", is_confirmed: true, is_active: true, sort_order: 10 },
    { id: "s2", key: "instagram", label: "Instagram", href: "", is_confirmed: false, is_active: true, sort_order: 20 },
  ],
  services: [
    { id: "v1", slug: "residential-construction", path: "/residential-construction", label: "Database Residential Label", is_confirmed: true, is_active: true, show_in_nav: true, sort_order: 10 },
    { id: "v2", slug: "commercial-construction", path: "/commercial-construction", label: "Database Commercial Label", is_confirmed: true, is_active: true, show_in_nav: true, sort_order: 20 },
  ],
  hero_slides: [
    {
      id: "h1",
      eyebrow: "01 - From the database",
      title: "Headline stored in Postgres",
      lead: "This slide proves hero content is being read from the hero_slides table rather than the hardcoded SLIDES array.",
      image_url: "https://example.test/hero.jpg",
      primary_label: "Database CTA", primary_to: "/consultation",
      secondary_label: "Second CTA", secondary_to: "/projects",
      is_active: true, sort_order: 10,
    },
  ],
  pages: [
    {
      id: "p1", path: "/who-we-are",
      eyebrow: "Who we are",
      title: "Title served from the pages table",
      intro: "Intro paragraph served from the database for the who-we-are route.",
      image_url: "https://example.test/page.jpg",
      heading: "Heading served from the database",
      body: "Body copy served from the database, long enough to render as a real paragraph on the page.",
      points: ["Database point one", "Database point two"],
      motif: null, is_published: true, sort_order: 10,
    },
  ],
  faq_categories: [
    { id: "c1", key: "services", label: "Database FAQ Category", is_active: true, sort_order: 10 },
  ],
  faqs: [
    { id: "f1", category_id: "c1", question: "Is this question coming from the database?", answer: "Yes — this answer lives in the faqs table and proves the FAQ page is dynamic.", is_active: true, sort_order: 10 },
  ],
  projects: [
    {
      id: "r1", slug: "database-project",
      title: "Project Loaded From Postgres",
      category: "Residential", location: "Bahawalpur", status: "Completed",
      year: "2026", area: "2,400 sq ft",
      image_url: "https://example.test/project.jpg",
      summary: "A portfolio entry stored in the projects table, proving the empty state is replaced once real rows exist.",
      requirement: "Stated requirement.", challenge: "Stated challenge.",
      solution: "Stated solution.", result: "Stated result.",
      is_active: true, sort_order: 10,
    },
  ],
  testimonials: [],
  team_members: [],
  stats: [],
};

/* --------------------------------------------------------------------------
 * fetch mock
 * ------------------------------------------------------------------------ */

let requests;

function jsonResponse(body, { status = 200, contentRange = null } = {}) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => (name.toLowerCase() === "content-range" ? contentRange : null) },
    text: () => Promise.resolve(JSON.stringify(body)),
    json: () => Promise.resolve(body),
  });
}

function installFetchMock() {
  requests = [];
  global.fetch = jest.fn((url, options = {}) => {
    const method = options.method || "GET";
    const parsed = new URL(url);
    const table = parsed.pathname.replace("/rest/v1/", "");
    const body = options.body ? JSON.parse(options.body) : null;

    requests.push({ url, method, table, body, search: parsed.search });

    if (method === "POST" && table === "submissions") {
      return jsonResponse([{ id: "new-submission-id", created_at: "2026-09-23T10:00:00Z" }], { status: 201 });
    }

    let rows = FIXTURES[table];
    if (!rows) return jsonResponse({ message: `No fixture for table "${table}"` }, { status: 404 });

    // Honour the one filter the page code actually depends on: ?path=eq.<x>
    const pathFilter = parsed.searchParams.get("path");
    if (pathFilter?.startsWith("eq.")) {
      rows = rows.filter((row) => row.path === pathFilter.slice(3));
    }
    const slugFilter = parsed.searchParams.get("slug");
    if (slugFilter?.startsWith("eq.")) {
      rows = rows.filter((row) => row.slug === slugFilter.slice(3));
    }

    return jsonResponse(rows, { contentRange: `0-${rows.length}/${rows.length}` });
  });
}

beforeEach(() => {
  installFetchMock();
  window.localStorage.clear();
});

function visit(path) {
  window.history.pushState({}, "", path);
  return render(<App />);
}

jest.setTimeout(20000);

/* ==========================================================================
 * CONTENT
 * ========================================================================== */

describe("database content reaches the page", () => {
  test("homepage hero renders the slide from hero_slides", async () => {
    visit("/");
    expect(await screen.findByText("Headline stored in Postgres")).toBeInTheDocument();
    expect(screen.getByText(/Database CTA/)).toBeInTheDocument();
  });

  test("content page renders copy from the pages table", async () => {
    visit("/who-we-are");
    expect(await screen.findByText("Title served from the pages table")).toBeInTheDocument();
    expect(screen.getByText("Heading served from the database")).toBeInTheDocument();
    expect(screen.getByText("Database point one")).toBeInTheDocument();
  });

  test("FAQ page renders questions from the faqs table", async () => {
    visit("/faq");
    expect(
      await screen.findByText("Is this question coming from the database?")
    ).toBeInTheDocument();
  });

  test("portfolio replaces its empty state once projects exist", async () => {
    const { container } = visit("/projects");
    expect(await screen.findByText("Project Loaded From Postgres")).toBeInTheDocument();
    expect(container.querySelector(".portfolio-empty")).toBeNull();
  });

  test("project detail resolves a slug from the database", async () => {
    visit("/project-detail?project=database-project");
    expect(await screen.findByText("Stated challenge.")).toBeInTheDocument();
    expect(screen.getByText("2,400 sq ft")).toBeInTheDocument();
  });
});

/* ==========================================================================
 * THE CONFIRMED FLAG — the behaviour most at risk of silent regression
 * ========================================================================== */

describe("confirmed flag survives the round trip", () => {
  test("a confirmed phone and email become real links", async () => {
    const { container } = visit("/contact-us");
    await waitFor(() => {
      expect(container.querySelector('a[href="tel:+92 300 7654321"]')).toBeTruthy();
    });
    expect(container.querySelector('a[href="mailto:hello@dbfixture.test"]')).toBeTruthy();
  });

  test("an unconfirmed social link stays out of the footer", async () => {
    const { container } = visit("/");
    await waitFor(() => {
      expect(container.querySelector('a[href="https://facebook.com/dbfixture"]')).toBeTruthy();
    });
    // instagram is is_confirmed:false with an empty href — it must not render.
    expect(container.querySelector('a[href=""]')).toBeNull();
  });
});

/* ==========================================================================
 * FORMS — the path that was silently discarding every enquiry
 * ========================================================================== */

describe("form submissions become database rows", () => {
  function fill(container, name, value) {
    const field = container.querySelector(`[name="${name}"]`);
    fireEvent.change(field, { target: { name, value } });
    return field;
  }

  test("the contact form INSERTs the correct columns and confirms to the visitor", async () => {
    const { container } = visit("/contact-us");
    await waitFor(() => {
      expect(container.querySelector('[name="name"]')).toBeTruthy();
    });

    fill(container, "name", "Arslan Sabir");
    fill(container, "phone", "+92 300 1112223");
    fill(container, "email", "arslan@example.test");
    fill(container, "projectType", "residential");
    fill(container, "description", "A description comfortably longer than the twenty character minimum.");

    fireEvent.submit(container.querySelector("form.project-form"));

    await waitFor(() => {
      expect(
        screen.getByText(/your project details have been received/i)
      ).toBeInTheDocument();
    });

    const insert = requests.find((r) => r.method === "POST" && r.table === "submissions");
    expect(insert).toBeTruthy();

    const row = insert.body[0];
    expect(row).toMatchObject({
      form_type: "contact",
      name: "Arslan Sabir",
      phone: "+92 300 1112223",
      email: "arslan@example.test",
      project_type: "residential",
    });
    // Consultation-only columns must be null, not empty strings.
    expect(row.location).toBeNull();
    expect(row.budget).toBeNull();
    // The visitor must not be able to pre-set workflow state — the RLS
    // insert policy rejects the row if these are present.
    expect(row.status).toBeUndefined();
    expect(row.is_read).toBeUndefined();
  });

  test("the consultation form sends its extra columns", async () => {
    const { container } = visit("/consultation");
    await waitFor(() => {
      expect(container.querySelector('[name="location"]')).toBeTruthy();
    });

    fill(container, "name", "Consultation Tester");
    fill(container, "phone", "+92 321 4445556");
    fill(container, "projectType", "Commercial");
    fill(container, "location", "Bahawalpur");
    fill(container, "size", "10 marla");
    fill(container, "description", "Another description that clears the twenty character minimum easily.");

    fireEvent.submit(container.querySelector("form"));

    await waitFor(() => {
      const insert = requests.find((r) => r.method === "POST" && r.table === "submissions");
      expect(insert).toBeTruthy();
    });

    const row = requests.find((r) => r.method === "POST" && r.table === "submissions").body[0];
    expect(row).toMatchObject({
      form_type: "consultation",
      location: "Bahawalpur",
      size: "10 marla",
    });
  });

  test("a failed insert shows an error and never a false success", async () => {
    // useProjectForm logs the real cause in development. That is correct
    // behaviour and this test provokes it deliberately, so the log is
    // captured rather than left to clutter the run.
    const logged = jest.spyOn(console, "error").mockImplementation(() => {});

    global.fetch = jest.fn((url, options = {}) => {
      const parsed = new URL(url);
      const table = parsed.pathname.replace("/rest/v1/", "");
      if ((options.method || "GET") === "POST" && table === "submissions") {
        return jsonResponse(
          { message: "new row violates row-level security policy" },
          { status: 403 }
        );
      }
      const rows = FIXTURES[table] || [];
      return jsonResponse(rows);
    });

    const { container } = visit("/contact-us");
    await waitFor(() => {
      expect(container.querySelector('[name="name"]')).toBeTruthy();
    });

    fill(container, "name", "Rejected Row");
    fill(container, "phone", "+92 300 0000000");
    fill(container, "projectType", "residential");
    fill(container, "description", "This submission will be rejected by the database policy.");

    fireEvent.submit(container.querySelector("form.project-form"));

    await waitFor(() => {
      expect(screen.getByText(/could not send your details/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/have been received/i)).toBeNull();

    // The developer-facing log must still have happened — silently swallowing
    // the cause would make this failure very hard to diagnose in the wild.
    expect(logged).toHaveBeenCalledWith(
      "[useProjectForm] Submission failed:",
      expect.objectContaining({ status: 403 })
    );
    logged.mockRestore();
  });
});

/* ==========================================================================
 * REQUEST HYGIENE
 * ========================================================================== */

describe("requests are well formed", () => {
  test("reads carry the anon key and target the REST endpoint", async () => {
    visit("/");
    await waitFor(() => {
      expect(requests.length).toBeGreaterThan(0);
    });

    const [{ url }] = requests;
    expect(url.startsWith(`${SUPABASE_URL}/rest/v1/`)).toBe(true);

    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers.apikey).toBe("test-anon-key");
    expect(headers.Authorization).toBe("Bearer test-anon-key");
  });

  test("public reads filter to active rows only", async () => {
    visit("/");
    await waitFor(() => {
      expect(requests.some((r) => r.table === "hero_slides")).toBe(true);
    });
    const heroRequest = requests.find((r) => r.table === "hero_slides");
    expect(heroRequest.search).toContain("is_active=eq.true");
    expect(heroRequest.search).toContain("order=sort_order.asc");
  });
});
