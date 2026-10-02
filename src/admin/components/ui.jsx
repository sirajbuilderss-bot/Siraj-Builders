/**
 * ADMIN UI PRIMITIVES
 * ============================================================================
 * Small, unstyled-by-default building blocks shared across every admin
 * screen. All styling comes from styles/admin.css and is scoped to
 * `.admin-root`, so none of it can affect the public site.
 */

import { useEffect, useRef, useState } from "react";
import { storage } from "../../lib/supabase";
import { toEmbed } from "../../lib/video";

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
  help,
  folder = "uploads",
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
  const embed = isVideo ? toEmbed(value) : null;

  return (
    <div className={`ad-field${error ? " has-error" : ""}${wide ? " ad-field-wide" : ""}`}>
      <label className="ad-label" htmlFor={`f-${name}`}>
        {label}
      </label>

      <div className="ad-media-row">
        <input
          id={`f-${name}`}
          name={name}
          type="url"
          value={value ?? ""}
          placeholder={isVideo ? "Paste a YouTube / Vimeo link, or upload" : "Paste an image link, or upload"}
          onChange={(event) => onChange(name, event.target.value)}
          aria-describedby={`f-${name}-note`}
        />
        <UploadButton
          accept={isVideo ? "video/mp4,video/webm" : "image/*"}
          folder={folder}
          label="Upload"
          onUploaded={([file]) => file && onChange(name, file.url)}
        />
        {value && (
          <button
            type="button"
            className="ad-btn ad-btn-ghost ad-btn-sm"
            onClick={() => onChange(name, "")}
            aria-label={`Clear ${label}`}
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <span className="ad-field-error" role="alert">
          {error}
        </span>
      )}

      <p className="ad-media-help" id={`f-${name}-note`}>
        {help ||
          (isVideo
            ? "Upload an MP4 (under 50 MB) or paste a YouTube, Vimeo or Google Drive link."
            : "Upload a JPG, PNG or WebP (under 10 MB), or paste a public image link.")}
      </p>

      {value && !isVideo && (
        <div className="ad-media-preview">
          {failed ? (
            <div className="ad-media-fail">
              That link did not load. Check it is a direct link to the image and
              that the file is publicly visible.
            </div>
          ) : (
            <img src={value} alt="" onError={() => setFailed(true)} />
          )}
        </div>
      )}
      {value && isVideo && (
        <div className="ad-media-help">
          {embed ? "Video link recognised — it will play on the website." : "This link is not a recognised video — visitors will see an “Open video” link instead."}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
 * UPLOAD BUTTON
 * --------------------------------------------------------------------------
 * Uploads to the public `site-media` Supabase Storage bucket. Only active
 * editors and admins can upload — the storage policies enforce that.
 * Calls onUploaded([{ url, path, name, type }]) once every file is done.
 * ========================================================================== */

const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;

export function UploadButton({
  accept = "image/*",
  multiple = false,
  folder = "uploads",
  label = "Upload",
  onUploaded,
  onError,
  className = "ad-btn ad-btn-ghost ad-btn-sm",
}) {
  const input = useRef(null);
  const [progress, setProgress] = useState(null); // "2 / 5"
  const [message, setMessage] = useState("");

  async function handle(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setMessage("");
    const done = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const isVideo = file.type.startsWith("video/");
      if (file.size > (isVideo ? MAX_VIDEO : MAX_IMAGE)) {
        const text = `“${file.name}” is too large (${(file.size / 1048576).toFixed(1)} MB). Limit: ${isVideo ? 50 : 10} MB.`;
        setMessage(text);
        onError?.(text);
        continue;
      }
      setProgress(files.length > 1 ? `${i + 1} / ${files.length}` : "…");
      try {
        const result = await storage.upload(file, { folder });
        done.push({ ...result, name: file.name, type: file.type });
      } catch (error) {
        const text = error?.message || `Could not upload “${file.name}”.`;
        setMessage(text);
        onError?.(text);
      }
    }
    setProgress(null);
    if (done.length) onUploaded?.(done);
  }

  return (
    <span className="ad-upload">
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handle}
        hidden
        tabIndex={-1}
      />
      <button
        type="button"
        className={className}
        onClick={() => input.current?.click()}
        disabled={Boolean(progress)}
      >
        {progress ? `Uploading ${progress}` : label}
      </button>
      {message && (
        <span className="ad-upload-error" role="alert">
          {message}
        </span>
      )}
    </span>
  );
}

/* ==========================================================================
 * MODAL
 * ========================================================================== */

export function Modal({ title, onClose, children, footer, small, wide }) {
  const ref = useRef(null);
  /* onClose is held in a ref so this effect runs once per opening. It used
     to depend on onClose directly; callers pass a new function on every
     render, so each keystroke re-ran the effect and pulled focus back to the
     first input of the form. */
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKeyDown);

    // Stop the page behind the modal scrolling under it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus in once, so keyboard users start inside the dialog.
    const timer = window.setTimeout(() => {
      const focusable = ref.current?.querySelector(
        ".ad-modal-body input, .ad-modal-body select, .ad-modal-body textarea, button"
      );
      if (focusable) focusable.focus();
    }, 40);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div
      className="ad-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeRef.current();
      }}
    >
      <div
        className={`ad-modal${small ? " ad-modal-sm" : ""}${wide ? " ad-modal-wide" : ""}`}
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
