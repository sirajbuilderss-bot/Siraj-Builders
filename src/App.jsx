import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout";
import ErrorBoundary from "./components/layout/ErrorBoundary";
import RouteLoader from "./components/layout/RouteLoader";
import Seo from "./components/seo/Seo";
import { SiteDataProvider } from "./context/SiteDataContext";
import Home from "./pages/home";

/**
 * Routing.
 *
 * Home is imported eagerly because it is the most common entry point and
 * should not wait on a second network round trip. Every other route is
 * code-split, so a visitor landing on the homepage no longer downloads
 * the FAQ, consultation and portfolio pages before first paint.
 */

const WhoWeAre = lazy(() => import("./pages/who-we-are"));
const Projects = lazy(() => import("./pages/projects"));
const ProjectDetail = lazy(() => import("./pages/project-detail"));
const ProjectShowcase = lazy(() => import("./pages/project-showcase"));
const OurProcess = lazy(() => import("./pages/our-process"));
const Faq = lazy(() => import("./pages/faq"));
const ContactUs = lazy(() => import("./pages/contact-us"));
const Consultation = lazy(() => import("./pages/consultation"));
const ResidentialConstruction = lazy(() =>
  import("./pages/residential-construction")
);
const CommercialConstruction = lazy(() =>
  import("./pages/CommercialConstruction")
);
const RenovationRemodelling = lazy(() =>
  import("./pages/renovation-remodelling")
);
const DesignArchitecture = lazy(() => import("./pages/design-architecture"));
const GreyStructure = lazy(() => import("./pages/grey-structure"));
const TurnkeyConstruction = lazy(() => import("./pages/turnkey-construction"));
const ProjectManagement = lazy(() => import("./pages/project-management"));
const Locations = lazy(() => import("./pages/locations"));
const CostIndex = lazy(() => import("./pages/cost-index"));
const Leadership = lazy(() => import("./pages/leadership"));
const RoleDefinition = lazy(() => import("./pages/role-definition"));
const Subcontractors = lazy(() => import("./pages/subcontractors"));
const International = lazy(() => import("./pages/international"));
const Affiliates = lazy(() => import("./pages/Affiliates"));
const PrivacyPolicy = lazy(() => import("./pages/privacy-policy"));
const Terms = lazy(() => import("./pages/terms"));
const NotFound = lazy(() => import("./pages/NotFound"));

/* The admin panel is code-split so no part of it — including admin.css —
   is downloaded by an ordinary website visitor. */
const AdminApp = lazy(() => import("./admin/AdminApp"));

/** Small wrapper so every lazy route shares one Suspense boundary shape. */
function Lazy({ el }) {
  return <Suspense fallback={<RouteLoader />}>{el}</Suspense>;
}

/**
 * The public website shell.
 *
 * SiteDataProvider fetches company, contact, social and service data from
 * Supabase once and falls back to the static config in src/config/site.js
 * whenever the database cannot answer — so the site renders identically to
 * before with no credentials set.
 *
 * Seo moved inside this shell rather than sitting above <Routes>, because the
 * admin panel is not a public page and should not have marketing meta tags,
 * canonical URLs or GeneralContractor JSON-LD written into its head.
 */
function PublicShell() {
  return (
    <SiteDataProvider>
      <Seo />
      <ErrorBoundary>
        <Layout />
      </ErrorBoundary>
    </SiteDataProvider>
  );
}

/* Both future flags are React Router 7 defaults. Opting in now silences the
   v6 deprecation warnings that otherwise appear in the console on load. */
export default function App() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        {/* ---- Admin panel ----
            Mounted outside the public shell so it gets no site header,
            footer or SEO tags. Everything behind it requires a Supabase
            session plus an active row in admin_users. */}
        <Route path="/admin/*" element={<Lazy el={<AdminApp />} />} />

        <Route element={<PublicShell />}>
          <Route path="/" element={<Home />} />

          {/* ---- Company ---- */}
          <Route path="/who-we-are" element={<Lazy el={<WhoWeAre />} />} />
          <Route path="/leadership" element={<Lazy el={<Leadership />} />} />
          <Route
            path="/role-definition"
            element={<Lazy el={<RoleDefinition />} />}
          />
          <Route
            path="/subcontractors"
            element={<Lazy el={<Subcontractors />} />}
          />
          <Route
            path="/international"
            element={<Lazy el={<International />} />}
          />
          <Route path="/affiliates" element={<Lazy el={<Affiliates />} />} />

          {/* ---- Services ---- */}
          <Route
            path="/residential-construction"
            element={<Lazy el={<ResidentialConstruction />} />}
          />
          <Route
            path="/commercial-construction"
            element={<Lazy el={<CommercialConstruction />} />}
          />
          <Route
            path="/renovation-remodelling"
            element={<Lazy el={<RenovationRemodelling />} />}
          />
          <Route
            path="/design-architecture"
            element={<Lazy el={<DesignArchitecture />} />}
          />
          <Route
            path="/grey-structure"
            element={<Lazy el={<GreyStructure />} />}
          />
          <Route
            path="/turnkey-construction"
            element={<Lazy el={<TurnkeyConstruction />} />}
          />
          <Route
            path="/project-management"
            element={<Lazy el={<ProjectManagement />} />}
          />

          {/* ---- Projects ---- */}
          <Route path="/projects" element={<Lazy el={<Projects />} />} />
          <Route
            path="/project-detail"
            element={<Lazy el={<ProjectDetail />} />}
          />
          <Route
            path="/project-showcase"
            element={<Lazy el={<ProjectShowcase />} />}
          />

          {/* ---- Process & information ---- */}
          <Route path="/our-process" element={<Lazy el={<OurProcess />} />} />
          <Route path="/locations" element={<Lazy el={<Locations />} />} />
          <Route path="/cost-index" element={<Lazy el={<CostIndex />} />} />
          <Route path="/faq" element={<Lazy el={<Faq />} />} />

          {/* ---- Conversion ---- */}
          <Route path="/contact-us" element={<Lazy el={<ContactUs />} />} />
          <Route
            path="/consultation"
            element={<Lazy el={<Consultation />} />}
          />

          {/* ---- Legal ---- */}
          <Route
            path="/privacy-policy"
            element={<Lazy el={<PrivacyPolicy />} />}
          />
          <Route path="/terms" element={<Lazy el={<Terms />} />} />

          {/* ---- Legacy URL redirects ----
              `/market-sectors` was the portfolio route, but the label matched
              neither its content nor the documented sitemap. It now redirects
              to `/projects` so existing links and bookmarks keep working. */}
          <Route
            path="/market-sectors"
            element={<Navigate to="/projects" replace />}
          />
          <Route path="/about" element={<Navigate to="/who-we-are" replace />} />
          <Route
            path="/contact"
            element={<Navigate to="/contact-us" replace />}
          />
          <Route
            path="/services"
            element={<Navigate to="/projects" replace />}
          />

          {/* ---- 404 ----
              Previously `path="*"` rendered the About page, which masked
              broken links and created duplicate indexable content. */}
          <Route path="*" element={<Lazy el={<NotFound />} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
