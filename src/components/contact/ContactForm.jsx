import useProjectForm, { VALIDATORS } from "../../hooks/useProjectForm";
import { createSubmission } from "../../services/submissions";
import { useSiteData } from "../../context/SiteDataContext";
import { ArrowRight, Check } from "../ui/Icons";

/**
 * CONTACT FORM
 * Fields follow the documentation's contact form: name, phone, email,
 * project type, property location, plot/property size, estimated budget,
 * expected start, required service and project description. Only name,
 * phone, project type and description are required — the rest helps the
 * first conversation but should never block an enquiry.
 *
 * Submissions go to public.submissions (form_type = 'contact'); the success
 * message and microcopy are editable in Admin → Settings → Forms.
 */

const RULES = {
  name: [VALIDATORS.required("Full name"), VALIDATORS.minLength("Full name", 2)],
  phone: [VALIDATORS.required("Phone"), VALIDATORS.phone()],
  email: [VALIDATORS.email()],
  projectType: [VALIDATORS.required("Project type")],
  description: [
    VALIDATORS.required("Project description"),
    VALIDATORS.minLength("Project description", 20),
  ],
};

const INITIAL = {
  name: "",
  phone: "",
  email: "",
  projectType: "",
  location: "",
  size: "",
  budget: "",
  startDate: "",
  service: "",
  description: "",
};

const submitContact = (values) => createSubmission(values, "contact");

function FieldError({ name, message }) {
  if (!message) return null;
  return (
    <span className="cform-error" id={`${name}-error`} role="alert">
      {message}
    </span>
  );
}

export default function ContactForm({
  heading = "Tell us about your project.",
  intro = "The more we understand about your project, the better we can guide the initial conversation.",
  eyebrow = "Contact form",
}) {
  const { serviceLinks, settingValue } = useSiteData();
  const form = useProjectForm({ initialValues: INITIAL, rules: RULES, onSubmit: submitContact });

  const successMessage = settingValue(
    "form_success_message",
    "Thank you. Your project details have been received. Our team will review the information and contact you regarding the next step."
  );
  const microcopy = settingValue(
    "form_microcopy",
    "Your information is used to understand your project and determine the appropriate next step."
  );

  if (form.isSuccess) {
    return (
      <div className="cform-success" role="status" aria-live="polite">
        <span className="cform-mark" aria-hidden="true">
          <Check size={22} />
        </span>
        <h2>Thank you.</h2>
        <p>{successMessage.replace(/^Thank you\.\s*/, "")}</p>
        <button className="btn btn-ghost" type="button" onClick={form.reset}>
          Submit another request
        </button>
      </div>
    );
  }

  const field = (name, label, props = {}, required = false) => (
    <label className={props.wide ? "cform-wide" : undefined}>
      <span className="cform-label">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </span>
      {props.as === "select" ? (
        <select {...form.fieldProps(name)}>{props.children}</select>
      ) : props.as === "textarea" ? (
        <textarea {...form.fieldProps(name)} rows={5} placeholder={props.placeholder} />
      ) : (
        <input
          {...form.fieldProps(name)}
          type={props.type || "text"}
          autoComplete={props.autoComplete}
          placeholder={props.placeholder}
          inputMode={props.inputMode}
        />
      )}
      <FieldError name={name} message={form.errorFor(name)} />
    </label>
  );

  return (
    <form className="cform reveal" onSubmit={form.handleSubmit} noValidate>
      <div className="cform-head">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{heading}</h2>
        {intro && <p className="muted">{intro}</p>}
      </div>

      <div className="cform-fields">
        {field("name", "Full name", { autoComplete: "name", placeholder: "Your name" }, true)}
        {field("phone", "Phone", { type: "tel", autoComplete: "tel", placeholder: "Include country code", inputMode: "tel" }, true)}
        {field("email", "Email", { type: "email", autoComplete: "email", placeholder: "you@example.com" })}
        {field(
          "projectType",
          "Project type",
          {
            as: "select",
            children: (
              <>
                <option value="">Select a type</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="renovation">Renovation</option>
                <option value="unsure">Not sure yet</option>
              </>
            ),
          },
          true
        )}
        {field("location", "Property location", { placeholder: "Area / city" })}
        {field("size", "Plot / property size", { placeholder: "e.g. 10 marla" })}
        {field("budget", "Estimated budget", { placeholder: "Approximate range" })}
        {field("startDate", "Expected start", { placeholder: "e.g. Within 3 months" })}
        {field("service", "Required service", {
          as: "select",
          children: (
            <>
              <option value="">Select a service</option>
              {serviceLinks.map((service) => (
                <option key={service.to} value={service.label}>
                  {service.label}
                </option>
              ))}
              <option value="Not sure">Not sure yet</option>
            </>
          ),
        })}
        {field(
          "description",
          "Project description",
          { as: "textarea", wide: true, placeholder: "Tell us what you are planning and what matters most." },
          true
        )}
      </div>

      <p className="cform-micro">{microcopy}</p>

      {form.submitError && (
        <p className="cform-fail" role="alert">
          {form.submitError}
        </p>
      )}

      <button className="btn btn-primary" type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? "Sending…" : "Discuss My Project"}
        {!form.isSubmitting && (
          <span className="arrow">
            <ArrowRight size={18} />
          </span>
        )}
      </button>
    </form>
  );
}
