import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, isConfigured } from "../../lib/supabase";
import { Alert } from "../components/ui";
import PasswordInput from "../components/PasswordInput";

const MIN_PASSWORD = 8;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phase, setPhase] = useState("email");
  const [isBusy, setIsBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const configured = isConfigured();

  async function onSubmit(event) {
    event.preventDefault();
    if (isBusy) return;
    setIsBusy(true);
    setProblem("");
    try {
      if (phase === "email") {
        const result = await auth.resetAdminPasswordByEmail(email.trim(), "", "check");
        if (!result?.exists) {
          setProblem("No active admin account was found for this email.");
        } else {
          setPhase("password");
        }
      } else {
        if (password.length < MIN_PASSWORD) {
          setProblem(`Use at least ${MIN_PASSWORD} characters.`);
          return;
        }
        if (password !== confirm) {
          setProblem("The two passwords do not match.");
          return;
        }
        await auth.resetAdminPasswordByEmail(email.trim(), password, "reset");
        setPhase("done");
      }
    } catch (err) {
      setProblem(err?.message || "Could not reset the password. Please try again.");
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

          {phase === "done" ? (
            <>
              <h1>Password updated</h1>
              <Alert tone="ok" title="Done">
                Your password has been changed. Sign in with it now.
              </Alert>
              <button
                className="ad-btn ad-btn-primary"
                type="button"
                onClick={() => navigate("/admin")}
              >
                Go to sign in
              </button>
            </>
          ) : (
            <>
              <h1>{phase === "email" ? "Reset your password" : "Choose a new password"}</h1>
              <p className="ad-login-sub">
                {phase === "email"
                  ? "Enter the email address on your admin account."
                  : `Admin account: ${email}`}
              </p>

              {!configured && (
                <Alert tone="error" title="Supabase is not configured">
                  Add your credentials to <code>.env</code> and restart the dev server.
                </Alert>
              )}
              {problem && <Alert tone="error" title="Could not reset password">{problem}</Alert>}

              <form onSubmit={onSubmit} noValidate>
                {phase === "email" ? (
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
                ) : (
                  <>
                    <div className="ad-field">
                      <label className="ad-label" htmlFor="new-password">New password</label>
                      <PasswordInput
                        id="new-password"
                        autoComplete="new-password"
                        value={password}
                        required
                        disabled={isBusy}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setProblem("");
                        }}
                      />
                      <div className="ad-field-help">At least {MIN_PASSWORD} characters.</div>
                    </div>
                    <div className="ad-field">
                      <label className="ad-label" htmlFor="confirm-password">Confirm new password</label>
                      <PasswordInput
                        id="confirm-password"
                        autoComplete="new-password"
                        value={confirm}
                        required
                        disabled={isBusy}
                        onChange={(event) => {
                          setConfirm(event.target.value);
                          setProblem("");
                        }}
                      />
                    </div>
                  </>
                )}

                <button
                  className="ad-btn ad-btn-primary"
                  type="submit"
                  disabled={
                    !configured || isBusy ||
                    (phase === "email" ? !email.trim() : !password || !confirm)
                  }
                >
                  {isBusy ? "Please wait…" : phase === "email" ? "Continue" : "Reset password"}
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
