import ResourceManager from "../components/ResourceManager";
import { team } from "../../services/content";
import { Pill } from "../components/ui";

export default function TeamPage() {
  return (
    <ResourceManager
      title="Project roles"
      singular="Member profile"
      entity="team_members"
      description="Manage the member cards in About → Project roles. Add profiles, edit their details, publish or hide them, reorder the cards, or delete a profile. Published cards open a popup with the full biography, photo and LinkedIn link."
      emptyTitle="No project role profiles yet"
      emptyBody="Add a member profile to show a card in the About page's Project roles section."
      load={team.listAll}
      reorder={team.reorder}
      toggle={{ field: "is_active", on: "Show", off: "Hide" }}
      create={team.create}
      update={team.update}
      remove={team.remove}
      labelOf={(row) => row.name}
      searchKeys={["name", "role", "bio"]}
      columns={[
        { key: "name", label: "Name", render: (row) => (
          <>
            <div className="ad-cell-strong">{row.name}</div>
            <div className="ad-cell-muted">{row.role}</div>
          </>
        ) },
        { key: "bio", label: "Biography", render: (row) => <div className="ad-cell-clamp">{row.bio}</div> },
        { key: "is_active", label: "Live", render: (row) =>
          row.is_active ? <Pill tone="ok">Live</Pill> : <Pill tone="off">Hidden</Pill> },
      ]}
      defaults={{ name: "", role: "", bio: "", image_url: "", linkedin_url: "", is_active: true, sort_order: 0 }}
      fields={[
        { name: "name", label: "Full name", required: true },
        { name: "role", label: "Role or title" },
        { name: "linkedin_url", label: "LinkedIn URL", type: "url" },
        { name: "sort_order", label: "Sort order", type: "number" },
        { name: "bio", label: "Full biography / details", type: "textarea", rows: 6, help: "This complete description appears in the member's popup." },
        { name: "image_url", label: "Photo URL", type: "media" },
        { name: "is_active", label: "Show on the website", type: "checkbox" },
      ]}
    />
  );
}
