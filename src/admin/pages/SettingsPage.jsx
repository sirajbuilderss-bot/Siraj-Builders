import { useCallback, useEffect, useState } from "react";
import { settings, socialLinks } from "../../services/content";
import { resolveThemeValue, THEME_DEFAULTS } from "../../components/ThemeSync";
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
  contact: "Contact & WhatsApp",
  seo: "SEO and domain",
  footer: "Footer",
  navigation: "Header & navigation",
  forms: "Forms",
  general: "General",
  theme: "Theme colors",
};

const CONFIRMABLE = new Set([
  "contact_phone",
  "contact_whatsapp",
  "contact_email",
  "contact_address",
  "contact_hours",
]);

const LONG_FIELDS = new Set([
  "whatsapp_message",
  "form_success_message",
  "form_microcopy",
  "footer_cta_title",
  "company_tagline",
  "company_proposition",
  "company_trust_line",
  "footer_tagline",
  "contact_address",
]);

const THEME_FIELDS = [
  ["theme_accent", "Primary accent", "Main buttons, highlights and links"],
  ["theme_accent_deep", "Accent dark", "Badges, active controls and emphasis"],
  ["theme_dark", "Dark surface", "Dark sections and admin surfaces"],
  ["theme_deeper", "Deep surface", "Hero and sidebar background"],
  ["theme_light", "Light surface", "Light sections and soft backgrounds"],
  ["theme_ink", "Text color", "Main website and admin text"],
  ["theme_gradient_start", "Gradient start", "First color used by gradient buttons"],
  ["theme_gradient_end", "Gradient end", "Second color used by gradient buttons"],
  ["theme_header", "Header color", "Website header and top navigation"],
  ["theme_footer", "Footer color", "Website footer background"],
  ["theme_backtop", "Back-to-top arrow", "Bottom-to-top button color"],
  ["theme_cursor", "Cursor dot color", "Animated mouse cursor and its glow"],
].map(([key, label, help], index) => ({
  key,
  label,
  help,
  value: THEME_DEFAULTS[key],
  display: "",
  is_confirmed: true,
  group_name: "theme",
  sort_order: index * 10 + 10,
}));
const THEME_KEYS = new Set(THEME_FIELDS.map((field) => field.key));
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

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

      const existingKeys = new Set(settingRows.map((row) => row.key));
      setRows([
        ...settingRows,
        ...THEME_FIELDS.filter((row) => !existingKeys.has(row.key)),
      ]);
      setDraft(
        [...settingRows, ...THEME_FIELDS.filter((row) => !existingKeys.has(row.key))].reduce(
          (acc, row) => ({
            ...acc,
            [row.key]: {
              value: THEME_KEYS.has(row.key) ? resolveThemeValue(row.key, row.value) : row.value,
              is_confirmed: row.is_confirmed,
            },
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

  function resetTheme() {
    setDraft((prev) => ({
      ...prev,
      ...Object.fromEntries(
        THEME_FIELDS.map((field) => [
          field.key,
          { ...(prev[field.key] || {}), value: THEME_DEFAULTS[field.key], is_confirmed: true },
        ])
      ),
    }));
    toast.show("Default theme colors loaded. Click Save changes to apply them.");
  }

  async function saveAll() {
    setIsSaving(true);
    try {
      const invalidTheme = THEME_FIELDS.find(
        (field) => !HEX_COLOR.test(String(draft[field.key]?.value || ""))
      );
      if (invalidTheme) {
        toast.show(`${invalidTheme.label} must use a hex code like #9dc1c8.`, "error");
        return;
      }

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
          ...(THEME_KEYS.has(row.key)
            ? {
                display: row.display || "",
                group_name: row.group_name || "theme",
                label: row.label || row.key,
                sort_order: row.sort_order || 0,
              }
            : {}),
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
              <div className="ad-settings-group-head">
                <h3>{GROUP_LABELS[group] || group}</h3>
                {group === "theme" && (
                  <button className="ad-btn ad-btn-ghost ad-btn-sm" type="button" onClick={resetTheme}>
                    Reset to defaults
                  </button>
                )}
              </div>

              {items.map((row) => {
                const current = draft[row.key] || { value: "", is_confirmed: false };
                const isLong = LONG_FIELDS.has(row.key);
                const isThemeColor = THEME_KEYS.has(row.key);

                return (
                  <div key={row.key}>
                    <div className="ad-field">
                      <label className="ad-label" htmlFor={`set-${row.key}`}>
                        {row.label || row.key}
                      </label>

                      {isThemeColor ? (
                        <div className="ad-color-control">
                          <input
                            id={`set-${row.key}`}
                            type="color"
                            value={current.value || THEME_DEFAULTS[row.key]}
                            onChange={(event) =>
                              setSetting(row.key, { value: event.target.value })
                            }
                          />
                          <input
                            className="ad-color-hex"
                            type="text"
                            value={current.value || THEME_DEFAULTS[row.key]}
                            maxLength={7}
                            pattern="#[0-9a-fA-F]{6}"
                            aria-label={`${row.label} hex code`}
                            onChange={(event) =>
                              setSetting(row.key, { value: event.target.value })
                            }
                          />
                          <span className="ad-field-help">{row.help}</span>
                        </div>
                      ) : isLong ? (
                        <textarea
                          id={`set-${row.key}`}
                          rows={row.key === "whatsapp_message" ? 7 : 3}
                          value={current.value}
                          onChange={(event) =>
                            setSetting(row.key, { value: event.target.value })
                          }
                        />
                      ) : (
                        <input
                          id={`set-${row.key}`}
                          type="text"
                          placeholder={row.key === "contact_whatsapp" ? "+<country code> <phone number>" : undefined}
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
                        label={row.key === "contact_whatsapp" ? "Enable the floating WhatsApp button" : "Confirmed — render as a live link"}
                        hint={row.key === "contact_whatsapp" ? "Enter the number with its country code, save it as confirmed, and the website button will appear. Leave unchecked to hide the button." : "Leave unchecked until this detail has been verified."}
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
