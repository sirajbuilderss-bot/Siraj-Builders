import ResourceManager from "../components/ResourceManager";
import { heroSlides } from "../../services/content";
import { Pill } from "../components/ui";

/**
 * The homepage carousel. If every slide is deactivated the slider falls back
 * to the original four hardcoded slides rather than rendering an empty hero —
 * see the fallback rule in hooks/useContent.js.
 */
export default function HeroSlidesPage() {
  return (
    <ResourceManager
      title="Hero slides"
      singular="Slide"
      entity="hero_slides"
      description="The homepage carousel. The first slide's heading is rendered as the page H1, so it carries the most SEO weight."
      load={heroSlides.listAll}
      reorder={heroSlides.reorder}
      toggle={{ field: "is_active", on: "Show", off: "Hide" }}
      create={heroSlides.create}
      update={heroSlides.update}
      remove={heroSlides.remove}
      labelOf={(row) => row.title}
      searchKeys={["title", "eyebrow", "lead"]}
      columns={[
        { key: "title", label: "Slide", render: (row) => (
          <>
            <div className="ad-cell-muted">{row.eyebrow}</div>
            <div className="ad-cell-strong">{row.title}</div>
          </>
        ) },
        { key: "lead", label: "Lead", render: (row) => <div className="ad-cell-clamp">{row.lead}</div> },
        { key: "sort_order", label: "Order" },
        { key: "is_active", label: "Live", render: (row) =>
          row.is_active ? <Pill tone="ok">Live</Pill> : <Pill tone="off">Hidden</Pill> },
      ]}
      defaults={{
        eyebrow: "", title: "", lead: "", image_url: "",
        primary_label: "", primary_to: "", secondary_label: "", secondary_to: "",
        is_active: true, sort_order: 0,
      }}
      fields={[
        { name: "eyebrow", label: "Eyebrow", help: "Small label above the heading, e.g. 01 · Residential Construction" },
        { name: "sort_order", label: "Sort order", type: "number" },
        { name: "title", label: "Heading", type: "textarea", rows: 2, required: true },
        { name: "lead", label: "Lead paragraph", type: "textarea", rows: 3 },
        { name: "image_url", label: "Background image URL", type: "media" },
        { name: "primary_label", label: "Primary button label" },
        { name: "primary_to", label: "Primary button link", help: "Internal path, e.g. /consultation" },
        { name: "secondary_label", label: "Secondary button label" },
        { name: "secondary_to", label: "Secondary button link" },
        { name: "is_active", label: "Show in the carousel", type: "checkbox" },
      ]}
    />
  );
}
