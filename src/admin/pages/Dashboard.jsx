import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardCounts } from "../../services/content";
import { listSubmissions } from "../../services/submissions";
import { recent, removeEntry, removeOlderThan } from "../../services/activity";
import {
  Alert,
  Empty,
  Loading,
  Pill,
  formatDate,
  relativeTime,
} from "../components/ui";
import { IconBriefcase, IconCheck, IconExternal, IconFile, IconInbox, IconTrash } from "../components/icons";

const CARDS = [
  { key: "submissions_total", label: "Total submissions", to: "/admin/submissions" },
  { key: "submissions_unread", label: "Unread", flag: true, to: "/admin/submissions" },
  { key: "projects_active", label: "Live projects", to: "/admin/projects" },
  { key: "services_total", label: "Live services", to: "/admin/services" },
  { key: "pages_total", label: "Live pages", to: "/admin/pages" },
  { key: "faqs_total", label: "Live FAQs", to: "/admin/faqs" },
  { key: "faqs_unanswered", label: "FAQs awaiting an answer", flag: true, to: "/admin/faqs" },
  { key: "testimonials_total", label: "Verified testimonials", to: "/admin/testimonials" },
  { key: "team_total", label: "Team members", to: "/admin/team" },
];

export default function Dashboard() {
  const [counts, setCounts] = useState(null);
  const [latest, setLatest] = useState([]);
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activityError, setActivityError] = useState("");
  const [activityNotice, setActivityNotice] = useState("");
  const [retentionDays, setRetentionDays] = useState("180");
  const [deleteRequest, setDeleteRequest] = useState(null);
  const [isDeletingActivity, setIsDeletingActivity] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Fired together — the dashboard is three independent reads and there
        // is no reason to serialise them.
        const [countsResult, submissionsResult, activityResult] =
          await Promise.all([
            dashboardCounts(),
            listSubmissions({ page: 1, perPage: 6 }),
            recent(10),
          ]);

        if (cancelled) return;
        setCounts(countsResult);
        setLatest(submissionsResult.rows);
        setActivity(activityResult);
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.message ||
              "Could not load dashboard data. Check that the SQL scripts have been run in Supabase."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function confirmActivityDelete() {
    if (!deleteRequest || isDeletingActivity) return;
    setIsDeletingActivity(true);
    setActivityError("");
    setActivityNotice("");
    try {
      if (deleteRequest.kind === "entry") {
        await removeEntry(deleteRequest.id);
        setActivityNotice("Activity entry deleted.");
      } else {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - deleteRequest.days);
        const count = await removeOlderThan(cutoff);
        setActivityNotice(
          count === 0
            ? `No activity older than ${deleteRequest.days} days was found.`
            : `${count ?? "Old"} activity ${count === 1 ? "entry" : "entries"} deleted.`
        );
      }
      setActivity(await recent(10));
      setDeleteRequest(null);
    } catch (err) {
      setActivityError(
        err?.code === "42501" || /row-level security|permission denied/i.test(err?.message || "")
          ? "Activity deletion is not enabled in Supabase yet. Run database/migration-04-activity-retention.sql in the Supabase SQL Editor, then reload this page."
          : err?.message || "Could not delete activity. Please try again."
      );
    } finally {
      setIsDeletingActivity(false);
    }
  }

  if (isLoading) return <Loading label="Loading dashboard…" />;

  return (
    <>
      {error && (
        <Alert tone="error" title="Dashboard could not load fully">
          {error}
        </Alert>
      )}

      <div className="ad-stats">
        {CARDS.map((card) => (
          <Link
            key={card.key}
            to={card.to}
            className={`ad-stat${card.flag && counts?.[card.key] > 0 ? " is-flag" : ""}`}
            style={{ textDecoration: "none", color: "inherit", display: "block" }}
          >
            <div className="ad-stat-label">{card.label}</div>
            <div className="ad-stat-value">{counts?.[card.key] ?? 0}</div>
          </Link>
        ))}
      </div>

      <section className="ad-dashboard-actions" aria-labelledby="dashboard-actions-title">
        <div className="ad-dashboard-actions-copy">
          <span className="ad-dashboard-kicker">Workspace</span>
          <h2 id="dashboard-actions-title">What would you like to update?</h2>
          <p>Jump straight to the parts of your website you manage most often.</p>
        </div>
        <div className="ad-dashboard-shortcuts">
          <Link to="/admin/builder" className="ad-dashboard-shortcut">
            <span className="ad-shortcut-mark" aria-hidden="true"><IconFile size={17} /></span>
            <span><strong>Edit website pages</strong><small>Copy, sections and page media</small></span>
            <span className="ad-shortcut-arrow" aria-hidden="true"><IconExternal size={15} /></span>
          </Link>
          <Link to="/admin/projects" className="ad-dashboard-shortcut">
            <span className="ad-shortcut-mark" aria-hidden="true"><IconBriefcase size={17} /></span>
            <span><strong>Manage projects</strong><small>Projects, images and videos</small></span>
            <span className="ad-shortcut-arrow" aria-hidden="true"><IconExternal size={15} /></span>
          </Link>
          <Link to="/admin/submissions" className="ad-dashboard-shortcut">
            <span className="ad-shortcut-mark" aria-hidden="true"><IconInbox size={17} /></span>
            <span><strong>Review enquiries</strong><small>{counts?.submissions_unread ?? 0} unread submissions</small></span>
            <span className="ad-shortcut-arrow" aria-hidden="true"><IconExternal size={15} /></span>
          </Link>
        </div>
      </section>

      <div className="ad-grid-2">
        {/* ---- Recent submissions ---- */}
        <section className="ad-card">
          <div className="ad-card-head">
            <h2>Recent submissions</h2>
            <Link
              to="/admin/submissions"
              className="ad-btn ad-btn-ghost ad-btn-sm"
              style={{ marginLeft: "auto" }}
            >
              View all
            </Link>
          </div>

          {latest.length === 0 ? (
            <Empty title="No enquiries yet">
              <p>Submissions from the contact and consultation forms appear here.</p>
            </Empty>
          ) : (
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Received</th>
                  </tr>
                </thead>
                <tbody>
                  {latest.map((row) => (
                    <tr key={row.id} className={row.is_read ? "" : "is-unread"}>
                      <td>
                        <div className="ad-cell-strong">{row.name}</div>
                        <div className="ad-cell-muted">{row.phone}</div>
                      </td>
                      <td>
                        <Pill tone={row.form_type === "consultation" ? "new" : undefined}>
                          {row.form_type}
                        </Pill>
                      </td>
                      <td className="ad-cell-muted">{formatDate(row.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ---- Activity ---- */}
        <section className="ad-card">
          <div className="ad-card-head">
            <div className="ad-activity-heading">
              <h2>Recent activity</h2>
              <p>Latest changes made in the admin panel</p>
            </div>
            {activity.length > 0 && (
              <span className="ad-activity-count">{activity.length} recent</span>
            )}
            <div className="ad-activity-cleanup">
              <label className="ad-sr-only" htmlFor="activity-retention">Delete activity older than</label>
              <select
                id="activity-retention"
                className="ad-activity-retention"
                value={retentionDays}
                onChange={(event) => setRetentionDays(event.target.value)}
              >
                <option value="90">90 days</option>
                <option value="180">180 days</option>
                <option value="365">1 year</option>
              </select>
              <button
                className="ad-btn ad-btn-ghost ad-btn-sm ad-activity-cleanup-btn"
                type="button"
                disabled={isDeletingActivity}
                onClick={() => {
                  setActivityError("");
                  setActivityNotice("");
                  setDeleteRequest({ kind: "older", days: Number(retentionDays) });
                }}
              >
                Clean up
              </button>
            </div>
          </div>
          {deleteRequest && (
            <div className="ad-activity-confirm" role="group" aria-label="Confirm activity deletion">
              <p>
                {deleteRequest.kind === "entry"
                  ? "Permanently delete this activity entry?"
                  : `Permanently delete all activity entries older than ${deleteRequest.days} days?`}
                <span>This cannot be undone.</span>
              </p>
              <div>
                <button className="ad-btn ad-btn-ghost ad-btn-sm" type="button" disabled={isDeletingActivity} onClick={() => setDeleteRequest(null)}>Cancel</button>
                <button className="ad-btn ad-btn-danger ad-btn-sm" type="button" disabled={isDeletingActivity} onClick={confirmActivityDelete}>
                  {isDeletingActivity ? "Deleting…" : "Delete permanently"}
                </button>
              </div>
            </div>
          )}
          {activityError && <Alert tone="error" title="Activity was not deleted">{activityError}</Alert>}
          {activityNotice && <div className="ad-activity-notice" role="status">{activityNotice}</div>}
          <div className="ad-card-body">
            {activity.length === 0 ? (
              <Empty title="Nothing logged yet">
                <p>Content changes made from this panel are recorded here.</p>
              </Empty>
            ) : (
              <ul className="ad-activity">
                {activity.map((item) => (
                  <li key={item.id} className="ad-activity-item">
                    <span className="ad-activity-mark" aria-hidden="true"><IconCheck size={15} /></span>
                    <div className="ad-activity-main">
                      <div className="ad-activity-summary">
                        {item.summary || `${item.action} on ${item.entity}`}
                      </div>
                      <div className="ad-activity-meta">
                        {item.actor_email && <span>{item.actor_email}</span>}
                        {item.entity && <span className="ad-activity-entity">{item.entity.replaceAll("_", " ")}</span>}
                      </div>
                    </div>
                    <time className="ad-act-time" dateTime={item.created_at} title={formatDate(item.created_at)}>
                      {relativeTime(item.created_at)}
                    </time>
                    <button
                      className="ad-activity-delete"
                      type="button"
                      aria-label={`Delete activity: ${item.summary || `${item.action} on ${item.entity}`}`}
                      title="Delete this activity entry"
                      disabled={isDeletingActivity}
                      onClick={() => {
                        setActivityError("");
                        setActivityNotice("");
                        setDeleteRequest({ kind: "entry", id: item.id });
                      }}
                    >
                      <IconTrash size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
