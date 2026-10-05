import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "../AdminAuthContext";
import { isConfigured } from "../../lib/supabase";
import { Alert } from "../components/ui";
import PasswordInput from "../components/PasswordInput";
import BrandMark from "../../components/layout/BrandMark";

/**
 * ADMIN LOGIN
 * ----------------------------------------------------------------------------
 * There is a sign-up screen, but it grants nothing by itself. Access is
 * decided by `claim_admin_access()` in the database: the first account to
 * sign up becomes the administrator, and every account after that is filed
 * as inactive until an existing admin approves it in Admin users.
 *
 * That distinction matters, because Supabase Auth lets anyone holding the
 * anon key create an account — and the anon key ships in this bundle. So the
 * gate is the `admin_users` row, never the existence of a login form.
 */
export default function LoginPage() {
  const { signIn, error, setError } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const configured = isConfigured();

  async function onSubmit(event) {
    event.preventDefault();
    if (isBusy) return;

    setIsBusy(true);
    try {
      await signIn(email, password);
      // On success the router swaps this screen for the panel; nothing to do.
    } catch {
      // The message is already in context state and rendered below.
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="admin-root">
      <div className="ad-login">
        <div className="ad-login-card">
          <div className="ad-login-brand">
            <BrandMark admin />
            <span className="ad-brand-text">
              <b>Siraj Builders</b>
              <span>Admin panel</span>
            </span>
          </div>

          <h1>Sign in</h1>
          <p className="ad-login-sub">
            Manage enquiries, projects, services and site content.
          </p>

          {!configured && (
            <Alert tone="error" title="Supabase is not configured">
              Add <code>REACT_APP_SUPABASE_URL</code> and{" "}
              <code>REACT_APP_SUPABASE_ANON_KEY</code> to <code>.env</code>,
              then restart the dev server. See README.md.
            </Alert>
          )}

          {error && (
            <Alert tone="error" title="Could not sign in">
              {error}
            </Alert>
          )}

          <form onSubmit={onSubmit} noValidate>
            <div className="ad-field">
              <label className="ad-label" htmlFor="admin-email">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                required
                disabled={!configured || isBusy}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError("");
                }}
              />
            </div>

            <div className="ad-field">
              <label className="ad-label" htmlFor="admin-password">
                Password
              </label>
              <PasswordInput
                id="admin-password"
                autoComplete="current-password"
                value={password}
                required
                disabled={!configured || isBusy}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError("");
                }}
              />
            </div>

            <button
              className="ad-btn ad-btn-primary"
              type="submit"
              disabled={!configured || isBusy || !email || !password}
            >
              {isBusy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="ad-login-foot">
            <Link to="/admin/forgot-password">Forgot your password?</Link>
            <br />
            No account yet? <Link to="/admin/signup">Create one</Link> ·{" "}
            <Link to="/">Back to website</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
