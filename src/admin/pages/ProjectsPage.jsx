import ResourceManager from "../components/ResourceManager";
import ProjectMediaManager from "../components/ProjectMediaManager";
import { projects } from "../../services/content";
import { clearPublicCache } from "../../services/publicData";
import { Pill } from "../components/ui";
import DEFAULTS from "../../content/defaults.json";

const CATEGORIES = ["Residential", "Commercial", "Renovation", "Design & Build"];

/**
 * PROJECTS — portfolio case studies.
 *
 * The form follows the documented case-study template in order:
 *   basics → project details → story (requirement → challenge → solution →
 *   construction approach → quality & management → result) → feedback → SEO
 * and, once the project has been saved, a media manager for its photos and
 * videos (uploads go to Supabase Storage, or paste a link).
 *
 * Only verified work should be published — "Show on the live site" stays
 * off until the case study is complete.
 */

const linesToArray = (text) =>
  String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
const arrayToLines = (value) => (Array.isArray(value) ? value.join("\n") : "");
const commasToArray = (text) =>
  String(text || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
const arrayToCommas = (value) => (Array.isArray(value) ? value.join(", ") : "");
const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const SERVICE_OPTIONS = [
  { value: "", label: "— None —" },
  ...DEFAULTS.services.map((s) => ({ value: s.slug, label: s.title })),
];

const withCacheClear = (fn) => async (...args) => {
  const result = await fn(...args);
  clearPublicCache();
  return result;
};

export default function ProjectsPage() {
  return (
    <ResourceManager
      title="Projects"
      singular="Project"
      entity="projects"
      description="Case studies shown on /projects and /projects/<slug>. The website follows the order set here. Keep a project hidden until its case study is complete and verified."
      emptyTitle="No projects yet"
      emptyBody="The portfolio shows its honest empty state until the first project is published. Add only real, verified work."
      load={projects.listAll}
      create={withCacheClear(projects.create)}
      update={withCacheClear(projects.update)}
      remove={withCacheClear(projects.remove)}
      reorder={withCacheClear(projects.reorder)}
      toggle={{ field: "is_active", on: "Publish", off: "Hide" }}
      stayOpenAfterCreate
      wideModal
      labelOf={(row) => row.title}
      searchKeys={["title", "slug", "location", "category", "short_description", "client_name"]}
      filters={[
        { key: "live", label: "Live", test: (row) => row.is_active },
        { key: "hidden", label: "Hidden", test: (row) => !row.is_active },
        { key: "featured", label: "Featured", test: (row) => row.is_featured },
      ]}
      renderFormExtras={(row, { toast, markChanged }) => (
        <ProjectMediaManager project={row} toast={toast} onProjectChanged={markChanged} />
      )}
      columns={[
        {
          key: "title",
          label: "Project",
          render: (row) => (
            <div className="ad-cell-media">
              {row.image_url ? (
                <img src={row.image_url} alt="" loading="lazy" />
              ) : (
                <span className="ad-cell-media-empty" aria-hidden="true">—</span>
              )}
              <div>
                <div className="ad-cell-strong">
                  {row.title} {row.is_featured ? <Pill tone="new">Featured</Pill> : null}
                </div>
                <div className="ad-cell-muted">/projects/{row.slug}</div>
              </div>
            </div>
          ),
        },
        { key: "category", label: "Type" },
        { key: "location", label: "Location" },
        {
          key: "status",
          label: "Status",
          render: (row) => [row.status, row.year].filter(Boolean).join(" · ") || "—",
        },
        {
          key: "is_active",
          label: "Website",
          render: (row) => (row.is_active ? <Pill tone="ok">Live</Pill> : <Pill tone="off">Hidden</Pill>),
        },
      ]}
      defaults={{
        slug: "",
        title: "",
        category: "Residential",
        service_slug: "",
        location: "",
        status: "Completed",
        year: "",
        area: "",
        timeline: "",
        scope: "",
        client_name: "",
        completion_date: "",
        banner_url: "",
        short_description: "",
        full_description: "",
        features: "",
        tags: "",
        requirement: "",
        challenge: "",
        solution: "",
        approach: "",
        quality: "",
        result: "",
        client_feedback: "",
        feedback_verified: false,
        seo_title: "",
        seo_description: "",
        is_active: false,
        is_featured: false,
      }}
      mapRowToForm={(form) => ({
        ...form,
        features: arrayToLines(form.features),
        tags: arrayToCommas(form.tags),
        completion_date: form.completion_date || "",
      })}
      validate={(values) => {
        const errors = {};
        const slug = slugify(values.slug || values.title);
        if (!slug) errors.slug = "Enter a URL slug, e.g. gulberg-residence";
        if (values.is_active && String(values.short_description || "").trim().length < 20) {
          errors.short_description = "A published project needs a short description for its card.";
        }
        if (values.feedback_verified && !String(values.client_feedback || "").trim()) {
          errors.client_feedback = "Add the client's words, or untick “verified”.";
        }
        return errors;
      }}
      fields={[
        { type: "heading", label: "Basics", help: "Name, type and where it appears." },
        { name: "title", label: "Project name", required: true },
        {
          name: "slug",
          label: "URL slug",
          help: "Lowercase words joined by hyphens. Leave blank to build it from the name. The page will be /projects/<slug>.",
        },
        {
          name: "category",
          label: "Project type",
          type: "select",
          required: true,
          options: CATEGORIES.map((c) => ({ value: c, label: c })),
        },
        {
          name: "service_slug",
          label: "Related service",
          type: "select",
          options: SERVICE_OPTIONS,
          help: "Adds an “Explore the service behind this project” link.",
        },
        {
          name: "short_description",
          label: "Card description",
          type: "textarea",
          rows: 3,
          help: "40–60 words. Shown on the project card and under the case-study title.",
        },

        { type: "heading", label: "Project details", help: "Shown in the details panel. Leave any field blank to hide it." },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "Completed", label: "Completed" },
            { value: "Ongoing", label: "Ongoing" },
          ],
        },
        { name: "year", label: "Year", help: "e.g. 2025" },
        { name: "location", label: "Location" },
        { name: "area", label: "Area", help: "e.g. 10 marla, 2,400 sq ft" },
        { name: "timeline", label: "Timeline", help: "e.g. 14 months" },
        { name: "scope", label: "Scope", help: "e.g. Grey structure and finishing" },
        { name: "client_name", label: "Client name", help: "Only with the client's permission." },
        { name: "completion_date", label: "Completion date", type: "date", help: "Leave blank for ongoing work." },

        { type: "heading", label: "The case study", help: "Client requirement → challenge → approach → execution → result. Use real, verified details only." },
        { name: "full_description", label: "Project overview", type: "textarea", rows: 4 },
        { name: "requirement", label: "The client requirement", type: "textarea", rows: 3 },
        { name: "challenge", label: "The challenge", type: "textarea", rows: 3 },
        { name: "solution", label: "Our solution", type: "textarea", rows: 3 },
        { name: "approach", label: "Construction approach", type: "textarea", rows: 3 },
        { name: "quality", label: "Quality & management", type: "textarea", rows: 3 },
        { name: "result", label: "The result", type: "textarea", rows: 3 },
        { name: "features", label: "Key features", type: "textarea", rows: 4, help: "One per line, e.g. Basement parking" },

        { type: "heading", label: "Client feedback" },
        { name: "client_feedback", label: "What the client said", type: "textarea", rows: 3 },
        {
          name: "feedback_verified",
          label: "This feedback is genuine and the client agreed to publish it",
          type: "checkbox",
          help: "Feedback only appears on the website when this is ticked.",
        },

        { type: "heading", label: "Cover image & SEO" },
        {
          name: "banner_url",
          label: "Wide cover image (optional)",
          type: "media",
          folder: "projects",
          help: "Only if the top of the case study should use a different photo from the featured photo.",
        },
        { name: "seo_title", label: "SEO title", help: "Leave blank to use “<Project> | <Type> Project | Siraj Builders”." },
        { name: "seo_description", label: "SEO description", type: "textarea", rows: 2, help: "Leave blank to use the card description." },
        { name: "tags", label: "Internal tags", help: "Comma separated. Not shown on the website." },

        { type: "heading", label: "Publishing" },
        { name: "is_featured", label: "Feature this project", type: "checkbox", help: "Adds a Featured badge to the project card." },
        { name: "is_active", label: "Show on the live site", type: "checkbox", help: "Keep off until the case study is complete." },
      ]}
      beforeSave={(values) => ({
        ...values,
        slug: slugify(values.slug || values.title),
        features: linesToArray(values.features),
        tags: commasToArray(values.tags),
        completion_date: values.completion_date ? values.completion_date : null,
        // `summary` predates short_description; keep both in step.
        summary: values.short_description || "",
      })}
    />
  );
}
