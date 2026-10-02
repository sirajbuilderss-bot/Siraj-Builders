import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { pages } from "../../services/content";
import { log } from "../../services/activity";
import DEFAULTS from "../../content/defaults.json";
import { Alert, Check, Field, Loading, MediaUrlField, Modal, Pill, Toast, useToast } from "../components/ui";

/**
 * SEO & PUBLISHING
 * One row per page of the website: whether it is live, and what search
 * engines and social shares show for it. The wording ON the page is edited
 * in Pages (the section builder) — this screen links straight there.
 *
 * An unpublished page returns "not found" to visitors; signed-in admins can
 * still open it with a notice bar, to prepare it before launch.
 */

const TITLE_MAX = 60;
const DESC_MAX = 160;

function Counter({ value, max }) {
  const n = String(value || "").length;
  return (
    <span className={`ad-counter${n > max ? " is-over" : ""}`}>
      {n} / {max}
    </span>
  );
}

export default function PagesPage() {
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [busyPath, setBusyPath] = useState("");

  const load = useCallback(async () => {
    try {
      setRows(await pages.listAll());
      setError("");
    } catch (err) {
      setRows([]);
      setError(err?.message || "Could not load pages.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const merged = useMemo(() => {
    const byPath = new Map((rows || []).map((row) => [row.path, row]));
    return DEFAULTS.registry.map((entry) => {
      const fallback = DEFAULTS.pages[entry.path];
      const row = byPath.get(entry.path);
      return {
        ...entry,
        row,
        published: row ? row.is_published !== false : fallback.published !== false,
        seo_title: row?.seo_title || "",
        seo_description: row?.seo_description || "",
        og_image: row?.og_image || "",
        defaultTitle: fallback.seo?.title || "",
        defaultDescription: fallback.seo?.description || "",
      };
    });
  }, [rows]);

  async function save(entry, patch) {
    if (entry.row) {
      await pages.update(entry.row.id, patch);
    } else {
      await pages.create({
        path: entry.path,
        label: entry.label,
        eyebrow: entry.label,
        title: entry.label,
        is_published: entry.published,
        ...patch,
      });
    }
  }

  async function togglePublish(entry) {
    setBusyPath(entry.path);
    try {
      await save(entry, { is_published: !entry.published });
      log("update", "pages", { summary: `${entry.published ? "Unpublished" : "Published"} page ${entry.path}` });
      toast.show(entry.published ? `${entry.label} is now hidden from visitors.` : `${entry.label} is live.`);
      await load();
    } catch (err) {
      toast.show(err?.message || "Could not update the page.", "error");
    } finally {
      setBusyPath("");
    }
  }

  function openEditor(entry) {
    setEditing(entry);
    setForm({
      seo_title: entry.seo_title,
      seo_description: entry.seo_description,
      og_image: entry.og_image,
      is_published: entry.published,
    });
  }

  async function submit() {
    setSaving(true);
    try {
      await save(editing, {
        seo_title: (form.seo_title || "").trim(),
        seo_description: (form.seo_description || "").trim(),
        og_image: (form.og_image || "").trim(),
        is_published: Boolean(form.is_published),
      });
      log("update", "pages", { summary: `Updated SEO for ${editing.path}` });
      toast.show("Saved. Visitors see the change on their next visit.");
      setEditing(null);
      await load();
    } catch (err) {
      toast.show(err?.message || "Could not save.", "error");
    } finally {
      setSaving(false);
    }
  }

  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const groups = ["Main", "Services", "Company", "Legal"];

  return (
    <>
      <p className="ad-section-note">
        Which pages are live, and the title and description search engines show
        for each. To change the wording on a page, use <b>Edit content</b>.
      </p>

      {error && (
        <Alert tone="error" title="Pages could not be loaded">
          {error}
        </Alert>
      )}

      {rows === null ? (
        <Loading label="Loading pages…" />
      ) : (
        groups.map((group) => {
          const list = merged.filter((entry) => entry.group === group);
          if (!list.length) return null;
          return (
            <section className="ad-card ad-seo-group" key={group}>
              <h2 className="ad-card-title">{group}</h2>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Page</th>
                      <th>Search title</th>
                      <th>Status</th>
                      <th className="ad-col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((entry) => (
                      <tr key={entry.path} className={busyPath === entry.path ? "is-busy" : undefined}>
                        <td>
                          <div className="ad-cell-strong">{entry.label}</div>
                          <div className="ad-cell-muted">{entry.path}</div>
                        </td>
                        <td>
                          <div className="ad-cell-clamp">{entry.seo_title || entry.defaultTitle}</div>
                          {!entry.seo_title && <div className="ad-cell-muted">Using the documented default</div>}
                        </td>
                        <td>{entry.published ? <Pill tone="ok">Live</Pill> : <Pill tone="off">Unpublished</Pill>}</td>
                        <td className="ad-col-actions">
                          <div className="ad-row-actions">
                            <Link className="ad-btn ad-btn-ghost ad-btn-sm" to={`/admin/builder?page=${encodeURIComponent(entry.path)}`}>
                              Edit content
                            </Link>
                            <button className="ad-btn ad-btn-ghost ad-btn-sm" type="button" onClick={() => openEditor(entry)}>
                              SEO
                            </button>
                            {entry.path !== "/" && (
                              <button
                                className="ad-btn ad-btn-ghost ad-btn-sm"
                                type="button"
                                disabled={busyPath === entry.path}
                                onClick={() => togglePublish(entry)}
                              >
                                {entry.published ? "Unpublish" : "Publish"}
                              </button>
                            )}
                            <a className="ad-btn ad-btn-ghost ad-btn-sm" href={entry.path} target="_blank" rel="noreferrer">
                              View
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })
      )}

      {editing && (
        <Modal
          title={`SEO — ${editing.label}`}
          onClose={saving ? () => {} : () => setEditing(null)}
          footer={
            <>
              <button className="ad-btn ad-btn-ghost" type="button" onClick={() => setEditing(null)} disabled={saving}>
                Cancel
              </button>
              <button className="ad-btn ad-btn-primary" type="button" onClick={submit} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          }
        >
          <div className="ad-seo-preview" aria-label="Search result preview">
            <span className="ad-seo-url">sirajbuilders · {editing.path}</span>
            <span className="ad-seo-title">{form.seo_title || editing.defaultTitle}</span>
            <span className="ad-seo-desc">{form.seo_description || editing.defaultDescription}</span>
          </div>
          <div className="ad-form-grid">
            <div className="ad-field ad-field-wide">
              <Field
                label="Search title"
                name="seo_title"
                value={form.seo_title}
                onChange={set}
                placeholder={editing.defaultTitle}
                help="Leave blank to use the documented default shown in grey."
              />
              <Counter value={form.seo_title || editing.defaultTitle} max={TITLE_MAX} />
            </div>
            <div className="ad-field ad-field-wide">
              <Field
                label="Search description"
                name="seo_description"
                type="textarea"
                rows={3}
                value={form.seo_description}
                onChange={set}
                placeholder={editing.defaultDescription}
              />
              <Counter value={form.seo_description || editing.defaultDescription} max={DESC_MAX} />
            </div>
            <MediaUrlField
              label="Social share image"
              name="og_image"
              value={form.og_image}
              onChange={set}
              folder="seo"
              wide
              help="Shown when the page is shared on WhatsApp, Facebook or LinkedIn. 1200 × 630 works best."
            />
            {editing.path !== "/" && (
              <div className="ad-field ad-field-wide">
                <Check
                  label="Published — visitors can open this page"
                  name="is_published"
                  checked={Boolean(form.is_published)}
                  onChange={(_n, checked) => set("is_published", checked)}
                  hint="Unpublished pages show “not found” to visitors. Only publish service pages once the service is confirmed."
                />
              </div>
            )}
          </div>
        </Modal>
      )}

      <Toast message={toast.message} tone={toast.tone} onDone={toast.clear} />
    </>
  );
}
