import ResourceManager from "../components/ResourceManager";
import { services } from "../../services/content";
import { Pill } from "../components/ui";

/**
 * `is_confirmed` is carried over from the original site.js convention: four
 * of the seven services were marked unconfirmed in the project documentation,
 * and unconfirmed services are presented differently rather than being
 * silently treated as offered. Deleting the flag would quietly change what
 * the site claims about the business.
 */
export default function ServicesPage() {
  return (
    <ResourceManager
      title="Services"
      singular="Service"
      entity="services"
      description="Services listed in the header dropdown and footer. The confirmed flag marks services verified as offered — unconfirmed ones remain routed but flagged."
      load={services.listAll}
      create={services.create}
      update={services.update}
      remove={services.remove}
      labelOf={(row) => row.label}
      searchKeys={["label", "slug", "path", "title"]}
      columns={[
        {
          key: "label",
          label: "Service",
          render: (row) => (
            <>
              <div className="ad-cell-strong">{row.label}</div>
              <div className="ad-cell-muted">{row.path}</div>
            </>
          ),
        },
        {
          key: "is_confirmed",
          label: "Confirmed",
          render: (row) =>
            row.is_confirmed ? <Pill tone="ok">Confirmed</Pill> : <Pill tone="new">To confirm</Pill>,
        },
        {
          key: "show_in_nav",
          label: "In navigation",
          render: (row) => (row.show_in_nav ? "Yes" : "No"),
        },
        { key: "sort_order", label: "Order" },
      ]}
      defaults={{
        slug: "", path: "", label: "", title: "", summary: "", image_url: "",
        is_confirmed: false, is_active: true, show_in_nav: true, sort_order: 0,
      }}
      fields={[
        { name: "label", label: "Navigation label", required: true },
        { name: "path", label: "Route path", required: true, help: "Must match a route in App.jsx, e.g. /residential-construction" },
        { name: "slug", label: "Slug", required: true },
        { name: "sort_order", label: "Sort order", type: "number" },
        { name: "title", label: "Page heading", type: "textarea", rows: 2 },
        { name: "summary", label: "Summary", type: "textarea", rows: 3 },
        { name: "image_url", label: "Image URL", type: "media" },
        { name: "is_confirmed", label: "Service confirmed as offered", type: "checkbox",
          help: "Leave unchecked until the business has confirmed it delivers this service." },
        { name: "show_in_nav", label: "Show in header and footer navigation", type: "checkbox" },
        { name: "is_active", label: "Active", type: "checkbox" },
      ]}
    />
  );
}
