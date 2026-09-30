import ResourceManager from "../components/ResourceManager";
import { stats } from "../../services/content";
import { Alert, Pill } from "../components/ui";

export default function StatsPage() {
  return (
    <>
      <Alert tone="info" title="Use verified numbers only">
        The project documentation is explicit that invented metrics must not be
        published. Add a statistic only once the underlying number can be
        evidenced — completed projects, years in operation, registrations.
      </Alert>

      <ResourceManager
        title="Statistics"
        singular="Statistic"
        entity="stats"
        description="Trust numbers for the homepage. Each one should be verifiable."
        emptyTitle="No statistics yet"
        emptyBody="The homepage currently shows brand pillars instead, which are positioning rather than unverifiable metrics."
        load={stats.listAll}
        create={stats.create}
        update={stats.update}
        remove={stats.remove}
        labelOf={(row) => row.label}
        searchKeys={["label", "value"]}
        columns={[
          { key: "value", label: "Value", render: (row) => (
            <span className="ad-cell-strong">{row.value}{row.suffix}</span>
          ) },
          { key: "label", label: "Label" },
          { key: "is_active", label: "Live", render: (row) =>
            row.is_active ? <Pill tone="ok">Live</Pill> : <Pill tone="off">Hidden</Pill> },
        ]}
        defaults={{ label: "", value: "", suffix: "", is_active: true, sort_order: 0 }}
        fields={[
          { name: "value", label: "Value", required: true, help: "e.g. 42" },
          { name: "suffix", label: "Suffix", help: "e.g. + or %" },
          { name: "label", label: "Label", required: true, help: "e.g. Projects completed" },
          { name: "sort_order", label: "Sort order", type: "number" },
          { name: "is_active", label: "Show on the website", type: "checkbox" },
        ]}
      />
    </>
  );
}
