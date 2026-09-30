import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "../AdminAuthContext";
import { isConfigured } from "../../lib/supabase";
import { Alert } from "../components/ui";

/**
 * FORGOT PASSWORD
 * ============================================================================
 * Sends Supabase's recovery email, which links back to /admin/reset-password
 * with a single-use token in the URL fragment.
 *
 * The confirmation below is deliberately identical whether or not an account
 * exists for the address typed in. A form that said "no account found" would
 * be a working tool for checking who has an account here, which is worth more
 * to an attacker than it is to a forgetful admin.
 */
export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [problem, setProblem] = useState("");

  const configured = isConfigured();

  async function onSubmit(event) {
    event.preventDefault();
    if (isBusy || !email.trim()) return;

    setIsBusy(true);
    setProblem("");
    try {
      await requestPasswordReset(email);
      setIsSent(true);
    } catch (err) {
      setProblem(
        err?.message || "Could not send the reset email. Please try again."
      );
    } finally {
      setIsBusy(false);
    }
  }

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

          {isSent ? (
            <>
              <h1>Check your email</h1>
              <Alert tone="ok" title="Reset link sent">
                If an account exists for <b>{email}</b>, a password reset link
                is on its way. The link expires after one hour and can only be
                used once.
              </Alert>
              <p className="ad-login-foot">
                <Link to="/admin">Back to sign in</Link>
              </p>
            </>
          ) : (
            <>
              <h1>Reset your password</h1>
              <p className="ad-login-sub">
                Enter the email address on your admin account and we will send
                you a link to set a new password.
              </p>

              {!configured && (
                <Alert tone="error" title="Supabase is not configured">
                  Add your credentials to <code>.env</code> and restart the dev
                  server. See README.md.
                </Alert>
              )}

              {problem && (
                <Alert tone="error" title="Could not send the email">
                  {problem}
                </Alert>
              )}

              <form onSubmit={onSubmit} noValidate>
                <div className="ad-field">
                  <label className="ad-label" htmlFor="forgot-email">
                    Email
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    required
                    disabled={!configured || isBusy}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setProblem("");
                    }}
                  />
                </div>

                <button
                  className="ad-btn ad-btn-primary"
                  type="submit"
                  disabled={!configured || isBusy || !email.trim()}
                >
                  {isBusy ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <p className="ad-login-foot">
                Remembered it? <Link to="/admin">Back to sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
