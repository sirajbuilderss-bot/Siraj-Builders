import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../AdminAuthContext";
import { isConfigured } from "../../lib/supabase";
import { adminUsers } from "../../services/content";
import { Alert } from "../components/ui";

/**
 * ADMIN SIGN-UP
 * ============================================================================
 * Creating an account here does not, by itself, let anyone in.
 *
 * The account is created in Supabase Auth, then `claim_admin_access()` in the
 * database decides what it is worth:
 *
 *   - No administrator exists yet  → this account becomes the owner.
 *     This happens exactly once per project, on first setup.
 *   - An administrator already exists → the account is filed as INACTIVE and
 *     an existing admin has to approve it in Admin users.
 *
 * The decision is made in Postgres, not here, so editing this file — or
 * calling the REST API directly with the anon key — cannot grant access.
 * See the comment block above the function in database/schema.sql.
 */

const MIN_PASSWORD = 8;

export default function SignupPage() {
  const { signUp, error, setError } = useAdminAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [outcome, setOutcome] = useState(null); // null | "active" | "pending" | "unconfirmed"
  const [localError, setLocalError] = useState("");

  // Drives the wording: the first person to arrive is being told they will
  // own the panel; everyone afterwards is being told they will need approval.
  const [isFirstAdmin, setIsFirstAdmin] = useState(null);

  const configured = isConfigured();

  useEffect(() => {
    let cancelled = false;
    if (!configured) return undefined;

    (async () => {
      try {
        const exists = await adminUsers.anyExists();
        if (!cancelled) setIsFirstAdmin(exists === false);
      } catch {
        /* Schema not installed yet — leave the wording neutral. */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [configured]);

  function validate() {
    if (!fullName.trim()) return "Enter your name.";
    if (!email.trim()) return "Enter your email address.";
    if (password.length < MIN_PASSWORD) {
      return `Use at least ${MIN_PASSWORD} characters for the password.`;
    }
    if (password !== confirm) return "The two passwords do not match.";
    return "";
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (isBusy) return;

    const problem = validate();
    if (problem) {
      setLocalError(problem);
      return;
    }

    setLocalError("");
    setIsBusy(true);
    try {
      const result = await signUp(email, password, fullName);
      setOutcome(
        result.needsConfirmation ? "unconfirmed" : result.status || "pending"
      );
    } catch {
      // Already surfaced through context error state.
    } finally {
      setIsBusy(false);
    }
  }

  /* ---------------------------------------------------------- outcomes */

  if (outcome === "active") {
    return (
      <Shell>
        <Alert tone="ok" title="You are the administrator">
          Your account owns this panel. Nobody else can enrol without your
          approval from now on.
        </Alert>
        <button
          className="ad-btn ad-btn-primary"
          type="button"
          onClick={() => navigate("/admin")}
        >
          Continue to the dashboard
        </button>
      </Shell>
    );
  }

  if (outcome === "pending") {
    return (
      <Shell>
        <Alert tone="info" title="Account created — awaiting approval">
          This project already has an administrator, so your account has been
          created but not activated. Ask them to approve it in{" "}
          <b>Admin panel → Admin users</b>. You will be able to sign in as soon
          as they do.
        </Alert>
        <p className="ad-login-foot">
          <Link to="/admin">Back to sign in</Link>
        </p>
      </Shell>
    );
  }

  if (outcome === "unconfirmed") {
    return (
      <Shell>
        <Alert tone="info" title="Check your email">
          Your Supabase project requires email confirmation. Open the link we
          just sent to <b>{email}</b>, and your access will be set up
          automatically when you return.
        </Alert>
        <p className="ad-login-foot">
          <Link to="/admin">Back to sign in</Link>
        </p>
      </Shell>
    );
  }

  /* ------------------------------------------------------------- form */

  return (
    <Shell>
      <h1>Create an admin account</h1>
      <p className="ad-login-sub">
        {isFirstAdmin === true
          ? "No administrator exists yet, so this account will own the panel."
          : isFirstAdmin === false
            ? "This project already has an administrator, so your account will need their approval."
            : "Access is granted by the database, not by this form."}
      </p>

      {!configured && (
        <Alert tone="error" title="Supabase is not configured">
          Add <code>REACT_APP_SUPABASE_URL</code> and{" "}
          <code>REACT_APP_SUPABASE_ANON_KEY</code> to <code>.env</code>, then
          restart the dev server. See README.md.
        </Alert>
      )}

      {(localError || error) && (
        <Alert tone="error" title="Could not create the account">
          {localError || error}
        </Alert>
      )}

      <form onSubmit={onSubmit} noValidate>
        <div className="ad-field">
          <label className="ad-label" htmlFor="signup-name">
            Full name
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            value={fullName}
            disabled={!configured || isBusy}
            onChange={(event) => {
              setFullName(event.target.value);
              setLocalError("");
              if (error) setError("");
            }}
          />
        </div>

        <div className="ad-field">
          <label className="ad-label" htmlFor="signup-email">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="username"
            value={email}
            disabled={!configured || isBusy}
            onChange={(event) => {
              setEmail(event.target.value);
              setLocalError("");
              if (error) setError("");
            }}
          />
        </div>

        <div className="ad-field">
          <label className="ad-label" htmlFor="signup-password">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            disabled={!configured || isBusy}
            onChange={(event) => {
              setPassword(event.target.value);
              setLocalError("");
            }}
          />
          <div className="ad-field-help">At least {MIN_PASSWORD} characters.</div>
        </div>

        <div className="ad-field">
          <label className="ad-label" htmlFor="signup-confirm">
            Confirm password
          </label>
          <input
            id="signup-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            disabled={!configured || isBusy}
            onChange={(event) => {
              setConfirm(event.target.value);
              setLocalError("");
            }}
          />
        </div>

        <button
          className="ad-btn ad-btn-primary"
          type="submit"
          disabled={!configured || isBusy}
        >
          {isBusy ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="ad-login-foot">
        Already have an account? <Link to="/admin">Sign in</Link>
      </p>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="admin-root">
      <div className="ad-login">
        <div className="ad-login-card">
          <div className="ad-login-brand">
            <span className="ad-brand-mark">SB</span>
            <span className="ad-brand-text">
              <b>Siraj Builders</b>
              <span>Admin panel</span>
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
