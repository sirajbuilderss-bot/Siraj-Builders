import { useState } from "react";
import { Link } from "react-router-dom";
import { auth, isConfigured } from "../../lib/supabase";
import { Alert } from "../components/ui";
import BrandMark from "../../components/layout/BrandMark";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [problem, setProblem] = useState("");
  const configured = isConfigured();

  async function onSubmit(event) {
    event.preventDefault();
    if (isBusy) return;
    setIsBusy(true);
    setProblem("");
    try {
      await auth.requestPasswordReset(email.trim(), {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });
      setIsSent(true);
    } catch (err) {
      setProblem(err?.message || "Could not send the reset email. Please try again.");
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

          {isSent ? (
            <>
              <h1>Check your email</h1>
              <Alert tone="ok" title="If this account exists, a reset link is on its way">
                Open the password reset email and follow its link to choose a new password.
              </Alert>
              <p className="ad-login-foot">
                <Link to="/admin">Back to sign in</Link>
              </p>
            </>
          ) : (
            <>
              <h1>Reset your password</h1>
              <p className="ad-login-sub">Enter your admin email and we’ll send you a secure reset link.</p>

              {!configured && (
                <Alert tone="error" title="Supabase is not configured">
                  Add your credentials to <code>.env</code> and restart the dev server.
                </Alert>
              )}
              {problem && <Alert tone="error" title="Could not send reset email">{problem}</Alert>}

              <form onSubmit={onSubmit} noValidate>
                <div className="ad-field">
                  <label className="ad-label" htmlFor="forgot-email">Admin email</label>
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
                <Link to="/admin">Back to sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
