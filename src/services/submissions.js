/**
 * SUBMISSIONS SERVICE
 * ============================================================================
 * The single place where enquiry form values become database rows.
 *
 * Both site forms — contact and consultation — write to `public.submissions`,
 * distinguished by `form_type`. The contact form's fields are a subset of the
 * consultation form's, so the unused columns are simply left null.
 *
 * Form state is camelCase (it mirrors the input names); Postgres columns are
 * snake_case. That translation lives here and nowhere else.
 */

import { db } from "../lib/supabase";

/** Empty string → null, so optional columns stay genuinely empty. */
function blankToNull(value) {
  const trimmed = typeof value === "string" ? value.trim() : value;
  return trimmed === "" || trimmed === undefined ? null : trimmed;
}

function toRow(values, formType) {
  return {
    form_type: formType,
    name: String(values.name || "").trim(),
    phone: String(values.phone || "").trim(),
    email: blankToNull(values.email),
    project_type: blankToNull(values.projectType),
    description: blankToNull(values.description),

    // Consultation-only — absent on the contact form.
    location: blankToNull(values.location),
    size: blankToNull(values.size),
    budget: blankToNull(values.budget),
    start_date: blankToNull(values.startDate),
    service: blankToNull(values.service),

    source_page:
      typeof window !== "undefined" ? window.location.pathname : null,
    user_agent:
      typeof navigator !== "undefined"
        ? String(navigator.userAgent).slice(0, 500)
        : null,
  };
}

/**
 * Writes one enquiry. Throws on failure so the form's existing error path
 * runs — the caller must never report success for a row that did not land.
 *
 * Note the absence of `.select()`. The anon role can insert here but cannot
 * read the table back (see database/policies.sql), so asking PostgREST to
 * return the inserted row would make the write fail against the very policy
 * that keeps one visitor from reading another's enquiry. The insert resolves
 * on a 201 and that is all the form needs.
 *
 * @param {object} values    form state
 * @param {"contact"|"consultation"} formType
 */
export async function createSubmission(values, formType = "contact") {
  await db.from("submissions").insert(toRow(values, formType)).run();
  return true;
}

/* --------------------------------------------------------------------------
 * ADMIN READS
 * RLS blocks every one of these for anonymous visitors; they resolve only
 * for a signed-in user with an active row in admin_users.
 * ------------------------------------------------------------------------ */

/**
 * Paged, searchable, filterable submission list for the admin panel.
 *
 * @returns {Promise<{ rows: object[], total: number|null }>}
 */
export async function listSubmissions({
  page = 1,
  perPage = 25,
  search = "",
  formType = "all",
  status = "all",
} = {}) {
  const from = (page - 1) * perPage;
  let query = db
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, from + perPage - 1)
    .withCount();

  if (formType !== "all") query = query.eq("form_type", formType);
  if (status !== "all") query = query.eq("status", status);

  const term = search.trim();
  if (term) {
    const safe = term.replace(/[*,()]/g, "");
    query = query.or(
      [
        `name.ilike.*${safe}*`,
        `email.ilike.*${safe}*`,
        `phone.ilike.*${safe}*`,
        `location.ilike.*${safe}*`,
        `description.ilike.*${safe}*`,
      ].join(",")
    );
  }

  const { data, count } = await query.run();
  return { rows: data || [], total: count };
}

export async function getSubmission(id) {
  const { data } = await db
    .from("submissions")
    .select("*")
    .eq("id", id)
    .single()
    .run();
  return data;
}

export async function updateSubmission(id, patch) {
  const { data } = await db
    .from("submissions")
    .update(patch)
    .eq("id", id)
    .select("*")
    .run();
  return Array.isArray(data) ? data[0] : data;
}

export async function deleteSubmission(id) {
  await db.from("submissions").delete().eq("id", id).run();
}

export async function markRead(id, isRead = true) {
  return updateSubmission(id, { is_read: isRead });
}

/** Unpaged fetch used by CSV and PDF export, so exports honour the filters. */
export async function exportSubmissions({
  search = "",
  formType = "all",
  status = "all",
  limit = 1000,
} = {}) {
  const { rows } = await listSubmissions({
    page: 1,
    perPage: limit,
    search,
    formType,
    status,
  });
  return rows;
}
