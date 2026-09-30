import ResourceManager from "../components/ResourceManager";
import { pages } from "../../services/content";
import { Alert, Pill } from "../components/ui";

/**
 * PAGE CONTENT
 * ----------------------------------------------------------------------------
 * The 17 content-driven pages — every route that renders through
 * ContentPage.jsx. Each row supplies the hero copy, the approach section and
 * the numbered points grid for one path.
 *
 * `path` is editable but must match a route registered in App.jsx. Editing it
 * to something unrouted does not break the site — the page simply stops being
 * found and the route falls back to its hardcoded copy — but it is a quiet
 * way to lose an edit, hence the warning on the field.
 *
 * `points` is a jsonb array in the database and a newline-separated textarea
 * in the form, because asking a non-technical admin to write valid JSON to
 * add a bullet point would be a poor trade.
 */
export default function PagesPage() {
  return (
    <>
      <Alert tone="info" title="Editing page content">
        These are the 17 content-driven pages. Bespoke pages — the homepage,
        FAQ, consultation, commercial construction and affiliates — own their
        layouts and are managed through their own sections.
      </Alert>

      <ResourceManager
        title="Pages"
        singular="Page"
        entity="pages"
        description="Hero copy, approach section and points grid for each content page. Changes appear on the website as soon as the visitor reloads."
        load={pages.listAll}
        create={pages.create}
        update={pages.update}
        remove={pages.remove}
        labelOf={(row) => row.path}
        searchKeys={["path", "eyebrow", "title", "heading", "body"]}
        columns={[
          {
            key: "path",
            label: "Page",
            render: (row) => (
              <>
                <div className="ad-cell-strong">{row.path}</div>
                <div className="ad-cell-muted">{row.eyebrow}</div>
              </>
            ),
          },
          {
            key: "title",
            label: "Hero heading",
            render: (row) => <div className="ad-cell-clamp">{row.title}</div>,
          },
          {
            key: "points",
            label: "Points",
            render: (row) => (Array.isArray(row.points) ? row.points.length : 0),
          },
          {
            key: "is_published",
            label: "Published",
            render: (row) =>
              row.is_published ? (
                <Pill tone="ok">Published</Pill>
              ) : (
                <Pill tone="off">Draft</Pill>
              ),
          },
        ]}
        defaults={{
          path: "",
          eyebrow: "",
          title: "",
          intro: "",
          image_url: "",
          heading: "",
          body: "",
          points: "",
          motif: "",
          is_published: true,
          sort_order: 0,
        }}
        fields={[
          {
            name: "path",
            label: "Route path",
            required: true,
            help: "Must match a route in App.jsx, e.g. /who-we-are",
          },
          { name: "sort_order", label: "Sort order", type: "number" },
          {
            name: "eyebrow",
            label: "Eyebrow",
            help: "Small label above the hero heading, also used in the breadcrumb.",
          },
          {
            name: "motif",
            label: "Hero motif",
            help: "Optional. Leave blank to use the motif matched to the eyebrow.",
          },
          { name: "title", label: "Hero heading", type: "textarea", rows: 2, required: true },
          { name: "intro", label: "Hero intro", type: "textarea", rows: 3 },
          { name: "image_url", label: "Hero image URL", type: "media" },
          { name: "heading", label: "Section heading", type: "textarea", rows: 2 },
          { name: "body", label: "Section body", type: "textarea", rows: 4 },
          {
            name: "points",
            label: "Points",
            type: "textarea",
            rows: 5,
            help: "One per line. Each becomes a numbered card in the grid.",
          },
          { name: "is_published", label: "Published", type: "checkbox" },
        ]}
        /* jsonb array → newline text for editing */
        mapRowToForm={(values, row) => ({
          ...values,
          points: Array.isArray(row.points) ? row.points.join("\n") : "",
          motif: row.motif || "",
        })}
        /* newline text → jsonb array on save */
        beforeSave={(values) => ({
          ...values,
          motif: values.motif ? values.motif : null,
          points: String(values.points || "")
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        })}
      />
    </>
  );
}
