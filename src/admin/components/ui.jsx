/**
 * ADMIN UI PRIMITIVES
 * ============================================================================
 * Small, unstyled-by-default building blocks shared across every admin
 * screen. All styling comes from styles/admin.css and is scoped to
 * `.admin-root`, so none of it can affect the public site.
 */

import { useEffect, useRef, useState } from "react";

/* ==========================================================================
 * FIELD
 * ========================================================================== */

export function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  help,
  required,
  options,
  rows = 4,
  placeholder,
  wide,
  disabled,
  min,
  max,
}) {
  const id = `f-${name}`;
  const describedBy = error ? `${id}-error` : help ? `${id}-help` : undefined;

  const shared = {
    id,
    name,
    value: value ?? "",
    onChange: (event) => onChange(name, event.target.value),
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    placeholder,
    disabled,
  };

  return (
    <div
      className={`ad-field${error ? " has-error" : ""}${wide ? " ad-field-wide" : ""}`}
    >
      <label className="ad-label" htmlFor={id}>
        {label}
        {required && (
          <span className="ad-req" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {type === "textarea" && <textarea {...shared} rows={rows} />}

      {type === "select" && (
        <select {...shared}>
          {(options || []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {type !== "textarea" && type !== "select" && (
        <input
          {...shared}
          type={type}
          min={min}
          max={max}
          onChange={(event) =>
            onChange(
              name,
              type === "number" && event.target.value !== ""
                ? Number(event.target.value)
                : event.target.value
            )
          }
        />
      )}

      {error && (
        <span className="ad-field-error" id={`${id}-error`} role="alert">
          {error}
        </span>
      )}
      {!error && help && (
        <span className="ad-field-help" id={`${id}-help`}>
          {help}
        </span>
      )}
    </div>
  );
}

/* ==========================================================================
 * CHECKBOX
 * ========================================================================== */

export function Check({ label, hint, name, checked, onChange, disabled }) {
  return (
    <label className="ad-check">
      <input
        type="checkbox"
        name={name}
        checked={Boolean(checked)}
        disabled={disabled}
        onChange={(event) => onChange(name, event.target.checked)}
      />
      <span className="ad-check-text">
        <b>{label}</b>
        {hint && <span>{hint}</span>}
      </span>
    </label>
  );
}

/* ==========================================================================
 * MEDIA URL FIELD
 * --------------------------------------------------------------------------
 * File uploads are deliberately not implemented — the project runs on the
 * Supabase free tier and storage is out of scope. This field is what replaces
 * an upload control: it takes an external URL, explains where to host the
 * file, and previews the result so a typo is obvious before saving.
 * ========================================================================== */

export function MediaUrlField({
  label = "Image URL",
  name,
  value,
  onChange,
  error,
  wide,
  kind = "image",
}) {
  const [failed, setFailed] = useState(false);
  const previous = useRef(value);

  useEffect(() => {
    if (previous.current !== value) {
      previous.current = value;
      setFailed(false);
    }
  }, [value]);

  const isVideo = kind === "video";

  return (
    <div className={`ad-field${error ? " has-error" : ""}${wide ? " ad-field-wide" : ""}`}>
      <label className="ad-label" htmlFor={`f-${name}`}>
        {label}
      </label>

      <input
        id={`f-${name}`}
        name={name}
        type="url"
        value={value ?? ""}
        placeholder="https://…"
        onChange={(event) => onChange(name, event.target.value)}
        aria-describedby={`f-${name}-note`}
      />

      {error && (
        <span className="ad-field-error" role="alert">
          {error}
        </span>
      )}

      <p className="ad-media-note" id={`f-${name}-note`}>
        Upload your {isVideo ? "video" : "image"} externally and paste the
        public URL here — {isVideo
          ? "YouTube, Vimeo or any direct video host"
          : "Cloudinary, ImgBB, Google Drive (public link) or any image host"}
        . Files are not stored in Supabase; only the URL is saved.
      </p>

      {value && !isVideo && (
        <div className="ad-media-preview">
          {failed ? (
            <div className="ad-media-fail">
              That URL did not load. Check it is a direct link to the image and
              that the file is publicly visible.
            </div>
          ) : (
            <img src={value} alt="" onError={() => setFailed(true)} />
          )}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
 * MODAL
 * ========================================================================== */

export function Modal({ title, onClose, children, footer, small }) {
  const ref = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    // Stop the page behind the modal scrolling under it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus in, so keyboard users are not left at the top of the page.
    const timer = window.setTimeout(() => {
      const focusable = ref.current?.querySelector(
        "input, select, textarea, button"
      );
      if (focusable) focusable.focus();
    }, 40);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <div
      className="ad-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`ad-modal${small ? " ad-modal-sm" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
      >
        <div className="ad-modal-head">
          <h2>{title}</h2>
          <button
            className="ad-modal-close"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="ad-modal-body">{children}</div>
        {footer && <div className="ad-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ==========================================================================
 * CONFIRM DIALOG
 * ========================================================================== */

export function Confirm({
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  busy,
}) {
  return (
    <Modal
      small
      title={title}
      onClose={busy ? () => {} : onCancel}
      footer={
        <>
          <button
            className="ad-btn ad-btn-ghost"
            type="button"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            className="ad-btn ad-btn-danger"
            type="button"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ fontSize: "14px", lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}

/* ==========================================================================
 * TOAST
 * ========================================================================== */

export function Toast({ message, tone = "ok", onDone, duration = 3200 }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(onDone, duration);
    return () => window.clearTimeout(timer);
  }, [message, onDone, duration]);

  if (!message) return null;

  return (
    <div
      className={`ad-toast${tone === "error" ? " is-error" : ""}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}

/** Toast state in one call: `const toast = useToast();` */
export function useToast() {
  const [state, setState] = useState({ message: "", tone: "ok" });
  return {
    ...state,
    show: (message, tone = "ok") => setState({ message, tone }),
    clear: () => setState({ message: "", tone: "ok" }),
  };
}

/* ==========================================================================
 * SMALL DISPLAY HELPERS
 * ========================================================================== */

export function Pill({ children, tone }) {
  const cls = tone ? ` is-${tone}` : "";
  return <span className={`ad-pill${cls}`}>{children}</span>;
}

export function Empty({ title, children }) {
  return (
    <div className="ad-empty">
      <b>{title}</b>
      {children}
    </div>
  );
}

export function Loading({ label = "Loading…" }) {
  return (
    <div className="ad-loading" role="status">
      {label}
    </div>
  );
}

export function Alert({ tone = "info", title, children }) {
  return (
    <div className={`ad-alert ad-alert-${tone}`} role={tone === "error" ? "alert" : undefined}>
      {title && <b>{title}</b>}
      {children}
    </div>
  );
}

/* ==========================================================================
 * FORMATTING
 * ========================================================================== */

export function formatDate(value, { withTime = true } = {}) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function relativeTime(value) {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.round((Date.now() - then) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(value, { withTime: false });
}
