import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardCounts } from "../../services/content";
import { listSubmissions } from "../../services/submissions";
import { recent } from "../../services/activity";
import {
  Alert,
  Empty,
  Loading,
  Pill,
  formatDate,
  relativeTime,
} from "../components/ui";

const CARDS = [
  { key: "submissions_total", label: "Total submissions", to: "/admin/submissions" },
  { key: "submissions_unread", label: "Unread", flag: true, to: "/admin/submissions" },
  { key: "projects_total", label: "Projects", to: "/admin/projects" },
  { key: "services_total", label: "Services", to: "/admin/services" },
  { key: "pages_total", label: "Pages", to: "/admin/pages" },
  { key: "faqs_total", label: "FAQs", to: "/admin/faqs" },
  { key: "testimonials_total", label: "Testimonials", to: "/admin/testimonials" },
  { key: "team_total", label: "Team members", to: "/admin/team" },
];

export default function Dashboard() {
  const [counts, setCounts] = useState(null);
  const [latest, setLatest] = useState([]);
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
            <h2>Recent activity</h2>
          </div>
          <div className="ad-card-body">
            {activity.length === 0 ? (
              <Empty title="Nothing logged yet">
                <p>Content changes made from this panel are recorded here.</p>
              </Empty>
            ) : (
              <ul className="ad-activity">
                {activity.map((item) => (
                  <li key={item.id}>
                    <span className="ad-act-dot" aria-hidden="true" />
                    <span>
                      {item.summary || `${item.action} on ${item.entity}`}
                      {item.actor_email && (
                        <div className="ad-cell-muted">{item.actor_email}</div>
                      )}
                    </span>
                    <span className="ad-act-time">{relativeTime(item.created_at)}</span>
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
