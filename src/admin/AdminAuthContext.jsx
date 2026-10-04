/**
 * ADMIN AUTHENTICATION
 * ============================================================================
 * Signing in to Supabase Auth is necessary but not sufficient. Access to the
 * admin panel requires an active row in `public.admin_users` keyed to the
 * authenticated user's id.
 *
 * That check is enforced twice, deliberately:
 *
 *   1. In the database. Every RLS policy in database/policies.sql calls
 *      `is_admin()` or `is_editor()`, both of which read admin_users. This is
 *      the real boundary — it holds even if someone bypasses the UI entirely
 *      and hits the REST API with a valid token.
 *
 *   2. Here, in the UI. A user with a valid session but no admin_users row is
 *      signed straight back out with an explanation, rather than being shown
 *      a panel where every query silently returns nothing.
 *
 * The second check is a courtesy, not a security control. Removing it would
 * make the panel confusing; removing the first would make it unprotected.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import { auth, db, isConfigured } from "../lib/supabase";
import { adminUsers } from "../services/content";
import { log } from "../services/activity";

const AdminAuthContext = createContext(null);

const NOT_ADMIN_MESSAGE =
  "This account is not authorised for the admin panel. Ask an administrator " +
  "to approve it in Admin users.";

const PENDING_MESSAGE =
  "This account is waiting for approval. An existing administrator needs to " +
  "activate it in Admin panel → Admin users before you can sign in.";

async function fetchProfile(userId) {
  const { data } = await db
    .from("admin_users")
    .select("*")
    .eq("id", userId)
    .run();
  return data?.[0] || null;
}

export function AdminAuthProvider({ children }) {
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");

  /* Restore a session left in localStorage from a previous visit. */
  useEffect(() => {
    // A recovery URL must be parsed by ResetPasswordPage before any stored
    // session restoration can redirect or sign out the visitor.
    if (location.pathname === "/admin/reset-password") {
      setIsReady(true);
      return undefined;
    }
    let cancelled = false;

    (async () => {
      if (!isConfigured() || !auth.isSignedIn()) {
        if (!cancelled) setIsReady(true);
        return;
      }

      try {
        // Refresh first: a token stored days ago has long expired, and every
        // subsequent query would 401 without this.
        await auth.ensureFreshToken();
        const user = auth.getUser();
        if (!user) throw new Error("No user on session");

        let row = await fetchProfile(user.id);

        // No row at all means this session came from an email-confirmation
        // link: the account exists in Auth but sign-up could not enrol it at
        // the time, because there was no session yet. Enrol it now. The
        // database still decides the outcome — first in becomes the owner,
        // everyone else lands pending.
        if (!row) {
          try {
            await adminUsers.claimAccess(user.user_metadata?.full_name || "");
            row = await fetchProfile(user.id);
          } catch {
            /* Schema not installed yet, or RPC unavailable. Fall through to
               the sign-out below, which is the correct safe outcome. */
          }
        }

        if (cancelled) return;

        if (!row || !row.is_active) {
          await auth.signOut();
          setProfile(null);
        } else {
          setProfile(row);
        }
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const signIn = useCallback(async (email, password) => {
    setError("");

    if (!isConfigured()) {
      const message =
        "Supabase is not configured. Add REACT_APP_SUPABASE_URL and " +
        "REACT_APP_SUPABASE_ANON_KEY to .env, then restart the dev server.";
      setError(message);
      throw new Error(message);
    }

    try {
      const session = await auth.signIn(email.trim(), password);
      let row = await fetchProfile(session.user?.id);

      // Auth credentials and the panel roster are separate records. If this
      // email already exists in Supabase Auth but has no admin_users row, let
      // the database safely enrol it on first sign-in (first active account
      // becomes Admin; later accounts remain pending for approval).
      if (!row) {
        try {
          await adminUsers.claimAccess(
            session.user?.user_metadata?.full_name || ""
          );
          row = await fetchProfile(session.user?.id);
        } catch {
          // A missing enrolment function/table still fails closed below.
        }
      }

      if (!row || !row.is_active) {
        // An existing-but-inactive row means "approved account, switched off
        // or not yet approved" — a different problem from "never enrolled",
        // and worth saying so rather than sending both to the same dead end.
        const message = row ? PENDING_MESSAGE : NOT_ADMIN_MESSAGE;
        await auth.signOut();
        setError(message);
        throw new Error(message);
      }

      setProfile(row);
      log("login", "admin_users", {
        entityId: row.id,
        summary: `${row.email} signed in`,
      });

      // Best-effort presence stamp; never block sign-in on it.
      db.from("admin_users")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", row.id)
        .run()
        .catch(() => {});

      return row;
    } catch (err) {
      const message =
        err?.message === NOT_ADMIN_MESSAGE || err?.message === PENDING_MESSAGE
          ? err.message
          : err?.status === 400
            ? "Incorrect email or password."
            : err?.message || "Could not sign in. Please try again.";
      setError(message);
      throw new Error(message);
    }
  }, []);

  /**
   * Creates the Supabase Auth account, then asks the database to enrol it.
   *
   * The enrolment call is what decides whether this person is the owner or
   * a pending account — the browser has no say in it, which is the point.
   * When the project requires email confirmation there is no session yet, so
   * enrolment has to wait until their first sign-in; `AdminGate` handles that
   * case by calling `claimAccess` again after login.
   */
  const signUp = useCallback(async (email, password, fullName = "") => {
    setError("");

    if (!isConfigured()) {
      const message =
        "Supabase is not configured. Add REACT_APP_SUPABASE_URL and " +
        "REACT_APP_SUPABASE_ANON_KEY to .env, then restart the dev server.";
      setError(message);
      throw new Error(message);
    }

    try {
      const { session, needsConfirmation } = await auth.signUp(
        email.trim(),
        password,
        { redirectTo: `${window.location.origin}/admin` }
      );

      if (needsConfirmation || !session) {
        return { needsConfirmation: true, status: "unconfirmed", first: false };
      }

      const result = await adminUsers.claimAccess(fullName.trim());
      const status = result?.status || "pending";

      if (status === "active") {
        const row = await fetchProfile(session.user?.id);
        if (row) {
          setProfile(row);
          log("create", "admin_users", {
            entityId: row.id,
            summary: `${row.email} enrolled as ${row.role}`,
          });
        }
      } else {
        // Pending accounts must not hold a session — they would sit on the
        // login screen with a valid token and no way to use it.
        await auth.signOut();
      }

      return { needsConfirmation: false, ...result, status };
    } catch (err) {
      const message =
        err?.status === 422 || /already registered|already been/i.test(err?.message || "")
          ? "This email already has a Supabase Auth login. It may not have a row in the admin_users table yet. Sign in with this account (or reset its password); the first account will be enrolled as Admin if no active Admin exists."
          : err?.message || "Could not create the account. Please try again.";
      setError(message);
      throw new Error(message);
    }
  }, []);

  /** Sends the reset email. Never reveals whether the address is known. */
  const requestPasswordReset = useCallback(async (email) => {
    setError("");
    if (!isConfigured()) {
      const message = "Supabase is not configured. See README.md.";
      setError(message);
      throw new Error(message);
    }
    await auth.requestPasswordReset(email.trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    return true;
  }, []);

  /** Applies a new password using the token from the recovery link. */
  const updatePassword = useCallback(async (password, token) => {
    setError("");
    await auth.updatePassword(password, { token });
    // The recovery token is single-purpose; drop it so the next screen is a
    // clean sign-in rather than a half-authenticated session.
    await auth.signOut();
    setProfile(null);
    return true;
  }, []);

  const signOut = useCallback(async () => {
    await auth.signOut();
    setProfile(null);
    setError("");
  }, []);

  const value = useMemo(
    () => ({
      profile,
      isReady,
      error,
      setError,
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      updatePassword,
      isSignedIn: Boolean(profile),
      canEdit: profile?.role === "admin" || profile?.role === "editor",
      isOwner: profile?.role === "admin",
    }),
    [
      profile,
      isReady,
      error,
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      updatePassword,
    ]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used inside <AdminAuthProvider>");
  }
  return context;
}

export default AdminAuthContext;
