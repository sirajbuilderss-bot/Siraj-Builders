/**
 * RESOURCE MANAGER
 * ============================================================================
 * One generic list-plus-modal CRUD screen, configured per table.
 *
 * Projects, services, testimonials, FAQs, team members, statistics, hero
 * slides and social links all need the same six things: load a list, show it
 * in a table, open a form to create, open the same form to edit, confirm a
 * delete, and toast the result. Writing eight near-identical screens would
 * mean eight places for a bug to hide and eight places to fix it.
 *
 * Each screen therefore supplies a config object — columns, form fields,
 * defaults, service functions — and this component does the rest. Screens
 * that need something unusual pass `renderExtraActions` or `beforeSave`
 * rather than forking the component.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Field,
  Check,
  MediaUrlField,
  Modal,
  Confirm,
  Toast,
  useToast,
  Empty,
  Loading,
  Alert,
} from "./ui";
import { log } from "../../services/activity";

export default function ResourceManager({
  /* Copy */
  title,
  singular,
  description,
  emptyTitle,
  emptyBody,

  /* Data access */
  load,
  create,
  update,
  remove,
  entity,

  /* Presentation */
  columns,
  fields,
  defaults = {},
  labelOf = (row) => row.title || row.label || row.name || row.id,
  validate,
  beforeSave,
  mapRowToForm,
  renderExtraActions,
  searchKeys = [],

  /* ---- added in the CMS release ---- */
  reorder,              // async (orderedIds) => void — shows up/down controls
  toggle,               // { field, on, off } — one-click publish / hide
  renderFormExtras,     // (row, { refresh, toast }) => node, edit mode only
  stayOpenAfterCreate,  // reopen a new row in edit mode (e.g. to add photos)
  wideModal,            // larger editor for long forms
  filters,              // [{ key, label, test: (row) => bool }]
}) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");

  const [editing, setEditing] = useState(null); // row | "new" | null
  const [values, setValues] = useState(defaults);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  const toast = useToast();

  /* ---------------------------------------------------------------- load */

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await load();
      setRows(data || []);
      setLoadError("");
    } catch (error) {
      setLoadError(
        error?.message ||
          "Could not load records. Check your Supabase connection and that the SQL scripts have been run."
      );
    } finally {
      setIsLoading(false);
    }
  }, [load]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /* -------------------------------------------------------------- search */

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filter = (filters || []).find((item) => item.key === activeFilter);
    const base = filter ? rows.filter(filter.test) : rows;
    if (!term) return base;
    const keys = searchKeys.length
      ? searchKeys
      : columns.map((column) => column.key);
    return base.filter((row) =>
      keys.some((key) => String(row[key] ?? "").toLowerCase().includes(term))
    );
  }, [rows, search, searchKeys, columns, filters, activeFilter]);

  /* Reordering only makes sense on the full, unfiltered list. */
  const canReorder = Boolean(reorder) && !search.trim() && activeFilter === "all";

  async function move(row, direction) {
    const from = rows.findIndex((item) => item.id === row.id);
    const to = direction === "up" ? from - 1 : from + 1;
    if (from < 0 || to < 0 || to >= rows.length) return;
    const next = rows.slice();
    [next[from], next[to]] = [next[to], next[from]];
    setRows(next);
    setBusyId(row.id);
    try {
      await reorder(next.map((item) => item.id));
    } catch (error) {
      toast.show(error?.message || "Could not save the new order.", "error");
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function flip(row) {
    if (!toggle) return;
    setBusyId(row.id);
    try {
      await update(row.id, { [toggle.field]: !row[toggle.field] });
      log("update", entity, {
        entityId: row.id,
        summary: `${row[toggle.field] ? "Hid" : "Published"} ${singular.toLowerCase()} “${labelOf(row)}”`,
      });
      setRows((current) =>
        current.map((item) => (item.id === row.id ? { ...item, [toggle.field]: !row[toggle.field] } : item))
      );
      toast.show(row[toggle.field] ? `${singular} hidden.` : `${singular} published.`);
    } catch (error) {
      toast.show(error?.message || "Could not update.", "error");
    } finally {
      setBusyId(null);
    }
  }

  /* ---------------------------------------------------------------- form */

  function openCreate() {
    setValues({ ...defaults });
    setErrors({});
    setEditing("new");
  }

  function openEdit(row) {
    // Only pull the keys the form actually owns, so database-managed columns
    // (id, created_at, updated_at) are never echoed back in the update.
    const next = { ...defaults };
    fields.forEach((field) => {
      if (field.type === "heading" || field.type === "custom") return;
      next[field.name] = row[field.name] ?? defaults[field.name] ?? "";
    });
    // Screens whose form shape differs from the row shape — a jsonb array
    // edited as newline-separated text, say — convert here.
    setValues(mapRowToForm ? mapRowToForm(next, row) : next);
    setErrors({});
    setEditing(row);
  }

  /* Set by form extras (the project media manager) when they change the
     row behind the form, so the table refreshes once the editor closes
     rather than re-rendering the open editor mid-task. */
  const extrasChanged = useRef(false);

  function closeForm() {
    if (isSaving) return;
    setEditing(null);
    setErrors({});
    if (extrasChanged.current) {
      extrasChanged.current = false;
      refresh();
    }
  }

  function setValue(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  function runValidation() {
    const next = {};

    fields.forEach((field) => {
      if (field.type === "heading" || field.type === "custom") return;
      const raw = values[field.name];
      const value = typeof raw === "string" ? raw.trim() : raw;

      if (field.required && (value === "" || value === undefined || value === null)) {
        next[field.name] = `${field.label} is required.`;
        return;
      }
      if (field.type === "url" && value && !/^https?:\/\//i.test(String(value))) {
        next[field.name] = "Enter a full URL starting with http:// or https://";
      }
      if (field.minLength && value && String(value).length < field.minLength) {
        next[field.name] =
          `${field.label} should be at least ${field.minLength} characters.`;
      }
    });

    if (validate) Object.assign(next, validate(values) || {});
    return next;
  }

  async function save(event) {
    event.preventDefault();
    const nextErrors = runValidation();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      const first = Object.keys(nextErrors)[0];
      document.getElementById(`f-${first}`)?.focus();
      return;
    }

    setIsSaving(true);
    try {
      let payload = { ...values };
      fields.forEach((field) => {
        if (typeof payload[field.name] === "string") {
          payload[field.name] = payload[field.name].trim();
        }
      });
      if (beforeSave) payload = beforeSave(payload, editing);

      if (editing === "new") {
        const created = await create(payload);
        log("create", entity, {
          entityId: created?.id,
          summary: `Created ${singular.toLowerCase()} “${labelOf(created || payload)}”`,
        });
        if (stayOpenAfterCreate && created?.id) {
          toast.show(`${singular} created — you can now add the rest below.`);
          setEditing(created);
          await refresh();
          return;
        }
        toast.show(`${singular} created.`);
      } else {
        const updated = await update(editing.id, payload);
        log("update", entity, {
          entityId: editing.id,
          summary: `Updated ${singular.toLowerCase()} “${labelOf(updated || payload)}”`,
        });
        toast.show(`${singular} updated.`);
      }

      setEditing(null);
      await refresh();
    } catch (error) {
      const message = error?.message || "Save failed.";
      setErrors({ __form: message });
      toast.show(message, "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    setIsDeleting(true);
    try {
      await remove(deleting.id);
      log("delete", entity, {
        entityId: deleting.id,
        summary: `Deleted ${singular.toLowerCase()} “${labelOf(deleting)}”`,
      });
      toast.show(`${singular} deleted.`);
      setDeleting(null);
      await refresh();
    } catch (error) {
      toast.show(error?.message || "Delete failed.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  /* ---------------------------------------------------------------- view */

  return (
    <>
      {description && <p className="ad-section-note">{description}</p>}

      {loadError && (
        <Alert tone="error" title="Could not load records">
          {loadError}
        </Alert>
      )}

      {filters && filters.length > 0 && (
        <div className="ad-filter-tabs" role="group" aria-label={`Filter ${title.toLowerCase()}`}>
          {[{ key: "all", label: "All", test: () => true }, ...filters].map((item) => (
            <button
              key={item.key}
              type="button"
              className={activeFilter === item.key ? "is-active" : ""}
              aria-pressed={activeFilter === item.key}
              onClick={() => setActiveFilter(item.key)}
            >
              {item.label}
              <span>{rows.filter(item.test).length}</span>
            </button>
          ))}
        </div>
      )}

      <div className="ad-toolbar">
        <div className="ad-search">
          <input
            type="search"
            value={search}
            placeholder={`Search ${title.toLowerCase()}…`}
            aria-label={`Search ${title}`}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <button className="ad-btn ad-btn-accent" type="button" onClick={openCreate}>
          Add {singular.toLowerCase()}
        </button>
      </div>

      <div className="ad-card">
        {isLoading ? (
          <Loading />
        ) : visible.length === 0 ? (
          <Empty title={search ? "No matches" : emptyTitle || `No ${title.toLowerCase()} yet`}>
            {search ? (
              <p>Nothing matched “{search}”.</p>
            ) : (
              emptyBody && <p>{emptyBody}</p>
            )}
          </Empty>
        ) : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  {reorder && <th className="ad-col-order">Order</th>}
                  {columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.id} className={busyId === row.id ? "is-busy" : undefined}>
                    {reorder && (
                      <td className="ad-col-order">
                        <div className="ad-order-btns">
                          <button
                            type="button"
                            className="ad-icon-btn"
                            aria-label={`Move “${labelOf(row)}” up`}
                            title={canReorder ? "Move up" : "Clear search and filters to reorder"}
                            disabled={!canReorder || Boolean(busyId) || rows[0]?.id === row.id}
                            onClick={() => move(row, "up")}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="ad-icon-btn"
                            aria-label={`Move “${labelOf(row)}” down`}
                            title={canReorder ? "Move down" : "Clear search and filters to reorder"}
                            disabled={!canReorder || Boolean(busyId) || rows[rows.length - 1]?.id === row.id}
                            onClick={() => move(row, "down")}
                          >
                            ↓
                          </button>
                        </div>
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.key}>
                        {column.render ? column.render(row) : row[column.key] || "—"}
                      </td>
                    ))}
                    <td>
                      <div className="ad-row-actions">
                        {renderExtraActions?.(row, { refresh, toast })}
                        {toggle && (
                          <button
                            className="ad-btn ad-btn-ghost ad-btn-sm"
                            type="button"
                            disabled={busyId === row.id}
                            onClick={() => flip(row)}
                          >
                            {row[toggle.field] ? toggle.off || "Hide" : toggle.on || "Publish"}
                          </button>
                        )}
                        <button
                          className="ad-btn ad-btn-ghost ad-btn-sm"
                          type="button"
                          onClick={() => openEdit(row)}
                        >
                          Edit
                        </button>
                        <button
                          className="ad-btn ad-btn-danger ad-btn-sm"
                          type="button"
                          onClick={() => setDeleting(row)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && rows.length > 0 && (
          <div className="ad-pager">
            <span>
              {visible.length} of {rows.length} {title.toLowerCase()}
            </span>
          </div>
        )}
      </div>

      {/* ---- Create / edit ---- */}
      {editing && (
        <Modal
          title={editing === "new" ? `Add ${singular.toLowerCase()}` : `Edit ${singular.toLowerCase()}`}
          onClose={closeForm}
          wide={wideModal}
          footer={
            <>
              <button
                className="ad-btn ad-btn-ghost"
                type="button"
                onClick={closeForm}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className="ad-btn ad-btn-primary"
                type="submit"
                form="resource-form"
                disabled={isSaving}
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
            </>
          }
        >
          <form id="resource-form" onSubmit={save} noValidate>
            {errors.__form && (
              <Alert tone="error" title="Could not save">
                {errors.__form}
              </Alert>
            )}

            <div className="ad-form-grid">
              {fields.map((field) => {
                if (field.type === "heading") {
                  return (
                    <div className="ad-form-heading ad-field-wide" key={`h-${field.label}`}>
                      <h3>{field.label}</h3>
                      {field.help && <p>{field.help}</p>}
                    </div>
                  );
                }

                if (field.type === "custom") {
                  return (
                    <div className={field.wide === false ? "ad-field" : "ad-field ad-field-wide"} key={field.name}>
                      {field.render({ values, setValue, errors, editing })}
                    </div>
                  );
                }

                if (field.type === "checkbox") {
                  return (
                    <div className="ad-field-wide" key={field.name}>
                      <Check
                        label={field.label}
                        hint={field.help}
                        name={field.name}
                        checked={values[field.name]}
                        onChange={setValue}
                      />
                    </div>
                  );
                }

                if (field.type === "media") {
                  return (
                    <MediaUrlField
                      key={field.name}
                      label={field.label}
                      name={field.name}
                      kind={field.kind}
                      help={field.help}
                      folder={field.folder || entity}
                      value={values[field.name]}
                      onChange={setValue}
                      error={errors[field.name]}
                      wide
                    />
                  );
                }

                return (
                  <Field
                    key={field.name}
                    {...field}
                    value={values[field.name]}
                    onChange={setValue}
                    error={errors[field.name]}
                    wide={field.wide || field.type === "textarea"}
                  />
                );
              })}
            </div>
          </form>

          {editing !== "new" &&
            renderFormExtras?.(editing, {
              toast,
              markChanged: () => {
                extrasChanged.current = true;
              },
            })}
          {editing === "new" && renderFormExtras && stayOpenAfterCreate && (
            <p className="ad-form-hint">
              Save once to unlock the rest of this form — photos and videos
              are added after the first save.
            </p>
          )}
        </Modal>
      )}

      {/* ---- Delete ---- */}
      {deleting && (
        <Confirm
          title={`Delete this ${singular.toLowerCase()}?`}
          message={`“${labelOf(deleting)}” will be permanently removed. This cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
          busy={isDeleting}
        />
      )}

      <Toast message={toast.message} tone={toast.tone} onDone={toast.clear} />
    </>
  );
}
