import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { IconClose } from "../components/icons";
import { ArrowDown, ArrowUp } from "../../components/ui/Icons";
import sections, {
  PAGE_REGISTRY,
  SECTION_TYPES,
  positionLabel,
  sectionTypeOf,
  sourceOf,
} from "../../services/sections";
import DEFAULTS from "../../content/defaults.json";

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

/** `items` is jsonb: [{ title, body, image }]. Strings from older rows are upgraded. */
function normaliseItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) =>
    typeof item === "string"
      ? { title: item, body: "", image: "" }
      : { title: item?.title || "", body: item?.body || "", image: item?.image || "" }
  );
}

/**
 * LIST ITEMS EDITOR — one row per card / bullet / step, each with a title,
 * an optional description and (where the section can show it) an image.
 */
function ItemsEditor({ items, onChange, withImages }) {
  const update = (index, key, value) =>
    onChange(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  const move = (index, step) => {
    const to = index + step;
    if (to < 0 || to >= items.length) return;
    const next = items.slice();
    [next[index], next[to]] = [next[to], next[index]];
    onChange(next);
  };
  return (
    <div className="ad-field ad-field-wide">
      <span className="ad-label">List items</span>
      <p className="ad-field-help">Cards, bullet points or steps — shown in this order.</p>
      <ol className="ad-items">
        {items.map((item, index) => (
          <li key={index} className="ad-item">
            <span className="ad-item-num">{index + 1}</span>
            <div className="ad-item-fields">
              <input
                type="text"
                value={item.title}
                placeholder="Title"
                aria-label={`Item ${index + 1} title`}
                onChange={(event) => update(index, "title", event.target.value)}
              />
              <textarea
                rows={2}
                value={item.body}
                placeholder="Description (optional)"
                aria-label={`Item ${index + 1} description`}
                onChange={(event) => update(index, "body", event.target.value)}
              />
              {withImages && (
                <div className="ad-item-image">
                  <MediaUrlField
                    label="Image (optional)"
                    name={`item-${index}-image`}
                    value={item.image}
                    folder="pages"
                    onChange={(_name, value) => update(index, "image", value)}
                  />
                </div>
              )}
            </div>
            <div className="ad-item-tools">
              <button type="button" className="ad-icon-btn" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move item ${index + 1} up`}><ArrowUp size={15} /></button>
              <button type="button" className="ad-icon-btn" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label={`Move item ${index + 1} down`}><ArrowDown size={15} /></button>
              <button type="button" className="ad-icon-btn ad-icon-danger" onClick={() => onChange(items.filter((_, i) => i !== index))} aria-label={`Remove item ${index + 1}`}><IconClose size={15} /></button>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => onChange([...items, { title: "", body: "", image: "" }])}>
        + Add item
      </button>
    </div>
  );
}

const THEMES = [
  { value: "white", label: "White" },
  { value: "light", label: "Light grey" },
  { value: "dark", label: "Dark" },
];
const CATEGORIES = ["", "Residential", "Commercial", "Renovation", "Design & Build"];

function SectionEditor({ section, pagePath, index, total, onClose, onSaved, notify }) {
  const isNew = !section?.id;
  const documented = DEFAULTS.pages[pagePath]?.sections?.find((item) => item.key === section?.section_key);

  const [form, setForm] = useState(() => {
    const current = { ...BLANK, ...(section || {}), page_path: section?.page_path || pagePath };
    return {
      ...current,
      media_url: current.media_url || documented?.media_url || "",
      video_url: current.video_url || documented?.video_url || "",
    };
  });
  const [items, setItems] = useState(() => normaliseItems(
    section?.items?.length ? section.items : documented?.items || []
  ));
  const [settings, setSettings] = useState(() => ({ ...(documented?.settings || {}), ...(section?.settings || {}) }));
  const setSetting = (key, value) => setSettings((current) => ({ ...current, [key]: value }));
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
    if ((settings.cta2_label || "").trim() && !(settings.cta2_href || "").trim()) {
      next.cta2_href = "A button needs somewhere to go.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      const savedSettings = Object.fromEntries(
        Object.entries(settings).filter(([, value]) => value !== "" && value !== undefined && value !== null)
      );
      savedSettings.editor_overrides = {
        ...(savedSettings.editor_overrides || {}),
        ...(shows("items") ? { items: true } : {}),
        ...(shows("media_url") ? { media_url: true } : {}),
        ...(shows("video_url") ? { video_url: true } : {}),
      };

      const payload = {
        page_path: form.page_path,
        section_key: form.section_key || form.label,
        label: form.label.trim(),
        section_type: form.section_type,
        eyebrow: form.eyebrow || "",
        title: form.title || "",
        subtitle: form.subtitle || "",
        body: form.body || "",
        items: shows("items")
          ? items
              .map((item) => ({ title: item.title.trim(), body: item.body.trim(), image: (item.image || "").trim() }))
              .filter((item) => item.title || item.body || item.image)
          : form.items || [],
        settings: savedSettings,
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

      {source.kind === "hero_slides" && (
        <Alert tone="info" title={source.label}>
          {source.detail} <Link to={source.to}>{source.linkLabel} →</Link>
        </Alert>
      )}
      {settings.note && (
        <Alert tone="info" title="Note from the project documentation">
          {settings.note}
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
          <ItemsEditor items={items} onChange={setItems} withImages={["gallery", "custom"].includes(form.section_type)} />
        )}

        {shows("media_url") && (
          <MediaUrlField
            label="Image"
            name="media_url"
            folder="pages"
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

        {shows("cta2") && (
          <>
            <Field
              label="Second button text"
              name="cta2_label"
              value={settings.cta2_label || ""}
              onChange={(_n, v) => setSetting("cta2_label", v)}
              placeholder="Optional"
            />
            <Field
              label="Second button link"
              name="cta2_href"
              value={settings.cta2_href || ""}
              onChange={(_n, v) => setSetting("cta2_href", v)}
              error={errors.cta2_href}
              placeholder="/projects"
            />
          </>
        )}

        {type.layouts.length > 0 && (
          <Field
            label="Layout"
            name="layout"
            type="select"
            value={settings.layout || ""}
            onChange={(_n, v) => setSetting("layout", v)}
            options={[{ value: "", label: "Default" }, ...type.layouts.filter((l) => !/default/i.test(l.label)).map((l) => ({ value: l.value, label: l.label }))]}
          />
        )}

        {shows("theme") && (
          <Field
            label="Background"
            name="theme"
            type="select"
            value={settings.theme || "white"}
            onChange={(_n, v) => setSetting("theme", v)}
            options={THEMES}
            help="Neighbouring sections with the same background join into one band."
          />
        )}

        {shows("limit") && (
          <Field
            label="How many to show"
            name="limit"
            type="number"
            value={settings.limit ?? ""}
            onChange={(_n, v) => setSetting("limit", v === "" ? "" : Number(v))}
            help="Leave blank to show all."
          />
        )}

        {shows("category") && (
          <>
            <Field
              label="Only this project type"
              name="category"
              type="select"
              value={settings.category || ""}
              onChange={(_n, v) => setSetting("category", v)}
              options={CATEGORIES.map((c) => ({ value: c, label: c || "All types" }))}
            />
            <div className="ad-field">
              <Check
                label="Hide this section when there are no matching projects"
                name="hide_empty"
                checked={Boolean(settings.hide_empty)}
                onChange={(_n, checked) => setSetting("hide_empty", checked)}
              />
            </div>
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
  onMoveTo,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDropTarget,
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
      data-section-id={String(row.id)}
      className={`ad-sec${row.is_enabled ? "" : " is-off"}${isBusy ? " is-busy" : ""}${
        isOpen ? " is-open" : ""
      }${isDragging ? " is-dragging" : ""}${isDropTarget ? " is-drop-target" : ""}`}
      draggable={!isBusy}
      onDragStart={(event) => onDragStart(event, row.id)}
      onDragOver={(event) => onDragOver(event, row.id)}
      onDrop={(event) => onDrop(event, row.id)}
      onDragEnd={onDragEnd}
    >
      <div className="ad-sec-order-wrap">
        <button
          className="ad-sec-drag"
          type="button"
          disabled={isBusy}
          aria-label={`Drag ${row.label || row.section_key} to reorder`}
          title="Drag to reorder"
        >
          <span aria-hidden="true">⠿</span>
        </button>
        <div className="ad-sec-order" aria-hidden="true">{index + 1}</div>
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
          {(row.media_url || row.video_url) && (
            <span>
              <b>Media:</b> {[row.media_url && "Image", row.video_url && "Video"].filter(Boolean).join(" + ")}
            </span>
          )}
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
        <label className="ad-sec-position-control">
          <span>Position</span>
          <select
            value={index + 1}
            disabled={isBusy}
            aria-label={`Move ${row.label || row.section_key} to position`}
            onChange={(event) => onMoveTo(row.id, Number(event.target.value))}
          >
            {Array.from({ length: total }, (_value, position) => (
              <option key={position + 1} value={position + 1}>{position + 1}</option>
            ))}
          </select>
        </label>
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
  const [draggingId, setDraggingId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [optimisticOrder, setOptimisticOrder] = useState(null);
  const sectionListRef = useRef(null);
  const previousSectionRects = useRef(new Map());
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

  const list = useMemo(() => {
    const base = active?.sections || [];
    if (!optimisticOrder || optimisticOrder.pagePath !== active?.path) return base;
    const byId = new Map(base.map((row) => [String(row.id), row]));
    const ordered = optimisticOrder.ids.map((id) => byId.get(String(id))).filter(Boolean);
    return ordered.length === base.length ? ordered : base;
  }, [active, optimisticOrder]);

  useLayoutEffect(() => {
    const root = sectionListRef.current;
    if (!root) return;
    const nodes = [...root.querySelectorAll("[data-section-id]")];
    const nextRects = new Map();
    nodes.forEach((node) => {
      const id = node.dataset.sectionId;
      const rect = node.getBoundingClientRect();
      const previous = previousSectionRects.current.get(id);
      nextRects.set(id, { left: rect.left, top: rect.top });
      if (!previous) return;
      const dx = previous.left - rect.left;
      const dy = previous.top - rect.top;
      if ((!dx && !dy) || typeof node.animate !== "function") return;
      node.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
        { duration: 260, easing: "cubic-bezier(0.2, 0.75, 0.25, 1)" }
      );
    });
    previousSectionRects.current = nextRects;
  }, [list]);

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
      return true;
    } catch (error) {
      toast.show(error.message || "That did not work.", "error");
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const saveOrder = async (id, next, message = "Section order updated.") => {
    setOptimisticOrder({ pagePath: activePath, ids: next.map((item) => item.id) });
    const saved = await withBusy(id, () => sections.reorder(activePath, next.map((item) => item.id)), message);
    setOptimisticOrder(null);
    return saved;
  };

  const onMove = (id, direction) => {
    const from = list.findIndex((row) => String(row.id) === String(id));
    if (from < 0) return;
    const to = from + (direction === "up" ? -1 : 1);
    if (to < 0 || to >= list.length) return;
    const next = list.slice();
    [next[from], next[to]] = [next[to], next[from]];
    saveOrder(id, next);
  };

  const onMoveTo = (id, position) => {
    const from = list.findIndex((row) => String(row.id) === String(id));
    const to = Math.max(0, Math.min(list.length - 1, position - 1));
    if (from < 0 || from === to) return;
    const next = list.slice();
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    saveOrder(id, next, `Section moved to position ${position}.`);
  };

  const onDragStart = (event, id) => {
    // The entire card is draggable, but controls inside it should remain
    // usable. Starting from the grip is always allowed; other controls are
    // excluded so a click or select never starts an accidental drag.
    const grip = event.target.closest?.(".ad-sec-drag");
    const control = event.target.closest?.("button, a, select, input, textarea");
    if (control && !grip) {
      event.preventDefault();
      return;
    }
    if (busyId) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(id));
    const card = event.currentTarget;
    const bounds = card.getBoundingClientRect();
    if (event.dataTransfer.setDragImage) {
      event.dataTransfer.setDragImage(
        card,
        Math.max(12, Math.min(event.clientX - bounds.left, bounds.width - 12)),
        Math.max(12, Math.min(event.clientY - bounds.top, bounds.height - 12))
      );
    }
    setDraggingId(id);
  };

  const onDragOver = (event, id) => {
    if (draggingId == null || String(draggingId) === String(id)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTargetId(id);
  };

  const onDrop = (event, targetId) => {
    event.preventDefault();
    const sourceId = draggingId ?? event.dataTransfer.getData("text/plain");
    setDropTargetId(null);
    setDraggingId(null);
    if (!sourceId || String(sourceId) === String(targetId)) return;

    const next = list.slice();
    const from = next.findIndex((row) => String(row.id) === String(sourceId));
    const to = next.findIndex((row) => String(row.id) === String(targetId));
    if (from < 0 || to < 0) return;
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    saveOrder(sourceId, next);
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setDropTargetId(null);
  };

  const onToggle = (row) =>
    withBusy(
      row.id,
      () => sections.setEnabled(row.id, !row.is_enabled),
      row.is_enabled ? "Section hidden from the website." : "Section is now live."
    );

  const onDuplicate = (row) =>
    withBusy(row.id, () => sections.duplicate(row.id), "Copy added at the bottom and shown on the website.");

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
            <ol className="ad-sec-list" ref={sectionListRef}>
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
                  onMoveTo={onMoveTo}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  onDragEnd={onDragEnd}
                  isDragging={String(draggingId) === String(row.id)}
                  isDropTarget={String(dropTargetId) === String(row.id)}
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
