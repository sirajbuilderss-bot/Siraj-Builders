import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AdminAuthProvider, useAdminAuth } from "./AdminAuthContext";
import { SiteMapProvider } from "./SiteMapContext";
import { Loading } from "./components/ui";
import AdminSidebar, { NAV, findActive } from "./components/AdminSidebar";
import { IconExternal } from "./components/icons";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Dashboard from "./pages/Dashboard";
import SubmissionsPage from "./pages/SubmissionsPage";
import ProjectsPage from "./pages/ProjectsPage";
import ServicesPage from "./pages/ServicesPage";
import PagesPage from "./pages/PagesPage";
import PageBuilderPage from "./pages/PageBuilderPage";
import FaqsPage from "./pages/FaqsPage";
import TestimonialsPage from "./pages/TestimonialsPage";
import TeamPage from "./pages/TeamPage";
import StatsPage from "./pages/StatsPage";
import HeroSlidesPage from "./pages/HeroSlidesPage";
import SettingsPage from "./pages/SettingsPage";
import AdminUsersPage from "./pages/AdminUsersPage";

import "../styles/admin.css";

/* --------------------------------------------------------------------------
 * LAYOUT
 * ------------------------------------------------------------------------ */

function AdminLayout({ children }) {
  const { profile, signOut } = useAdminAuth();
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Close the mobile drawer whenever the route changes, so a tap on a link
  // does not leave the menu covering the page it just opened.
  useEffect(() => {
    setIsNavOpen(false);
  }, [location.pathname, location.search]);

  // Escape closes the drawer. On a phone the scrim is the only other way out,
  // and it is easy to miss behind a full-height panel.
  useEffect(() => {
    if (!isNavOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setIsNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isNavOpen]);

  const active = findActive(location.pathname) || NAV[0].items[0];

  return (
    <div className="admin-root">
      <div className="ad-shell">
        <AdminSidebar
          isOpen={isNavOpen}
          onNavigate={() => setIsNavOpen(false)}
          profile={profile}
          onSignOut={signOut}
        />

        {isNavOpen && (
          <button
            className="ad-scrim"
            type="button"
            aria-label="Close menu"
            onClick={() => setIsNavOpen(false)}
          />
        )}

        <div className="ad-main">
          <header className="ad-topbar">
            <button
              className="ad-burger"
              type="button"
              aria-label={isNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={isNavOpen}
              onClick={() => setIsNavOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>

            <div className="ad-topbar-title">
              <h1>{active.title}</h1>
              <div className="ad-sub">{active.sub}</div>
            </div>

            <div className="ad-topbar-actions">
              <a
                className="ad-btn ad-btn-ghost"
                href="/"
                target="_blank"
                rel="noreferrer"
              >
                <IconExternal size={15} />
                <span>View website</span>
              </a>
            </div>
          </header>

          <main className="ad-content">{children}</main>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
 * GATE
 * ------------------------------------------------------------------------ */

function AdminGate() {
  const { isReady, isSignedIn } = useAdminAuth();

  // Held until the stored session has been checked and refreshed, otherwise
  // a returning admin sees the login screen flash before being let straight in.
  if (!isReady) {
    return (
      <div className="admin-root">
        <div className="ad-login">
          <Loading label="Checking your session…" />
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <Routes>
        <Route path="signup" element={<SignupPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  /* The section tree is only fetched once a session exists — the login screen
     has no sidebar to fill, and an unauthenticated read would be refused by
     RLS anyway. */
  return (
    <SiteMapProvider>
      <AdminLayout>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="submissions" element={<SubmissionsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="builder" element={<PageBuilderPage />} />
          <Route path="pages" element={<PagesPage />} />
          <Route path="faqs" element={<FaqsPage />} />
          <Route path="testimonials" element={<TestimonialsPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="hero" element={<HeroSlidesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="users" element={<AdminUsersPage />} />

          {/* Someone already signed in following an old auth link should land
              on the dashboard, not on a sign-in form they no longer need. */}
          <Route path="signup" element={<Navigate to="/admin" replace />} />
          <Route path="forgot-password" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </AdminLayout>
    </SiteMapProvider>
  );
}

/**
 * ADMIN ENTRY POINT
 * ----------------------------------------------------------------------------
 * Mounted at /admin/* from App.jsx behind React.lazy, so none of this code —
 * or admin.css — is downloaded by an ordinary website visitor. The public
 * bundle is unchanged by the admin panel's existence.
 */
export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <AdminGate />
    </AdminAuthProvider>
  );
}
