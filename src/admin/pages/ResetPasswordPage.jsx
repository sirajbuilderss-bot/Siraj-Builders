import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../AdminAuthContext";
import { auth } from "../../lib/supabase";
import { Alert } from "../components/ui";

/**
 * RESET PASSWORD
 * ============================================================================
 * The landing page for the link in Supabase's recovery email.
 *
 * Supabase appends the recovery token to the URL *fragment*
 * (`…/admin/reset-password#access_token=…&type=recovery`) rather than the
 * query string, precisely because fragments are never sent to a server. It is
 * read here, used to authorise one password change, and then wiped from the
 * address bar so it cannot be leaked through browser history, a screenshot or
 * a pasted URL.
 */

const MIN_PASSWORD = 8;

function readFragment() {
  if (typeof window === "undefined") return {};
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) return {};
  const params = new URLSearchParams(raw);
  return {
    accessToken: params.get("access_token") || "",
    refreshToken: params.get("refresh_token") || "",
    expiresIn: params.get("expires_in") || "",
    type: params.get("type") || "",
    errorDescription:
      params.get("error_description") || params.get("error") || "",
  };
}

export default function ResetPasswordPage() {
  const { updatePassword } = useAdminAuth();
  const navigate = useNavigate();

  const [token, setToken] = useState("");
  const [linkError, setLinkError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    const fragment = readFragment();

    if (fragment.errorDescription) {
      setLinkError(
        decodeURIComponent(fragment.errorDescription.replace(/\+/g, " "))
      );
      return;
    }

    if (!fragment.accessToken) {
      setLinkError(
        "This page needs a valid reset link. Request a new one from the sign-in screen."
      );
      return;
    }

    setToken(fragment.accessToken);
    auth.adoptTokens({
      access_token: fragment.accessToken,
      refresh_token: fragment.refreshToken,
      expires_in: fragment.expiresIn,
    });

    // Strip the token from the address bar without adding a history entry.
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`
    );
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    if (isBusy) return;

    if (password.length < MIN_PASSWORD) {
      setProblem(`Use at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password !== confirm) {
      setProblem("The two passwords do not match.");
      return;
    }

    setIsBusy(true);
    setProblem("");
    try {
      await updatePassword(password, token);
      setIsDone(true);
    } catch (err) {
      setProblem(
        err?.message ||
          "Could not set the new password. The link may have expired — request a fresh one."
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

          {isDone ? (
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
          ) : linkError ? (
            <>
              <h1>Link problem</h1>
              <Alert tone="error" title="This reset link cannot be used">
                {linkError}
              </Alert>
              <p className="ad-login-foot">
                <Link to="/admin/forgot-password">Request a new link</Link>
              </p>
            </>
          ) : (
            <>
              <h1>Set a new password</h1>
              <p className="ad-login-sub">
                Choose a password you do not use anywhere else.
              </p>

              {problem && (
                <Alert tone="error" title="Could not update the password">
                  {problem}
                </Alert>
              )}

              <form onSubmit={onSubmit} noValidate>
                <div className="ad-field">
                  <label className="ad-label" htmlFor="reset-password">
                    New password
                  </label>
                  <input
                    id="reset-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    disabled={isBusy}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setProblem("");
                    }}
                  />
                  <div className="ad-field-help">
                    At least {MIN_PASSWORD} characters.
                  </div>
                </div>

                <div className="ad-field">
                  <label className="ad-label" htmlFor="reset-confirm">
                    Confirm new password
                  </label>
                  <input
                    id="reset-confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    disabled={isBusy}
                    onChange={(event) => {
                      setConfirm(event.target.value);
                      setProblem("");
                    }}
                  />
                </div>

                <button
                  className="ad-btn ad-btn-primary"
                  type="submit"
                  disabled={isBusy || !password || !confirm}
                >
                  {isBusy ? "Updating…" : "Update password"}
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
