import ResourceManager from "../components/ResourceManager";
import { testimonials } from "../../services/content";
import { Pill } from "../components/ui";

/**
 * Publishing requires BOTH is_active and is_verified. That is deliberate —
 * the project documentation states only verified testimonials may appear, and
 * two independent flags make it impossible to publish an unverified quote by
 * ticking one box out of habit.
 */
export default function TestimonialsPage() {
  return (
    <ResourceManager
      title="Testimonials"
      singular="Testimonial"
      entity="testimonials"
      description="A testimonial appears on the website only when it is both active AND verified. Collect the client's permission before marking anything verified."
      emptyTitle="No testimonials yet"
      emptyBody="Only verified client testimonials should be added. Ask about communication, quality, site management, responsiveness and the final result."
      load={testimonials.listAll}
      create={testimonials.create}
      update={testimonials.update}
      remove={testimonials.remove}
      labelOf={(row) => row.client_name}
      searchKeys={["client_name", "quote", "project_type", "location"]}
      columns={[
        { key: "client_name", label: "Client", render: (row) => (
          <>
            <div className="ad-cell-strong">{row.client_name}</div>
            <div className="ad-cell-muted">{row.project_type} {row.location && `· ${row.location}`}</div>
          </>
        ) },
        { key: "quote", label: "Quote", render: (row) => <div className="ad-cell-clamp">{row.quote}</div> },
        { key: "is_verified", label: "Status", render: (row) =>
          row.is_verified && row.is_active
            ? <Pill tone="ok">Published</Pill>
            : row.is_verified
              ? <Pill tone="off">Verified, hidden</Pill>
              : <Pill tone="new">Unverified</Pill> },
      ]}
      defaults={{
        quote: "", client_name: "", project_type: "", location: "",
        image_url: "", is_verified: false, is_active: true, sort_order: 0,
      }}
      fields={[
        { name: "client_name", label: "Client name", required: true },
        { name: "project_type", label: "Project type" },
        { name: "location", label: "Location" },
        { name: "sort_order", label: "Sort order", type: "number" },
        { name: "quote", label: "Testimonial", type: "textarea", rows: 4, required: true, minLength: 20 },
        { name: "image_url", label: "Client photo URL", type: "media" },
        { name: "is_verified", label: "Verified with the client", type: "checkbox",
          help: "Required before this can appear on the website." },
        { name: "is_active", label: "Active", type: "checkbox" },
      ]}
    />
  );
}
