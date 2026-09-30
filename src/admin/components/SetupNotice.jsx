import { useState } from "react";

/**
 * SETUP NOTICE
 * ============================================================================
 * What an admin sees when the panel cannot read the database.
 *
 * The screen this replaces showed the raw PostgREST string —
 * "Could not find the table 'public.page_sections' in the schema cache" —
 * and nothing else. That sentence tells a developer roughly what happened and
 * tells the person actually running this website nothing at all: not what the
 * table is for, not whether they have broken something permanent, and not
 * what to do next. The predictable result is a message asking whoever built
 * the site.
 *
 * So this panel answers those three questions in order, and names the exact
 * file to run. The raw error is kept, but folded away — useful when it needs
 * forwarding, noise when it does not.
 */
export default function SetupNotice({ error, onRetry }) {
  const [showRaw, setShowRaw] = useState(false);

  if (!error) return null;

  return (
    <div className="ad-setup" role="alert">
      <div className="ad-setup-head">
        <span className="ad-setup-mark" aria-hidden="true">
          !
        </span>
        <div>
          <h2>{error.title}</h2>
          <p>{error.detail}</p>
        </div>
      </div>

      {error.fix && (
        <div className="ad-setup-fix">
          <h3>Isay theek kaisay karein — 4 qadam</h3>
          <ol>
            <li>
              Supabase dashboard kholein → bayein menu se <b>SQL Editor</b> →{" "}
              <b>New query</b>.
            </li>
            <li>
              Project mein se yeh file kholein aur <b>poori</b> copy karein:
              <code className="ad-setup-file">database/{error.fix}</code>
            </li>
            <li>
              SQL Editor mein paste karein aur <b>Run</b> dabayein.
            </li>
            <li>
              Yahan wapis aa kar page refresh karein (<b>Ctrl + Shift + R</b>).
            </li>
          </ol>

          <p className="ad-setup-safe">
            <b>Yeh mehfooz hai.</b> Wo file sirf ghayab table banati hai aur us
            mein website ke 91 sections daalti hai. Projects, services, FAQs,
            submissions aur aap ke admin accounts ko bilkul haath nahi lagati,
            aur jo text aap ne pehle badla hoga wo wapis nahi badle ga. Dobara
            chalana bhi mehfooz hai.
          </p>
        </div>
      )}

      <div className="ad-setup-actions">
        {onRetry && (
          <button className="ad-btn ad-btn-primary ad-btn-sm" type="button" onClick={onRetry}>
            Try again
          </button>
        )}
        {error.raw && (
          <button
            className="ad-btn ad-btn-ghost ad-btn-sm"
            type="button"
            aria-expanded={showRaw}
            onClick={() => setShowRaw((open) => !open)}
          >
            {showRaw ? "Hide technical detail" : "Show technical detail"}
          </button>
        )}
      </div>

      {showRaw && (
        <pre className="ad-setup-raw">
          <code>{error.raw}</code>
        </pre>
      )}
    </div>
  );
}
