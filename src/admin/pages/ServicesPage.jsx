import { Link } from "react-router-dom";
import ResourceManager from "../components/ResourceManager";
import { services } from "../../services/content";
import { clearPublicCache } from "../../services/publicData";
import { Pill } from "../components/ui";

/**
 * SERVICES — the cards on the homepage and /services, and the links in the
 * header dropdown and footer.
 *
 * A service's own page (its hero, lists, call to action) is edited in
 * Pages, the section builder. This screen controls the card and whether the
 * service is offered at all.
 *
 * Documentation rule: a service is only published once Siraj Builders has
 * confirmed it actually delivers it. Unpublishing a service here also hides
 * it from navigation; unpublish its page in SEO & publishing as well.
 */

const fresh = (fn) => async (...args) => {
  const result = await fn(...args);
  clearPublicCache();
  return result;
};

export default function ServicesPage() {
  return (
    <ResourceManager
      title="Services"
      singular="Service"
      entity="services"
      description="Service cards and navigation links. Publish a service only once it is confirmed as offered. To edit the wording of a service's own page, use “Edit page”."
      load={services.listAll}
      create={fresh(services.create)}
      update={fresh(services.update)}
      remove={fresh(services.remove)}
      reorder={fresh(services.reorder)}
      toggle={{ field: "is_active", on: "Publish", off: "Unpublish" }}
      labelOf={(row) => row.label}
      searchKeys={["label", "slug", "path", "title", "summary"]}
      renderExtraActions={(row) => (
        <Link className="ad-btn ad-btn-ghost ad-btn-sm" to={`/admin/builder?page=${encodeURIComponent(row.path)}`}>
          Edit page
        </Link>
      )}
      columns={[
        {
          key: "label",
          label: "Service",
          render: (row) => (
            <div className="ad-cell-media">
              {row.image_url ? <img src={row.image_url} alt="" loading="lazy" /> : <span className="ad-cell-media-empty">—</span>}
              <div>
                <div className="ad-cell-strong">{row.label}</div>
                <div className="ad-cell-muted">{row.path}</div>
              </div>
            </div>
          ),
        },
        {
          key: "is_confirmed",
          label: "Confirmed",
          render: (row) => (row.is_confirmed ? <Pill tone="ok">Confirmed</Pill> : <Pill tone="new">To confirm</Pill>),
        },
        {
          key: "is_active",
          label: "Website",
          render: (row) =>
            row.is_active ? (
              <Pill tone="ok">{row.show_in_nav ? "Live · in menu" : "Live"}</Pill>
            ) : (
              <Pill tone="off">Hidden</Pill>
            ),
        },
      ]}
      defaults={{
        slug: "",
        path: "",
        label: "",
        title: "",
        summary: "",
        cta_label: "",
        image_url: "",
        is_confirmed: false,
        is_active: false,
        show_in_nav: true,
      }}
      validate={(values) => {
        const errors = {};
        if (values.path && !String(values.path).startsWith("/")) errors.path = "Start with a slash, e.g. /residential-construction";
        if (values.is_active && !values.is_confirmed) {
          errors.is_active = "Confirm the service is offered before publishing it.";
        }
        return errors;
      }}
      fields={[
        { type: "heading", label: "Card" },
        { name: "label", label: "Service name", required: true, help: "Used in the menu and as the card title." },
        { name: "summary", label: "Card description", type: "textarea", rows: 3 },
        { name: "cta_label", label: "Card link text", help: "e.g. Explore Residential Construction" },
        { name: "image_url", label: "Card image", type: "media", folder: "services" },
        { type: "heading", label: "Address", help: "The page address must match an existing page of the website." },
        { name: "path", label: "Page address", required: true, help: "e.g. /residential-construction" },
        { name: "slug", label: "Slug", required: true, help: "The address without the slash." },
        { name: "title", label: "Internal heading", help: "Kept for reference; the page heading itself is edited in Pages." },
        { type: "heading", label: "Publishing" },
        {
          name: "is_confirmed",
          label: "Siraj Builders has confirmed it offers this service",
          type: "checkbox",
        },
        { name: "is_active", label: "Published on the website", type: "checkbox" },
        { name: "show_in_nav", label: "Show in the header and footer menus", type: "checkbox" },
      ]}
    />
  );
}
