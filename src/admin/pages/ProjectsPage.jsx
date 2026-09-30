import ResourceManager from "../components/ResourceManager";
import { projects } from "../../services/content";
import { Alert, Pill } from "../components/ui";

const CATEGORIES = ["Residential", "Commercial", "Renovation", "Design & Build"];

/**
 * Projects are the portfolio case studies. The site's documentation is
 * explicit that only verified work may be published, which is why the table
 * ships empty and why `is_active` exists — a half-written case study can be
 * saved and kept off the live site until it is ready.
 *
 * `features`, `tags` and `gallery` are jsonb arrays in the database and plain
 * textareas in this form. mapRowToForm converts on the way in, beforeSave
 * converts on the way out. Asking a non-technical admin to type valid JSON to
 * add a bullet point would be a poor trade.
 */

/* ---- jsonb array <-> text ---- */

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

export default function ProjectsPage() {
  return (
    <>
      <Alert tone="info" title="Images and video">
        Nothing is uploaded here. Host the file somewhere public — Google Drive,
        Cloudinary, YouTube, Vimeo or any image host — and paste the link. Each
        URL field previews what it finds, so a wrong link is obvious before you
        save.
      </Alert>

      <ResourceManager
        title="Projects"
        singular="Project"
        entity="projects"
        description="Case studies shown on /projects and /project-detail. Deactivate a project to keep it out of the live portfolio without deleting it."
        emptyTitle="No projects yet"
        emptyBody="The portfolio page shows its documented empty state until the first project is added. Add only verified work."
        load={projects.listAll}
        create={projects.create}
        update={projects.update}
        remove={projects.remove}
        labelOf={(row) => row.title}
        searchKeys={[
          "title",
          "slug",
          "location",
          "category",
          "summary",
          "client_name",
          "short_description",
        ]}
        columns={[
          {
            key: "title",
            label: "Project",
            render: (row) => (
              <>
                <div className="ad-cell-strong">
                  {row.title}
                  {row.is_featured ? (
                    <>
                      {" "}
                      <Pill tone="new">Featured</Pill>
                    </>
                  ) : null}
                </div>
                <div className="ad-cell-muted">/{row.slug}</div>
              </>
            ),
          },
          { key: "category", label: "Category" },
          { key: "client_name", label: "Client" },
          { key: "location", label: "Location" },
          { key: "year", label: "Year" },
          {
            key: "is_active",
            label: "Live",
            render: (row) =>
              row.is_active ? <Pill tone="ok">Live</Pill> : <Pill tone="off">Hidden</Pill>,
          },
        ]}
        defaults={{
          slug: "",
          title: "",
          category: "Residential",
          location: "",
          status: "Completed",
          year: "",
          area: "",
          client_name: "",
          completion_date: "",
          image_url: "",
          banner_url: "",
          video_url: "",
          gallery: "",
          short_description: "",
          full_description: "",
          features: "",
          tags: "",
          summary: "",
          requirement: "",
          challenge: "",
          solution: "",
          result: "",
          is_active: true,
          is_featured: false,
          sort_order: 0,
        }}
        mapRowToForm={(form) => ({
          ...form,
          features: arrayToLines(form.features),
          gallery: arrayToLines(form.gallery),
          tags: arrayToCommas(form.tags),
          completion_date: form.completion_date || "",
        })}
        fields={[
          { name: "title", label: "Project name", required: true },
          {
            name: "slug",
            label: "URL slug",
            required: true,
            help: "Lowercase, hyphenated. Used as /project-detail?project=slug",
          },
          {
            name: "category",
            label: "Category",
            type: "select",
            required: true,
            options: CATEGORIES.map((c) => ({ value: c, label: c })),
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "Completed", label: "Completed" },
              { value: "Ongoing", label: "Ongoing" },
            ],
          },

          { name: "client_name", label: "Client name", help: "Only with the client's permission." },
          { name: "location", label: "Location" },
          {
            name: "completion_date",
            label: "Completion date",
            type: "date",
            help: "Leave blank for ongoing work.",
          },
          { name: "year", label: "Year", help: "Shown on the card. e.g. 2025" },
          { name: "area", label: "Area", help: "e.g. 10 marla, 2,400 sq ft" },
          { name: "sort_order", label: "Sort order", type: "number" },

          {
            name: "image_url",
            label: "Thumbnail URL",
            type: "media",
            help: "The image on the portfolio card. Landscape works best.",
          },
          {
            name: "banner_url",
            label: "Banner URL",
            type: "media",
            help: "The wide image at the top of the case study page.",
          },
          {
            name: "video_url",
            label: "Video URL",
            type: "media",
            kind: "video",
            help: "YouTube or Vimeo link. Optional.",
          },
          {
            name: "gallery",
            label: "Gallery URLs",
            type: "textarea",
            rows: 4,
            help: "One image URL per line.",
          },

          {
            name: "short_description",
            label: "Short description",
            type: "textarea",
            rows: 3,
            help: "40–60 words. Shown on the portfolio card.",
          },
          {
            name: "full_description",
            label: "Full description",
            type: "textarea",
            rows: 5,
            help: "The opening passage of the case study page.",
          },
          {
            name: "features",
            label: "Features",
            type: "textarea",
            rows: 5,
            help: "One per line. e.g. Basement parking",
          },
          {
            name: "tags",
            label: "Tags",
            help: "Separated by commas. e.g. turnkey, 10 marla, Narowal",
          },

          { name: "requirement", label: "Client requirement", type: "textarea", rows: 3 },
          { name: "challenge", label: "Challenge", type: "textarea", rows: 3 },
          { name: "solution", label: "Our approach", type: "textarea", rows: 3 },
          { name: "result", label: "Result", type: "textarea", rows: 3 },

          {
            name: "is_featured",
            label: "Feature this project",
            type: "checkbox",
            help: "Featured projects carry a badge and sort to the front of the portfolio.",
          },
          {
            name: "is_active",
            label: "Show on the live site",
            type: "checkbox",
            help: "Uncheck to keep this project saved but hidden from visitors.",
          },
        ]}
        beforeSave={(values) => ({
          ...values,
          slug: String(values.slug)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
          features: linesToArray(values.features),
          gallery: linesToArray(values.gallery),
          tags: commasToArray(values.tags),
          // An empty date input submits "", which Postgres rejects for a
          // `date` column. null is what "no completion date yet" means.
          completion_date: values.completion_date ? values.completion_date : null,
          // `summary` predates short_description and still feeds the older
          // card components. Keeping them in step means neither renders blank.
          summary: values.short_description || values.summary || "",
        })}
      />
    </>
  );
}
