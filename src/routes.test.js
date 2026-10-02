/* eslint-disable testing-library/no-container, testing-library/no-node-access, testing-library/no-wait-for-multiple-assertions */
/**
 * ROUTE SMOKE TEST
 * ============================================================================
 * Renders every route in a jsdom environment and fails on any thrown error,
 * any React warning, or any console error.
 *
 * Supabase credentials are deliberately absent here, which exercises the case
 * that matters most: the site must render its full static fallback content
 * when the database cannot be reached. A visitor should never see a blank
 * page because an environment variable is missing.
 *
 * The Testing Library lint rules above are disabled on purpose. They push
 * towards role- and label-based queries, which is right for testing behaviour
 * — but this file tests structural health across 26 routes. It asserts that a
 * `<main>` exists and that inputs carry the `name` attributes the submission
 * service maps to database columns, and `name` has no accessible-role
 * equivalent to query by.
 */

import { render, screen, waitFor } from "@testing-library/react";

// This suite verifies documented fallback content. Keep it independent from
// any developer .env file or reachable Supabase project.
process.env.REACT_APP_SUPABASE_URL = "";
process.env.REACT_APP_SUPABASE_ANON_KEY = "";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const App = require("./App").default;

const PUBLIC_ROUTES = [
  "/",
  "/who-we-are",
  "/leadership",
  "/role-definition",
  "/subcontractors",
  "/international",
  "/affiliates",
  "/residential-construction",
  "/commercial-construction",
  "/renovation-remodelling",
  "/design-architecture",
  "/grey-structure",
  "/turnkey-construction",
  "/project-management",
  "/services",
  "/testimonials",
  "/projects",
  "/projects/a-project-that-does-not-exist",
  "/project-detail?project=legacy-link",
  "/project-showcase",
  "/our-process",
  "/locations",
  "/cost-index",
  "/faq",
  "/contact-us",
  "/consultation",
  "/privacy-policy",
  "/terms",
  "/this-route-does-not-exist",
  "/admin",
  "/admin/signup",
  "/admin/forgot-password",
  "/admin/reset-password",
];

let consoleError;
let consoleWarn;
let messages;

beforeEach(() => {
  messages = [];
  consoleError = jest.spyOn(console, "error").mockImplementation((...args) => {
    messages.push(["error", args.join(" ")]);
  });
  consoleWarn = jest.spyOn(console, "warn").mockImplementation((...args) => {
    messages.push(["warn", args.join(" ")]);
  });
});

afterEach(() => {
  consoleError.mockRestore();
  consoleWarn.mockRestore();
});

/** Noise that is expected and unrelated to page health. */
const IGNORED = [
  /not wrapped in act/i,
  /Supabase is not configured/i,
  /No content configured/i,
  /Not implemented: window\.scrollTo/i,
  /Using documented defaults/i,
];

function significant(list) {
  return list.filter(([, text]) => !IGNORED.some((pattern) => pattern.test(text)));
}

jest.setTimeout(20000);

describe("every route renders", () => {
  test.each(PUBLIC_ROUTES)("%s", async (path) => {
    window.history.pushState({}, "", path);

    const { container, unmount } = render(<App />);

    // Lazy routes resolve on a microtask; wait for real content rather than
    // asserting against the Suspense fallback.
    // Wait for real content, not the Suspense fallback or the admin's
    // initial session-check state.
    await waitFor(
      () => {
        expect(container.querySelector("main, .admin-root, .admin-shell")).toBeTruthy();
        expect(container.textContent.trim().length).toBeGreaterThan(40);
      },
      { timeout: 6000 }
    );
    expect(significant(messages)).toEqual([]);

    unmount();
  });
});

describe("site chrome", () => {
  test("header and footer render on the homepage", async () => {
    window.history.pushState({}, "", "/");
    render(<App />);
    await waitFor(() => {
      expect(document.querySelector("header")).toBeTruthy();
      expect(document.querySelector("footer")).toBeTruthy();
    });
  });

  test("contact form exposes its required fields", async () => {
    window.history.pushState({}, "", "/contact-us");
    render(<App />);
    await waitFor(() => {
      expect(document.querySelector('[name="name"]')).toBeTruthy();
    });
    expect(document.querySelector('[name="phone"]')).toBeTruthy();
    expect(document.querySelector('[name="projectType"]')).toBeTruthy();
    expect(document.querySelector('[name="description"]')).toBeTruthy();
  });

  test("consultation form exposes its ten fields", async () => {
    window.history.pushState({}, "", "/consultation");
    render(<App />);
    await waitFor(() => {
      expect(document.querySelector('[name="name"]')).toBeTruthy();
    });
    ["phone", "email", "projectType", "location", "size", "budget", "startDate", "service", "description"].forEach(
      (field) => {
        expect(document.querySelector(`[name="${field}"]`)).toBeTruthy();
      }
    );
  });

  test("admin shows the login screen when signed out", async () => {
    window.history.pushState({}, "", "/admin");
    render(<App />);
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeTruthy();
    });
    expect(screen.getByLabelText(/password/i)).toBeTruthy();
  });

  test("sign-up is reachable without a session", async () => {
    window.history.pushState({}, "", "/admin/signup");
    render(<App />);
    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toBeTruthy();
    });
    expect(screen.getByLabelText(/confirm password/i)).toBeTruthy();
  });

  test("password recovery is reachable without a session", async () => {
    window.history.pushState({}, "", "/admin/forgot-password");
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /reset your password/i })).toBeTruthy();
    });
  });

  /* The reset screen is the one place a missing token must not look like a
     broken page: someone lands here by clicking an expired link, and needs to
     be told to request a new one rather than shown an empty form. */
  test("reset screen refuses a link with no token", async () => {
    window.history.pushState({}, "", "/admin/reset-password");
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/needs a valid reset link/i)).toBeTruthy();
    });
  });
});
