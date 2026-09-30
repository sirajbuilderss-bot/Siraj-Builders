import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSiteMap } from "../SiteMapContext";
import SetupNotice from "../components/SetupNotice";
import {
  Alert,
  Check,
  Confirm,
  Empty,
  Field,
  Loading,
  MediaUrlField,
  Modal,
  Pill,
  Toast,
  useToast,
} from "../components/ui";
import sections, {
  PAGE_REGISTRY,
  SECTION_TYPES,
  positionLabel,
  sectionTypeOf,
  sourceOf,
} from "../../services/sections";

/**
 * PAGE BUILDER
 * ============================================================================
 * The visual map of the website: every page down the left, the sections on
 * the selected page down the middle, and the editor for one section in a
 * modal over the top.
 *
 * The thing this screen exists to answer is "what am I about to change?" —
 * so every section row states its page, its name and where it sits, and the
 * editor repeats all three above the form. An admin should never have to
 * guess which part of the website a form is wired to.
 */

/* --------------------------------------------------------------------------
 * SECTION EDITOR
 * ------------------------------------------------------------------------ */

const BLANK = {
  page_path: "/",
  section_key: "",
  label: "",
  section_type: "content",
  eyebrow: "",
  title: "",
  subtitle: "",
  body: "",
  items: [],
  media_url: "",
  video_url: "",
  cta_label: "",
  cta_href: "",
  is_enabled: true,
};

/** `items` is jsonb in the database and one-per-line in the textarea. */
function itemsToText(items) {
  if (!Array.isArray(items)) return "";
  return items
    .map((item) =>
      typeof item === "string" ? item : [item?.title, item?.body].filter(Boolean).join(" — ")
    )
    .join("\n");
}

function textToItems(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const split = line.indexOf(" — ");
      if (split === -1) return { title: line, body: "" };
      return { title: line.slice(0, split).trim(), body: line.slice(split + 3).trim() };
    });
}

function SectionEditor({ section, pagePath, index, total, onClose, onSaved, notify }) {
  const isNew = !section?.id;

  const [form, setForm] = useState(() => ({
    ...BLANK,
    ...(section || {}),
    page_path: section?.page_path || pagePath,
  }));
  const [itemsText, setItemsText] = useState(() => itemsToText(section?.items));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const type = sectionTypeOf(form.section_type);
  const shows = (field) => type.fields.includes(field);

  // A new section is always ours to edit; an existing one may belong to the
  // Pages screen or to the page component itself.
  const source = sourceOf(section || {});

  const validate = () => {
    const next = {};
    if (!form.label.trim()) next.label = "Give the section a name you will recognise.";
    if (!form.page_path) next.page_path = "Choose which page this belongs to.";
    if (form.cta_label.trim() && !form.cta_href.trim()) {
      next.cta_href = "A button needs somewhere to go.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      const payload = {
        page_path: form.page_path,
        section_key: form.section_key || form.label,
        label: form.label.trim(),
        section_type: form.section_type,
        eyebrow: form.eyebrow || "",
        title: form.title || "",
        subtitle: form.subtitle || "",
        body: form.body || "",
        items: shows("items") ? textToItems(itemsText) : form.items || [],
        media_url: form.media_url || "",
        video_url: form.video_url || "",
        cta_label: form.cta_label || "",
        cta_href: form.cta_href || "",
        is_enabled: Boolean(form.is_enabled),
      };

      if (isNew) {
        await sections.create(payload);
        notify("Section added.");
      } else {
        // section_key is not editable after creation. Changing it would break
        // the unique constraint the duplicate logic relies on, and it is not
        // shown on the website, so there is nothing to gain.
        const { section_key: _keep, ...patch } = payload;
        await sections.update(section.id, patch);
        notify("Section saved.");
      }
      onSaved();
    } catch (error) {
      notify(error.message || "Could not save the section.", "error");
      setBusy(false);
    }
  };

  return (
    <Modal
      title={isNew ? "Add section" : "Edit section"}
      onClose={busy ? () => {} : onClose}
      footer={
        <>
          <button className="ad-btn ad-btn-ghost" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="ad-btn ad-btn-primary" type="button" onClick={save} disabled={busy}>
            {busy ? "Saving…" : isNew ? "Add section" : "Save changes"}
          </button>
        </>
      }
    >
      {/* ---- THE MAP ----
          Page, section and position, stated before any input. This is the
          part of the screen that stops an admin editing the wrong hero. */}
      <div className="ad-map" role="group" aria-label="What this section controls">
        <div className="ad-map-item">
          <span className="ad-map-key">Page</span>
          <span className="ad-map-val">{sections.pageLabelOf(form.page_path)}</span>
          <span className="ad-map-sub">{form.page_path}</span>
        </div>
        <div className="ad-map-item">
          <span className="ad-map-key">Section</span>
          <span className="ad-map-val">{form.label || "Untitled section"}</span>
          <span className="ad-map-sub">{type.label}</span>
        </div>
        <div className="ad-map-item">
          <span className="ad-map-key">Position</span>
          <span className="ad-map-val">
            {isNew ? "Bottom" : positionLabel(index, total)}
          </span>
          <span className="ad-map-sub">
            {isNew ? "New sections are added last" : `Section ${index + 1} of ${total}`}
          </span>
        </div>
      </div>

      {!source.editable && (
        <Alert tone="info" title={source.label}>
          {source.detail}
        </Alert>
      )}

      <div className="ad-form-grid">
        <Field
          label="Section name"
          name="label"
          value={form.label}
          onChange={set}
          error={errors.label}
          required
          help="Only you see this. Name it so you recognise it in the list."
          placeholder="Hero Section"
        />

        <Field
          label="Section type"
          name="section_type"
          type="select"
          value={form.section_type}
          onChange={set}
          options={SECTION_TYPES.map((item) => ({ value: item.value, label: item.label }))}
          help={type.hint}
        />

        <Field
          label="Page"
          name="page_path"
          type="select"
          value={form.page_path}
          onChange={set}
          error={errors.page_path}
          options={PAGE_REGISTRY.map((page) => ({
            value: page.path,
            label: `${page.label} — ${page.path}`,
          }))}
          help="Moving a section to another page moves it to the bottom of that page."
        />

        {shows("eyebrow") && (
          <Field
            label="Small heading above the title"
            name="eyebrow"
            value={form.eyebrow}
            onChange={set}
            placeholder="Optional"
          />
        )}

        {shows("title") && (
          <Field
            label="Heading"
            name="title"
            type="textarea"
            rows={2}
            value={form.title}
            onChange={set}
            wide
          />
        )}

        {shows("subtitle") && (
          <Field
            label="Sub-heading"
            name="subtitle"
            value={form.subtitle}
            onChange={set}
            wide
            placeholder="Optional"
          />
        )}

        {shows("body") && (
          <Field
            label="Body text"
            name="body"
            type="textarea"
            rows={5}
            value={form.body}
            onChange={set}
            wide
          />
        )}

        {shows("items") && (
          <div className="ad-field ad-field-wide">
            <label className="ad-label" htmlFor="f-items">
              List items
            </label>
            <textarea
              id="f-items"
              name="items"
              rows={6}
              value={itemsText}
              onChange={(event) => setItemsText(event.target.value)}
              placeholder={"Clear expectations — Understand the scope before work begins\nOrganised execution — A defined process, not an improvised one"}
              aria-describedby="f-items-help"
            />
            <span className="ad-field-help" id="f-items-help">
              One item per line. To add a description, separate it from the title with
              a dash surrounded by spaces: <code>Title — description</code>.
            </span>
          </div>
        )}

        {shows("media_url") && (
          <MediaUrlField
            label="Image URL"
            name="media_url"
            value={form.media_url}
            onChange={set}
            wide
          />
        )}

        {shows("video_url") && (
          <MediaUrlField
            label="Video URL"
            name="video_url"
            kind="video"
            value={form.video_url}
            onChange={set}
            wide
          />
        )}

        {shows("cta") && (
          <>
            <Field
              label="Button text"
              name="cta_label"
              value={form.cta_label}
              onChange={set}
              placeholder="Discuss Your Project"
            />
            <Field
              label="Button link"
              name="cta_href"
              value={form.cta_href}
              onChange={set}
              error={errors.cta_href}
              placeholder="/consultation"
              help="A path on this website, or a full https:// address."
            />
          </>
        )}

        <div className="ad-field ad-field-wide">
          <Check
            label="Show this section on the website"
            hint="Turn it off to hide the section without deleting anything."
            name="is_enabled"
            checked={Boolean(form.is_enabled)}
            onChange={(_name, checked) => set("is_enabled", checked)}
          />
        </div>
      </div>
    </Modal>
  );
}

/* --------------------------------------------------------------------------
 * SECTION ROW
 * ------------------------------------------------------------------------ */

function SectionRow({
  row,
  index,
  total,
  busyId,
  isOpen,
  onEdit,
  onMove,
  onToggle,
  onDuplicate,
  onDelete,
}) {
  const type = sectionTypeOf(row.section_type);
  const source = sourceOf(row);
  const isBusy = busyId === row.id;

  return (
    /* `is-open` marks the row whose editor is on screen. Arriving from the
       sidebar opens a modal over a long list, and without this the admin has
       no way to tell which row they landed on once they close it. */
    <li
      className={`ad-sec${row.is_enabled ? "" : " is-off"}${isBusy ? " is-busy" : ""}${
        isOpen ? " is-open" : ""
      }`}
    >
      <div className="ad-sec-order" aria-hidden="true">
        {index + 1}
      </div>

      <div className="ad-sec-body">
        <div className="ad-sec-head">
          <h3 className="ad-sec-name">{row.label || row.section_key}</h3>
          <Pill tone={row.is_enabled ? "ok" : "off"}>
            {row.is_enabled ? "Live" : "Hidden"}
          </Pill>
          <Pill>{type.label}</Pill>
        </div>

        {row.title && <p className="ad-sec-title">{row.title}</p>}

        <div className="ad-sec-meta">
          <span>
            <b>Position:</b> {positionLabel(index, total)}
          </span>
          {!source.editable && (
            <span>
              <b>Copy:</b> {source.label}
            </span>
          )}
          <span>
            <b>Key:</b> <code>{row.section_key}</code>
          </span>
        </div>
      </div>

      <div className="ad-sec-actions">
        <div className="ad-sec-move">
          <button
            className="ad-icon-btn"
            type="button"
            onClick={() => onMove(row.id, "up")}
            disabled={index === 0 || isBusy}
            aria-label={`Move ${row.label} up`}
            title="Move up"
          >
            ↑
          </button>
          <button
            className="ad-icon-btn"
            type="button"
            onClick={() => onMove(row.id, "down")}
            disabled={index === total - 1 || isBusy}
            aria-label={`Move ${row.label} down`}
            title="Move down"
          >
            ↓
          </button>
        </div>

        {source.editable ? (
          <button className="ad-btn ad-btn-sm" type="button" onClick={() => onEdit(row)} disabled={isBusy}>
            Edit
          </button>
        ) : source.to ? (
          <Link className="ad-btn ad-btn-sm" to={source.to}>
            {source.linkLabel}
          </Link>
        ) : (
          <button className="ad-btn ad-btn-sm" type="button" onClick={() => onEdit(row)} disabled={isBusy}>
            Edit
          </button>
        )}
        <button
          className="ad-btn ad-btn-ghost ad-btn-sm"
          type="button"
          onClick={() => onToggle(row)}
          disabled={isBusy}
        >
          {row.is_enabled ? "Hide" : "Show"}
        </button>
        <button
          className="ad-btn ad-btn-ghost ad-btn-sm"
          type="button"
          onClick={() => onDuplicate(row)}
          disabled={isBusy}
        >
          Duplicate
        </button>
        <button
          className="ad-btn ad-btn-ghost ad-btn-sm ad-btn-danger-ghost"
          type="button"
          onClick={() => onDelete(row)}
          disabled={isBusy}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

/* --------------------------------------------------------------------------
 * PAGE
 * ------------------------------------------------------------------------ */

/**
 * The page and the open section both live in the URL rather than in component
 * state. Three things fall out of that, and all three were missing before:
 *
 *   · the sidebar tree can link straight to one section, which is the whole
 *     point of the tree;
 *   · a screen an admin is mid-way through can be bookmarked or sent to a
 *     colleague and it reopens on the same thing;
 *   · the browser's Back button steps back through pages and sections rather
 *     than jumping out of the builder entirely.
 */
export default function PageBuilderPage() {
  const { pages, grouped, loading, error: loadError, refresh } = useSiteMap();
  const [searchParams, setSearchParams] = useSearchParams();

  const [deleting, setDeleting] = useState(null);
  const [busyId, setBusyId] = useState(null);
  /* `adding` is the only editor state not carried in the URL: a section that
     does not exist yet has no id to link to. */
  const [adding, setAdding] = useState(false);
  const toast = useToast();

  const activePath = searchParams.get("page") || "/";
  const activeSectionId = searchParams.get("section") || "";

  const active = useMemo(
    () => pages.find((page) => page.path === activePath) || pages[0],
    [pages, activePath]
  );

  const list = useMemo(() => active?.sections || [], [active]);

  const selectPage = useCallback(
    (path) => {
      // `replace` keeps the history stack from filling with one entry per
      // page an admin merely clicked past while looking for the right one.
      setSearchParams({ page: path }, { replace: true });
    },
    [setSearchParams]
  );

  const openSection = useCallback(
    (section) => {
      setSearchParams({ page: activePath, section: String(section.id) });
    },
    [setSearchParams, activePath]
  );

  const closeSection = useCallback(() => {
    setAdding(false);
    setSearchParams({ page: activePath }, { replace: true });
  }, [setSearchParams, activePath]);

  /* A section id in the URL that is not on this page — a deleted section, or
     a stale bookmark — is dropped rather than left pointing at nothing. */
  const editingIndex = list.findIndex((row) => String(row.id) === activeSectionId);
  const editingRow = editingIndex === -1 ? null : list[editingIndex];

  useEffect(() => {
    if (loading) return;
    if (activeSectionId && editingIndex === -1) {
      setSearchParams({ page: activePath }, { replace: true });
    }
  }, [loading, activeSectionId, editingIndex, activePath, setSearchParams]);

  /* ---- actions ---- */

  const withBusy = async (id, work, okMessage) => {
    setBusyId(id);
    try {
      await work();
      await refresh();
      if (okMessage) toast.show(okMessage);
    } catch (error) {
      toast.show(error.message || "That did not work.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const onMove = (id, direction) =>
    withBusy(id, () => sections.move(activePath, id, direction));

  const onToggle = (row) =>
    withBusy(
      row.id,
      () => sections.setEnabled(row.id, !row.is_enabled),
      row.is_enabled ? "Section hidden from the website." : "Section is now live."
    );

  const onDuplicate = (row) =>
    withBusy(row.id, () => sections.duplicate(row.id), "Copy added at the bottom, hidden.");

  const confirmDelete = () =>
    withBusy(deleting.id, async () => {
      await sections.remove(deleting.id);
      setDeleting(null);
    }, "Section deleted.");

  /* ---- render ---- */

  if (loading && pages.length === 0) return <Loading label="Loading the page map…" />;

  // A missing table is a setup problem, not a content problem, so it gets a
  // screen that explains the fix rather than a red banner above an empty
  // builder the admin cannot use anyway.
  if (loadError) return <SetupNotice error={loadError} onRetry={refresh} />;

  return (
    <>
      <Alert tone="info" title="What this screen does">
        Every page on the website is listed on the left — and in the sidebar,
        under Pages. Choosing one shows the sections it is built from, in the
        order visitors see them. Reorder, hide or edit them here; no code
        required.
      </Alert>

      <div className="ad-builder">
        {/* ---------------- PAGE LIST ---------------- */}
        <aside className="ad-builder-rail" aria-label="Pages">
          {grouped.map(([group, items]) => (
            <div key={group} className="ad-rail-group">
              <div className="ad-rail-title">{group}</div>
              {items.map((page) => {
                const live = page.sections.filter((s) => s.is_enabled).length;
                return (
                  <button
                    key={page.path}
                    type="button"
                    className={`ad-rail-item${page.path === active?.path ? " is-active" : ""}`}
                    onClick={() => selectPage(page.path)}
                    aria-current={page.path === active?.path ? "true" : undefined}
                  >
                    <span className="ad-rail-name">{page.label}</span>
                    <span className="ad-rail-count">
                      {page.sections.length === 0
                        ? "empty"
                        : `${live}/${page.sections.length}`}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        {/* ---------------- SECTION LIST ---------------- */}
        <section className="ad-builder-main">
          <header className="ad-builder-head">
            <div>
              <h2>{active?.label}</h2>
              <p className="ad-builder-path">
                {active?.path}
                {active?.orphaned && (
                  <> · <Pill tone="danger">No matching route</Pill></>
                )}
              </p>
            </div>

            <div className="ad-builder-head-actions">
              <a
                className="ad-btn ad-btn-ghost ad-btn-sm"
                href={active?.path || "/"}
                target="_blank"
                rel="noreferrer"
              >
                Open page
              </a>
              <button
                className="ad-btn ad-btn-primary ad-btn-sm"
                type="button"
                onClick={() => setAdding(true)}
              >
                Add section
              </button>
            </div>
          </header>

          {list.length === 0 ? (
            <Empty title="This page has no sections yet">
              Add the first one to start building it. Until then the page renders
              its original built-in layout, so nothing is broken in the meantime.
            </Empty>
          ) : (
            <ol className="ad-sec-list">
              {list.map((row, index) => (
                <SectionRow
                  key={row.id}
                  row={row}
                  index={index}
                  total={list.length}
                  busyId={busyId}
                  isOpen={String(row.id) === activeSectionId}
                  onEdit={openSection}
                  onMove={onMove}
                  onToggle={onToggle}
                  onDuplicate={onDuplicate}
                  onDelete={setDeleting}
                />
              ))}
            </ol>
          )}
        </section>
      </div>

      {(adding || editingRow) && (
        <SectionEditor
          section={adding ? null : editingRow}
          pagePath={active?.path || "/"}
          index={adding ? list.length : editingIndex}
          total={adding ? list.length + 1 : list.length}
          notify={toast.show}
          onClose={closeSection}
          onSaved={() => {
            closeSection();
            refresh();
          }}
        />
      )}

      {deleting && (
        <Confirm
          title="Delete this section?"
          message={`"${deleting.label || deleting.section_key}" will be removed from ${
            sections.pageLabelOf(deleting.page_path)
          }. This cannot be undone — if you only want to take it off the website for now, use Hide instead.`}
          confirmLabel="Delete section"
          busy={busyId === deleting.id}
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}

      {toast.message && (
        <Toast message={toast.message} tone={toast.tone} onDone={toast.clear} />
      )}
    </>
  );
}
