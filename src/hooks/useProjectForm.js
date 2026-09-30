import { useCallback, useMemo, useState } from "react";

/**
 * Shared form state, validation and submission lifecycle for the
 * contact and consultation enquiry forms.
 *
 * The previous build validated nothing beyond the browser's native
 * `required` attribute and reported success with the text "Details
 * captured in demo mode", which is not something a client site should
 * ever show a real visitor. This adds field-level validation, accessible
 * error wiring (aria-invalid / aria-describedby), a submitting state and
 * a single clearly-marked integration point for the real backend.
 */

const PHONE_RE = /^[+()\-\s\d]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const VALIDATORS = {
  required: (label) => (value) =>
    value && String(value).trim() ? "" : `${label} is required.`,
  minLength: (label, n) => (value) =>
    !value || String(value).trim().length >= n
      ? ""
      : `${label} should be at least ${n} characters.`,
  phone: () => (value) =>
    !value || PHONE_RE.test(String(value).trim())
      ? ""
      : "Enter a valid phone number, including the country code.",
  email: () => (value) =>
    !value || EMAIL_RE.test(String(value).trim())
      ? ""
      : "Enter a valid email address.",
};

/**
 * @param {object}   options
 * @param {object}   options.initialValues  field name -> initial value
 * @param {object}   options.rules          field name -> array of validator fns
 * @param {Function} [options.onSubmit]     async (values) => void — real backend hook
 */
export default function useProjectForm({ initialValues, rules = {}, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [submitError, setSubmitError] = useState("");

  const validateField = useCallback(
    (name, value) => {
      const fieldRules = rules[name] || [];
      for (const rule of fieldRules) {
        const message = rule(value);
        if (message) return message;
      }
      return "";
    },
    [rules]
  );

  const validateAll = useCallback(() => {
    const next = {};
    Object.keys(rules).forEach((name) => {
      const message = validateField(name, values[name]);
      if (message) next[name] = message;
    });
    return next;
  }, [rules, validateField, values]);

  const handleChange = useCallback(
    (event) => {
      const { name, value } = event.target;
      setValues((prev) => ({ ...prev, [name]: value }));
      // Only clear errors as the user types; don't introduce new ones mid-keystroke.
      setErrors((prev) => {
        if (!prev[name]) return prev;
        const message = validateField(name, value);
        if (message) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });
    },
    [validateField]
  );

  const handleBlur = useCallback(
    (event) => {
      const { name, value } = event.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      const message = validateField(name, value);
      setErrors((prev) => {
        const next = { ...prev };
        if (message) next[name] = message;
        else delete next[name];
        return next;
      });
    },
    [validateField]
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const nextErrors = validateAll();
      setErrors(nextErrors);
      setTouched(
        Object.keys(rules).reduce((acc, key) => ({ ...acc, [key]: true }), {})
      );

      if (Object.keys(nextErrors).length) {
        // Move focus to the first invalid field so keyboard and screen
        // reader users are not left guessing what failed.
        const firstInvalid = Object.keys(nextErrors)[0];
        const el = document.querySelector(`[name="${firstInvalid}"]`);
        if (el && typeof el.focus === "function") el.focus();
        return;
      }

      setStatus("submitting");
      setSubmitError("");

      try {
        if (onSubmit) {
          await onSubmit(values);
        } else {
          /* ----------------------------------------------------------
           * BACKEND INTEGRATION POINT
           * ----------------------------------------------------------
           * No enquiry endpoint is specified in the documentation
           * (the commercial model is listed as [TO CONFIRM]), so the
           * submission is held client-side rather than silently
           * discarded or posted to an invented URL.
           *
           * Replace this block with the real call, e.g.
           *   await fetch("/api/enquiries", {
           *     method: "POST",
           *     headers: { "Content-Type": "application/json" },
           *     body: JSON.stringify(values),
           *   });
           * -------------------------------------------------------- */
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
        setStatus("success");
      } catch (err) {
        // The visitor sees neutral copy; the developer needs the real cause,
        // which is usually a missing env var or an RLS policy rejection.
        if (process.env.NODE_ENV !== "production") {
          console.error("[useProjectForm] Submission failed:", err);
        }
        setStatus("error");
        setSubmitError(
          "We could not send your details just now. Please try again, or contact us directly."
        );
      }
    },
    [onSubmit, rules, validateAll, values]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setStatus("idle");
    setSubmitError("");
  }, [initialValues]);

  /** Props to spread onto an input/select/textarea for a given field. */
  const fieldProps = useCallback(
    (name) => {
      const hasError = Boolean(errors[name] && touched[name]);
      return {
        name,
        value: values[name] ?? "",
        onChange: handleChange,
        onBlur: handleBlur,
        "aria-invalid": hasError || undefined,
        "aria-describedby": hasError ? `${name}-error` : undefined,
      };
    },
    [errors, handleBlur, handleChange, touched, values]
  );

  const errorFor = useCallback(
    (name) => (touched[name] ? errors[name] || "" : ""),
    [errors, touched]
  );

  const errorCount = useMemo(() => Object.keys(errors).length, [errors]);

  return {
    values,
    errors,
    touched,
    status,
    submitError,
    errorCount,
    fieldProps,
    errorFor,
    handleSubmit,
    reset,
    isSubmitting: status === "submitting",
    isSuccess: status === "success",
  };
}
