import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../AdminAuthContext";
import { auth } from "../../lib/supabase";
import { Alert } from "../components/ui";
import PasswordInput from "../components/PasswordInput";

/**
 * RESET PASSWORD
 * ============================================================================
 * The landing page for the link in Supabase's recovery email.
 *
 * Supabase may return a session in the URL fragment, or an email template may
 * send a token_hash in the query string. Both formats are handled here, then
 * removed from browser history as soon as the recovery session is established.
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
    errorCode: params.get("error_code") || "",
    errorDescription:
      params.get("error_description") || params.get("error") || "",
  };
}

export default function ResetPasswordPage() {
  const { updatePassword } = useAdminAuth();
  const navigate = useNavigate();

  const [token, setToken] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const [linkError, setLinkError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function establishRecoverySession() {
      try {
        const fragment = readFragment();
        const query = new URLSearchParams(window.location.search);
        const errorCode = fragment.errorCode || query.get("error_code") || "";
        const queryError = query.get("error_description") || query.get("error");
        if (errorCode === "otp_expired") {
          throw new Error(
            "This reset link has expired or was already opened. Request a fresh email and use its newest link."
          );
        }
        const error = fragment.errorDescription || queryError;
        if (error) throw new Error(error);

        // Supabase's normal browser flow returns tokens in the fragment, but
        // some email templates / redirect handlers preserve them as query
        // parameters. Accept both forms before declaring the link empty.
        const accessToken =
          fragment.accessToken || query.get("access_token") || "";
        const refreshToken =
          fragment.refreshToken || query.get("refresh_token") || "";
        const expiresIn = fragment.expiresIn || query.get("expires_in") || "";
        const type = fragment.type || query.get("type") || "";

        if (accessToken) {
          if (type && type !== "recovery") {
            throw new Error("This link is not a password recovery link. Request a new one.");
          }
          auth.adoptTokens({
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: expiresIn,
          });
          if (!cancelled) setToken(accessToken);
        } else {
          const tokenHash = query.get("token_hash") || query.get("token");
          const type = query.get("type");
          if (!tokenHash || type !== "recovery") {
            throw new Error(
              "Supabase redirected to this page without a recovery token. Use the newest reset email link. If it still happens, the email's redirect or verification step is not returning the token."
            );
          }
          const session = await auth.verifyRecoveryToken(tokenHash);
          if (!cancelled) setToken(session.access_token);
        }

        // Remove all credentials before rendering the password form.
        window.history.replaceState(null, "", window.location.pathname);
      } catch (err) {
        if (!cancelled) {
          setLinkError(
            err?.message ||
              "This reset link has expired or was already used. Request a new one from the sign-in screen."
          );
        }
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    }
    establishRecoverySession();
    return () => {
      cancelled = true;
    };
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
          ) : isChecking ? (
            <>
              <h1>Checking reset link</h1>
              <p className="ad-login-sub">Please wait while we verify your link.</p>
            </>
          ) : linkError ? (
            <>
              <h1>Recover your admin account</h1>
              <Alert tone="error" title="This reset link cannot be used">
                {linkError}
              </Alert>
              <p className="ad-login-sub">
                Request a fresh reset email and open only the newest link. A
                reset link can be verified once; older links stop working.
              </p>
              <p className="ad-login-foot">
                <Link to="/admin/forgot-password">Try email reset again</Link>
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
                  <PasswordInput
                    id="reset-password"
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
                  <PasswordInput
                    id="reset-confirm"
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
