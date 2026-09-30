import { useCallback, useEffect, useState } from "react";
import { adminUsers } from "../../services/content";
import { useAdminAuth } from "../AdminAuthContext";
import { log } from "../../services/activity";
import {
  Alert,
  Confirm,
  Empty,
  Loading,
  Pill,
  Toast,
  useToast,
  formatDate,
  relativeTime,
} from "../components/ui";

/**
 * ADMIN USERS
 * ============================================================================
 * The approval queue and the roster, in one screen.
 *
 * This is not a ResourceManager screen, deliberately. Every other admin table
 * is content — create a row, edit it, delete it. This one is access control,
 * and it has no "create" at all: accounts arrive only by signing up, which
 * files them inactive. The action here is approving them.
 *
 * Roles:
 *   admin   full access, including this screen
 *   editor  can change content, cannot manage people
 *   viewer  read-only — the role a pending account is parked in
 *
 * Two guards are enforced here rather than in the database, because RLS
 * cannot express them: you cannot demote or deactivate your own account, and
 * the last active admin cannot be removed. Either would lock every human out
 * of the panel with no way back in except hand-written SQL.
 */

const ROLES = [
  { value: "admin", label: "Admin — full access" },
  { value: "editor", label: "Editor — content only" },
  { value: "viewer", label: "Viewer — read only" },
];

export default function AdminUsersPage() {
  const { profile } = useAdminAuth();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const toast = useToast();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminUsers.listAll();
      setRows(data || []);
      setLoadError("");
    } catch (error) {
      setLoadError(
        error?.message ||
          "Could not load the admin roster. Only a full admin can view this screen."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activeAdmins = rows.filter(
    (row) => row.is_active && row.role === "admin"
  ).length;

  const isSelf = (row) => row.id === profile?.id;
  const isLastAdmin = (row) =>
    row.is_active && row.role === "admin" && activeAdmins <= 1;

  async function patch(row, changes, summary) {
    setBusyId(row.id);
    try {
      await adminUsers.update(row.id, changes);
      log("update", "admin_users", { entityId: row.id, summary });
      toast.show(summary);
      await refresh();
    } catch (error) {
      toast.show(error?.message || "Could not save that change.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmRemove() {
    if (!removing) return;
    setIsRemoving(true);
    try {
      await adminUsers.remove(removing.id);
      log("delete", "admin_users", {
        entityId: removing.id,
        summary: `Removed panel access for ${removing.email}`,
      });
      toast.show(`${removing.email} no longer has access.`);
      setRemoving(null);
      await refresh();
    } catch (error) {
      toast.show(error?.message || "Could not remove that account.", "error");
    } finally {
      setIsRemoving(false);
    }
  }

  const pending = rows.filter((row) => !row.is_active);

  return (
    <>
      <p className="ad-section-note">
        Who can sign in to this panel. New sign-ups appear here as pending and
        can see nothing until an admin approves them.
      </p>

      {loadError && (
        <Alert tone="error" title="Could not load the roster">
          {loadError}
        </Alert>
      )}

      {pending.length > 0 && (
        <Alert
          tone="info"
          title={`${pending.length} account${pending.length === 1 ? "" : "s"} waiting for approval`}
        >
          Give each person the lowest role that lets them do their job —{" "}
          <b>Editor</b> for someone managing content, <b>Admin</b> only for
          someone who also manages people.
        </Alert>
      )}

      <div className="ad-toolbar">
        <div className="ad-search" />
        <button
          className="ad-btn ad-btn-ghost"
          type="button"
          onClick={refresh}
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>

      <div className="ad-card">
        {isLoading ? (
          <Loading label="Loading the roster…" />
        ) : rows.length === 0 ? (
          <Empty title="No admin accounts yet">
            <p>
              The first person to sign up at <code>/admin/signup</code> becomes
              the administrator of this panel.
            </p>
          </Empty>
        ) : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last seen</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const busy = busyId === row.id;
                  const locked = isSelf(row) || isLastAdmin(row);
                  const lockReason = isSelf(row)
                    ? "You cannot change your own access."
                    : "This is the last active admin.";

                  return (
                    <tr key={row.id}>
                      <td>
                        <div className="ad-cell-strong">
                          {row.full_name || "—"}
                          {isSelf(row) && (
                            <span className="ad-cell-muted"> (you)</span>
                          )}
                        </div>
                        <div className="ad-cell-muted">{row.email}</div>
                        <div className="ad-cell-muted">
                          Joined{" "}
                          {formatDate(row.created_at, { withTime: false })}
                        </div>
                      </td>

                      <td>
                        <select
                          className="ad-inline-select"
                          value={row.role}
                          disabled={busy || locked}
                          title={locked ? lockReason : undefined}
                          aria-label={`Role for ${row.email}`}
                          onChange={(event) =>
                            patch(
                              row,
                              { role: event.target.value },
                              `${row.email} is now ${event.target.value}`
                            )
                          }
                        >
                          {ROLES.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>
                        {row.is_active ? (
                          <Pill tone="ok">Active</Pill>
                        ) : (
                          <Pill tone="new">Pending</Pill>
                        )}
                      </td>

                      <td className="ad-cell-muted">
                        {row.last_seen_at
                          ? relativeTime(row.last_seen_at)
                          : "Never"}
                      </td>

                      <td>
                        <div className="ad-row-actions">
                          {row.is_active ? (
                            <button
                              className="ad-btn ad-btn-ghost ad-btn-sm"
                              type="button"
                              disabled={busy || locked}
                              title={locked ? lockReason : undefined}
                              onClick={() =>
                                patch(
                                  row,
                                  { is_active: false },
                                  `${row.email} deactivated`
                                )
                              }
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              className="ad-btn ad-btn-accent ad-btn-sm"
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                patch(
                                  row,
                                  { is_active: true },
                                  `${row.email} approved`
                                )
                              }
                            >
                              Approve
                            </button>
                          )}

                          <button
                            className="ad-btn ad-btn-danger ad-btn-sm"
                            type="button"
                            disabled={busy || locked}
                            title={locked ? lockReason : undefined}
                            onClick={() => setRemoving(row)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="ad-section-note">
        Removing someone revokes their panel access but leaves their login in
        Supabase Auth. Deleting that requires the service_role key and is done
        from the Supabase dashboard, never from this browser app.
      </p>

      {removing && (
        <Confirm
          title="Remove panel access?"
          message={`${removing.email} will no longer be able to use the admin panel. They can sign up again, but would need approving afresh.`}
          confirmLabel="Remove access"
          onConfirm={confirmRemove}
          onCancel={() => setRemoving(null)}
          busy={isRemoving}
        />
      )}

      <Toast message={toast.message} tone={toast.tone} onDone={toast.clear} />
    </>
  );
}
