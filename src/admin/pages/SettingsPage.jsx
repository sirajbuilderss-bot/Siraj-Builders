import { useCallback, useEffect, useState } from "react";
import { settings, socialLinks } from "../../services/content";
import { log } from "../../services/activity";
import {
  Alert,
  Check,
  Empty,
  Loading,
  Toast,
  useToast,
} from "../components/ui";

/**
 * SITE SETTINGS
 * ----------------------------------------------------------------------------
 * Contact details, company copy, SEO tokens and social profiles.
 *
 * THE CONFIRMED FLAG
 * The original site.js established a convention this screen preserves: a
 * contact detail that has not been verified renders as plain text rather than
 * as a clickable tel: or mailto: link, and an unconfirmed social profile is
 * hidden from the footer entirely.
 *
 * That exists because an earlier build of this site shipped
 * `tel:+920000000000` hardcoded in five files — dead clicks that looked
 * functional, so a visitor tapping the number on mobile dialled nothing. The
 * checkbox beside each field is what turns a detail into a live link. Ticking
 * it with a wrong number is worse than leaving it unticked.
 */

const GROUP_LABELS = {
  company: "Company",
  contact: "Contact information",
  seo: "SEO and domain",
  footer: "Footer",
  general: "General",
};

const CONFIRMABLE = new Set([
  "contact_phone",
  "contact_whatsapp",
  "contact_email",
  "contact_address",
  "contact_hours",
]);

const LONG_FIELDS = new Set([
  "company_tagline",
  "company_proposition",
  "company_trust_line",
  "footer_tagline",
  "contact_address",
]);

export default function SettingsPage() {
  const [rows, setRows] = useState(null);
  const [draft, setDraft] = useState({});
  const [socials, setSocials] = useState([]);
  const [socialDraft, setSocialDraft] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const toast = useToast();

  const refresh = useCallback(async () => {
    try {
      const [settingRows, socialRows] = await Promise.all([
        settings.listAll(),
        socialLinks.listAll(),
      ]);

      setRows(settingRows);
      setDraft(
        settingRows.reduce(
          (acc, row) => ({
            ...acc,
            [row.key]: { value: row.value, is_confirmed: row.is_confirmed },
          }),
          {}
        )
      );

      setSocials(socialRows);
      setSocialDraft(
        socialRows.reduce(
          (acc, row) => ({
            ...acc,
            [row.id]: { href: row.href, is_confirmed: row.is_confirmed },
          }),
          {}
        )
      );
      setError("");
    } catch (err) {
      setError(
        err?.message ||
          "Could not load settings. Check your Supabase connection and that database/seed.sql has been run."
      );
      setRows([]);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function setSetting(key, patch) {
    setDraft((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  function setSocial(id, patch) {
    setSocialDraft((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function saveAll() {
    setIsSaving(true);
    try {
      const changedSettings = rows.filter(
        (row) =>
          draft[row.key] &&
          (draft[row.key].value !== row.value ||
            draft[row.key].is_confirmed !== row.is_confirmed)
      );

      for (const row of changedSettings) {
        await settings.update(row.key, {
          value: draft[row.key].value,
          // A blank value can never be "confirmed" — that is exactly the dead
          // link this convention exists to prevent.
          is_confirmed: Boolean(
            draft[row.key].is_confirmed && String(draft[row.key].value).trim()
          ),
        });
      }

      const changedSocials = socials.filter(
        (row) =>
          socialDraft[row.id] &&
          (socialDraft[row.id].href !== row.href ||
            socialDraft[row.id].is_confirmed !== row.is_confirmed)
      );

      for (const row of changedSocials) {
        await socialLinks.update(row.id, {
          href: socialDraft[row.id].href,
          is_confirmed: Boolean(
            socialDraft[row.id].is_confirmed &&
              String(socialDraft[row.id].href).trim()
          ),
        });
      }

      const total = changedSettings.length + changedSocials.length;
      if (total) {
        log("update", "site_settings", {
          summary: `Updated ${total} setting${total === 1 ? "" : "s"}`,
        });
        toast.show(`${total} setting${total === 1 ? "" : "s"} saved.`);
      } else {
        toast.show("Nothing to save.");
      }

      await refresh();
    } catch (err) {
      toast.show(err?.message || "Could not save settings.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  if (rows === null) return <Loading label="Loading settings…" />;

  const grouped = rows.reduce((acc, row) => {
    const group = row.group_name || "general";
    return { ...acc, [group]: [...(acc[group] || []), row] };
  }, {});

  return (
    <>
      <p className="ad-section-note">
        These values feed the header, footer, contact page and SEO tags across
        the whole website. Tick “confirmed” only once a detail has been
        verified — unconfirmed details render as plain text instead of as
        clickable links, which is deliberate.
      </p>

      {error && (
        <Alert tone="error" title="Could not load settings">
          {error}
        </Alert>
      )}

      <div className="ad-card">
        <div className="ad-card-head">
          <h2>Website settings</h2>
          <button
            className="ad-btn ad-btn-accent"
            type="button"
            onClick={saveAll}
            disabled={isSaving}
            style={{ marginLeft: "auto" }}
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>

        <div className="ad-card-body">
          {Object.entries(grouped).map(([group, items]) => (
            <div className="ad-settings-group" key={group}>
              <h3>{GROUP_LABELS[group] || group}</h3>

              {items.map((row) => {
                const current = draft[row.key] || { value: "", is_confirmed: false };
                const isLong = LONG_FIELDS.has(row.key);

                return (
                  <div key={row.key}>
                    <div className="ad-field">
                      <label className="ad-label" htmlFor={`set-${row.key}`}>
                        {row.label || row.key}
                      </label>

                      {isLong ? (
                        <textarea
                          id={`set-${row.key}`}
                          rows={2}
                          value={current.value}
                          onChange={(event) =>
                            setSetting(row.key, { value: event.target.value })
                          }
                        />
                      ) : (
                        <input
                          id={`set-${row.key}`}
                          type="text"
                          value={current.value}
                          onChange={(event) =>
                            setSetting(row.key, { value: event.target.value })
                          }
                        />
                      )}

                      {!current.value && row.display && (
                        <span className="ad-field-help">
                          Shown while empty: “{row.display}”
                        </span>
                      )}
                    </div>

                    {CONFIRMABLE.has(row.key) && (
                      <Check
                        name={`confirm-${row.key}`}
                        label="Confirmed — render as a live link"
                        hint="Leave unchecked until this detail has been verified."
                        checked={current.is_confirmed}
                        onChange={(_name, checked) =>
                          setSetting(row.key, { is_confirmed: checked })
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* ---- Social links ---- */}
          <div className="ad-settings-group">
            <h3>Social links</h3>

            {socials.length === 0 ? (
              <Empty title="No social profiles configured">
                <p>Run database/seed.sql to create the default four.</p>
              </Empty>
            ) : (
              socials.map((row) => {
                const current = socialDraft[row.id] || { href: "", is_confirmed: false };
                return (
                  <div key={row.id}>
                    <div className="ad-field">
                      <label className="ad-label" htmlFor={`soc-${row.id}`}>
                        {row.label}
                      </label>
                      <input
                        id={`soc-${row.id}`}
                        type="url"
                        placeholder={`https://…/sirajbuilders`}
                        value={current.href}
                        onChange={(event) =>
                          setSocial(row.id, { href: event.target.value })
                        }
                      />
                      <span className="ad-field-help">
                        Link to the company's own profile, not the platform
                        homepage. The footer row stays hidden until at least one
                        profile is confirmed.
                      </span>
                    </div>
                    <Check
                      name={`soc-confirm-${row.id}`}
                      label="Confirmed — show in the footer"
                      checked={current.is_confirmed}
                      onChange={(_name, checked) =>
                        setSocial(row.id, { is_confirmed: checked })
                      }
                    />
                  </div>
                );
              })
            )}
          </div>

          <button
            className="ad-btn ad-btn-accent"
            type="button"
            onClick={saveAll}
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <Toast message={toast.message} tone={toast.tone} onDone={toast.clear} />
    </>
  );
}
