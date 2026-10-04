import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../lib/supabase";
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
  const { profile, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [permanentlyDeleting, setPermanentlyDeleting] = useState(null);
  const [isPermanentlyDeleting, setIsPermanentlyDeleting] = useState(false);
  const toast = useToast();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminUsers.listAll();
      setRows(data || []);
      const currentAdminIsVisible = (data || []).some(
        (row) => row.id === profile?.id
      );
      setLoadError(
        currentAdminIsVisible
          ? ""
          : "The roster did not return your signed-in Admin account. Check that the deployed Supabase database has the latest admin_users RLS policies from database/policies.sql."
      );
    } catch (error) {
      setLoadError(
        error?.message ||
          "Could not load the admin roster. Only a full admin can view this screen."
      );
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // A different admin may approve, change, or remove an account from another
  // device while this page is open. Refresh the shared Supabase roster when
  // this tab becomes visible again; the button remains available for an
  // immediate manual refresh.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
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

  async function confirmPermanentDelete() {
    if (!permanentlyDeleting) return;
    const deletingSelf = isSelf(permanentlyDeleting);
    setIsPermanentlyDeleting(true);
    try {
      await auth.deleteAdminAccount(permanentlyDeleting.id);
      log("delete", "admin_users", {
        entityId: permanentlyDeleting.id,
        summary: `Permanently deleted ${permanentlyDeleting.email}`,
      });
      setPermanentlyDeleting(null);
      if (deletingSelf) {
        await signOut();
        navigate("/admin", { replace: true });
        return;
      }
      toast.show(`${permanentlyDeleting.email} was permanently deleted.`);
      await refresh();
    } catch (error) {
      toast.show(error?.message || "Could not permanently delete that account.", "error");
    } finally {
      setIsPermanentlyDeleting(false);
    }
  }

  async function copySignupLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/admin/signup`);
      toast.show("Sign-up link copied. Share it with the person you want to add.");
    } catch {
      toast.show("Copy failed. Share this link: /admin/signup", "error");
    }
  }

  const pending = rows.filter((row) => !row.is_active);

  if (profile?.role !== "admin") {
    return (
      <Alert tone="error" title="Administrator access required">
        Only an active Admin can view or manage the shared admin user roster.
        Your current role is <b>{profile?.role || "unknown"}</b>.
      </Alert>
    );
  }

  return (
    <>
      <p className="ad-section-note">
        This roster is stored in the shared Supabase project, so every active
        Admin sees the same accounts from any device. New accounts join through
        <code> /admin/signup</code> and appear here as pending; choose their
        role, then approve them to grant access.
      </p>

      <div className="ad-card" style={{ marginBottom: 16 }}>
        <div className="ad-card-body">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <strong>Role permissions</strong>
            <button className="ad-btn ad-btn-ghost ad-btn-sm" type="button" onClick={copySignupLink}>
              Copy sign-up link
            </button>
          </div>
          <div className="ad-cell-muted" style={{ marginTop: 8 }}>
            <b>Admin</b>: manage website, settings, and admin users. &nbsp;
            <b>Editor</b>: manage website content. &nbsp;
            <b>Viewer</b>: read-only panel access.
          </div>
        </div>
      </div>

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
        ) : rows.length === 0 && loadError ? (
          <Empty title="Roster unavailable">
            <p>
              Admin access is confirmed, but the shared roster query did not
              return your own account. Apply
              <code> database/migration-09-admin-users-roster.sql</code> in the
              Supabase SQL Editor, then refresh this page.
            </p>
          </Empty>
        ) : rows.length === 0 ? (
          <Empty title="No admin accounts yet">
            <p>
              Share <code>/admin/signup</code> with the person you want to add.
              After they sign up, refresh this shared roster, set their role,
              then approve their account.
            </p>
          </Empty>
        ) : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Role</th>
                  <th>Permissions</th>
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

                      <td className="ad-cell-muted">
                        {row.role === "admin"
                          ? "Full access + manage users"
                          : row.role === "editor"
                            ? "Edit website content"
                            : "Read-only"}
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
                          <button
                            className="ad-btn ad-btn-danger ad-btn-sm"
                            type="button"
                            disabled={busy || isPermanentlyDeleting}
                            onClick={() => setPermanentlyDeleting(row)}
                            title="Permanently delete this Supabase Auth account and its admin profile"
                          >
                            Delete permanently
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
        Supabase Auth. Permanent deletion removes their Supabase Auth account
        and cascades the linked admin profile; a self-deletion signs you out.
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

      {permanentlyDeleting && (
        <Confirm
          title={isSelf(permanentlyDeleting) ? "Delete your Admin account permanently?" : "Permanently delete this Admin account?"}
          message={`This permanently deletes ${permanentlyDeleting.email} from Supabase Auth and removes the linked admin profile. They will no longer be able to sign in. This cannot be undone.${isSelf(permanentlyDeleting) ? " You will be signed out immediately." : ""}`}
          confirmLabel="Delete permanently"
          onConfirm={confirmPermanentDelete}
          onCancel={() => setPermanentlyDeleting(null)}
          busy={isPermanentlyDeleting}
        />
      )}

      <Toast message={toast.message} tone={toast.tone} onDone={toast.clear} />
    </>
  );
}
