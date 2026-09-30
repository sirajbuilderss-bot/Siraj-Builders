import { useCallback, useEffect, useState } from "react";
import {
  listSubmissions,
  deleteSubmission,
  updateSubmission,
  exportSubmissions,
} from "../../services/submissions";
import {
  exportSubmissionPdf,
  exportSubmissionsPdf,
  exportSubmissionsCsv,
} from "../../services/export";
import { log } from "../../services/activity";
import {
  Alert,
  Confirm,
  Empty,
  Loading,
  Modal,
  Pill,
  Toast,
  formatDate,
  useToast,
} from "../components/ui";

const PER_PAGE = 20;

const STATUS_TONE = {
  new: "new",
  contacted: undefined,
  qualified: "ok",
  closed: "off",
  spam: "danger",
};

const STATUSES = ["new", "contacted", "qualified", "closed", "spam"];

const DETAIL_FIELDS = [
  ["form_type", "Form"],
  ["name", "Full name"],
  ["phone", "Phone"],
  ["email", "Email"],
  ["project_type", "Project type"],
  ["service", "Service"],
  ["location", "Property location"],
  ["size", "Property size"],
  ["budget", "Budget"],
  ["start_date", "Expected start"],
  ["source_page", "Submitted from"],
];

export default function SubmissionsPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [formType, setFormType] = useState("all");
  const [status, setStatus] = useState("all");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [notes, setNotes] = useState("");

  const toast = useToast();

  /* Typing in the search box should not fire a request per keystroke. */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listSubmissions({
        page,
        perPage: PER_PAGE,
        search: debouncedSearch,
        formType,
        status,
      });
      setRows(result.rows);
      setTotal(result.total ?? result.rows.length);
      setError("");
    } catch (err) {
      setError(
        err?.message ||
          "Could not load submissions. Check your Supabase connection and that database/schema.sql has been run."
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, formType, status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /* ------------------------------------------------------------- actions */

  async function openDetail(row) {
    setViewing(row);
    setNotes(row.admin_notes || "");

    // Opening an enquiry is what marks it read — no separate button needed.
    if (!row.is_read) {
      try {
        await updateSubmission(row.id, { is_read: true });
        setRows((prev) =>
          prev.map((item) =>
            item.id === row.id ? { ...item, is_read: true } : item
          )
        );
      } catch {
        /* Cosmetic only — never block the detail view on it. */
      }
    }
  }

  async function changeStatus(row, nextStatus) {
    try {
      await updateSubmission(row.id, { status: nextStatus });
      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, status: nextStatus } : item
        )
      );
      if (viewing?.id === row.id) {
        setViewing((prev) => ({ ...prev, status: nextStatus }));
      }
      log("update", "submissions", {
        entityId: row.id,
        summary: `Marked ${row.name}'s enquiry as ${nextStatus}`,
      });
      toast.show(`Marked as ${nextStatus}.`);
    } catch (err) {
      toast.show(err?.message || "Could not update status.", "error");
    }
  }

  async function saveNotes() {
    if (!viewing) return;
    try {
      await updateSubmission(viewing.id, { admin_notes: notes });
      setViewing((prev) => ({ ...prev, admin_notes: notes }));
      toast.show("Notes saved.");
    } catch (err) {
      toast.show(err?.message || "Could not save notes.", "error");
    }
  }

  async function confirmDelete() {
    setIsDeleting(true);
    try {
      await deleteSubmission(deleting.id);
      log("delete", "submissions", {
        entityId: deleting.id,
        summary: `Deleted enquiry from ${deleting.name}`,
      });
      toast.show("Submission deleted.");
      setDeleting(null);
      if (viewing?.id === deleting.id) setViewing(null);
      await refresh();
    } catch (err) {
      toast.show(err?.message || "Could not delete.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  /* ------------------------------------------------------------- exports */

  const filterLabel = [
    formType !== "all" ? formType : null,
    status !== "all" ? status : null,
    debouncedSearch ? `“${debouncedSearch}”` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  async function runExport(kind) {
    setIsExporting(true);
    try {
      const all = kind === "all";
      const data = await exportSubmissions(
        all
          ? { search: "", formType: "all", status: "all" }
          : { search: debouncedSearch, formType, status }
      );

      if (kind === "csv") {
        exportSubmissionsCsv(data, `siraj-submissions-${Date.now()}.csv`);
        toast.show(`${data.length} records exported to CSV.`);
      } else {
        await exportSubmissionsPdf(data, {
          title: all ? "All enquiry submissions" : "Filtered enquiry submissions",
          subtitle: all
            ? `${data.length} records`
            : `${data.length} records${filterLabel ? ` — ${filterLabel}` : ""}`,
          detailed: kind === "detailed",
        });
      }

      log("export", "submissions", {
        summary: `Exported ${data.length} submissions (${kind})`,
      });
    } catch (err) {
      toast.show(err?.message || "Export failed.", "error");
    } finally {
      setIsExporting(false);
    }
  }

  const lastPage = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <>
      <p className="ad-section-note">
        Every enquiry from the contact and consultation forms. Opening a record
        marks it as read. Exports respect the filters currently applied.
      </p>

      {error && (
        <Alert tone="error" title="Could not load submissions">
          {error}
        </Alert>
      )}

      <div className="ad-toolbar">
        <div className="ad-search">
          <input
            type="search"
            value={search}
            placeholder="Search name, phone, email, location or description…"
            aria-label="Search submissions"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={formType}
          aria-label="Filter by form"
          onChange={(event) => {
            setFormType(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All forms</option>
          <option value="contact">Contact</option>
          <option value="consultation">Consultation</option>
          <option value="quote">Quote</option>
          <option value="other">Other</option>
        </select>

        <select
          value={status}
          aria-label="Filter by status"
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All statuses</option>
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button
          className="ad-btn ad-btn-ghost"
          type="button"
          disabled={isExporting}
          onClick={() => runExport("filtered")}
        >
          Export PDF
        </button>
        <button
          className="ad-btn ad-btn-ghost"
          type="button"
          disabled={isExporting}
          onClick={() => runExport("detailed")}
        >
          Export PDF (detailed)
        </button>
        <button
          className="ad-btn ad-btn-ghost"
          type="button"
          disabled={isExporting}
          onClick={() => runExport("csv")}
        >
          Export CSV
        </button>
      </div>

      <div className="ad-card">
        {isLoading ? (
          <Loading label="Loading submissions…" />
        ) : rows.length === 0 ? (
          <Empty title="No submissions found">
            <p>
              {debouncedSearch || formType !== "all" || status !== "all"
                ? "Try clearing the search or filters."
                : "Enquiries submitted through the website will appear here."}
            </p>
          </Empty>
        ) : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Received</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Form</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className={row.is_read ? "" : "is-unread"}>
                    <td className="ad-cell-muted">{formatDate(row.created_at)}</td>
                    <td className="ad-cell-strong">{row.name}</td>
                    <td>
                      <div>{row.phone}</div>
                      {row.email && <div className="ad-cell-muted">{row.email}</div>}
                    </td>
                    <td>
                      <Pill tone={row.form_type === "consultation" ? "new" : undefined}>
                        {row.form_type}
                      </Pill>
                    </td>
                    <td>
                      <div className="ad-cell-clamp">{row.description || "—"}</div>
                    </td>
                    <td>
                      <Pill tone={STATUS_TONE[row.status]}>{row.status}</Pill>
                    </td>
                    <td>
                      <div className="ad-row-actions">
                        <button
                          className="ad-btn ad-btn-ghost ad-btn-sm"
                          type="button"
                          onClick={() => openDetail(row)}
                        >
                          View
                        </button>
                        <button
                          className="ad-btn ad-btn-ghost ad-btn-sm"
                          type="button"
                          onClick={() => exportSubmissionPdf(row)}
                        >
                          PDF
                        </button>
                        <button
                          className="ad-btn ad-btn-danger ad-btn-sm"
                          type="button"
                          onClick={() => setDeleting(row)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && total > 0 && (
          <div className="ad-pager">
            <span>
              Page {page} of {lastPage} · {total} record{total === 1 ? "" : "s"}
            </span>
            <div className="ad-pager-actions">
              <button
                className="ad-btn ad-btn-ghost ad-btn-sm"
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </button>
              <button
                className="ad-btn ad-btn-ghost ad-btn-sm"
                type="button"
                disabled={page >= lastPage}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---- Detail ---- */}
      {viewing && (
        <Modal
          title={viewing.name}
          onClose={() => setViewing(null)}
          footer={
            <>
              <button
                className="ad-btn ad-btn-ghost"
                type="button"
                onClick={() => exportSubmissionPdf(viewing)}
              >
                Export PDF
              </button>
              <button
                className="ad-btn ad-btn-ghost"
                type="button"
                onClick={() => setViewing(null)}
              >
                Close
              </button>
            </>
          }
        >
          <dl className="ad-detail-grid">
            <dt>Received</dt>
            <dd>{formatDate(viewing.created_at)}</dd>
            {DETAIL_FIELDS.filter(([key]) => viewing[key]).map(([key, label]) => (
              <div key={key} style={{ display: "contents" }}>
                <dt>{label}</dt>
                <dd>
                  {key === "email" ? (
                    <a href={`mailto:${viewing[key]}`}>{viewing[key]}</a>
                  ) : key === "phone" ? (
                    <a href={`tel:${viewing[key]}`}>{viewing[key]}</a>
                  ) : (
                    viewing[key]
                  )}
                </dd>
              </div>
            ))}
          </dl>

          {viewing.description && (
            <div className="ad-detail-block">
              <span className="ad-label">Project description</span>
              <p>{viewing.description}</p>
            </div>
          )}

          <div className="ad-detail-block">
            <span className="ad-label">Status</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {STATUSES.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`ad-btn ad-btn-sm ${
                    viewing.status === item ? "ad-btn-primary" : "ad-btn-ghost"
                  }`}
                  onClick={() => changeStatus(viewing, item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="ad-detail-block">
            <span className="ad-label">Internal notes</span>
            <textarea
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              style={{
                width: "100%",
                border: "1px solid var(--ad-line)",
                borderRadius: 7,
                padding: "9px 11px",
                font: "inherit",
                fontSize: 14,
              }}
              placeholder="Notes visible only to admins."
            />
            <button
              className="ad-btn ad-btn-ghost ad-btn-sm"
              type="button"
              onClick={saveNotes}
              style={{ marginTop: 8 }}
            >
              Save notes
            </button>
          </div>
        </Modal>
      )}

      {deleting && (
        <Confirm
          title="Delete this submission?"
          message={`The enquiry from ${deleting.name} will be permanently removed. This cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
          busy={isDeleting}
        />
      )}

      <Toast message={toast.message} tone={toast.tone} onDone={toast.clear} />
    </>
  );
}
