/**
 * SUPABASE CLIENT
 * ============================================================================
 * A small, dependency-free client over Supabase's two HTTP APIs:
 *
 *   PostgREST  /rest/v1/<table>   — the database
 *   GoTrue     /auth/v1/...       — authentication
 *
 * WHY NOT @supabase/supabase-js?
 * ------------------------------
 * The SDK is excellent and this file deliberately mirrors its call shape
 * (`db.from("projects").select()`), but it adds ~120 kB to a bundle that is
 * currently 98 kB in total, and it pulls in realtime and storage transports
 * this project does not use — storage is explicitly out of scope, and no
 * screen needs live subscriptions. What is used here is plain `fetch` against
 * documented REST endpoints, so there is nothing to install and nothing to
 * keep in version lockstep.
 *
 * TO SWAP TO THE OFFICIAL SDK LATER: this file is the only one that talks
 * HTTP. Reimplement these exports on top of `createClient` and every caller
 * keeps working.
 *
 * ON THE ANON KEY
 * ---------------
 * It ships in the browser bundle and is meant to. It identifies the project,
 * it does not authorise anything. Row Level Security is what protects the
 * data — see database/policies.sql. The service_role key must NEVER appear in
 * this codebase.
 */

const URL_BASE = (process.env.REACT_APP_SUPABASE_URL || "").replace(/\/+$/, "");
const ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || "";

const SESSION_KEY = "sb.session";

/** True when both environment variables are present. */
export function isConfigured() {
  return Boolean(URL_BASE && ANON_KEY);
}

/* ==========================================================================
 * SESSION STORAGE
 * ========================================================================== */

function readSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(session) {
  try {
    if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* Private browsing with storage disabled — session stays in memory only. */
  }
}

let memorySession = readSession();

function currentSession() {
  return memorySession;
}

function setSession(session) {
  memorySession = session;
  writeSession(session);
}

function isExpired(session) {
  if (!session?.expires_at) return true;
  // Refresh a minute early rather than racing the expiry.
  return Date.now() >= session.expires_at * 1000 - 60_000;
}

/* ==========================================================================
 * ERRORS
 * ========================================================================== */

export class SupabaseError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = "SupabaseError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function configError() {
  return new SupabaseError(
    "Supabase is not configured. Add REACT_APP_SUPABASE_URL and " +
      "REACT_APP_SUPABASE_ANON_KEY to .env and restart the dev server.",
    { code: "NOT_CONFIGURED" }
  );
}

async function toError(response) {
  let body = null;
  try {
    body = await response.json();
  } catch {
    /* Non-JSON error body (proxy errors, HTML pages). */
  }
  const message =
    body?.message ||
    body?.error_description ||
    body?.error ||
    body?.msg ||
    `Request failed with status ${response.status}`;
  return new SupabaseError(message, {
    status: response.status,
    code: body?.code,
    details: body?.details || body?.hint,
  });
}

/* ==========================================================================
 * AUTH
 * ========================================================================== */

async function authFetch(path, { method = "POST", body, token } = {}) {
  if (!isConfigured()) throw configError();
  const response = await fetch(`${URL_BASE}/auth/v1${path}`, {
    method,
    headers: {
      apikey: ANON_KEY,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw await toError(response);
  return response.status === 204 ? null : response.json();
}

function storeTokenResponse(data) {
  if (!data?.access_token) return null;
  const session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at:
      data.expires_at ||
      Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
    user: data.user || null,
  };
  setSession(session);
  return session;
}

let refreshInFlight = null;

async function refreshSession() {
  const session = currentSession();
  if (!session?.refresh_token) return null;

  // Collapse concurrent refreshes — several queries firing at once on a
  // dashboard would otherwise each burn the single-use refresh token, and
  // all but the first would fail.
  if (!refreshInFlight) {
    refreshInFlight = authFetch("/token?grant_type=refresh_token", {
      body: { refresh_token: session.refresh_token },
    })
      .then(storeTokenResponse)
      .catch(() => {
        setSession(null);
        return null;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

/** Returns a valid access token, refreshing first if needed. */
async function accessToken() {
  const session = currentSession();
  if (!session) return null;
  if (isExpired(session)) {
    const refreshed = await refreshSession();
    return refreshed?.access_token || null;
  }
  return session.access_token;
}

export const auth = {
  async signIn(email, password) {
    const data = await authFetch("/token?grant_type=password", {
      body: { email, password },
    });
    const session = storeTokenResponse(data);
    if (!session) {
      throw new SupabaseError("Sign in did not return a session.");
    }
    return session;
  },

  /**
   * Creates an account in Supabase Auth.
   *
   * This grants NOTHING on its own. Every RLS policy checks for an active
   * row in `admin_users`, and signing up does not create one — see
   * `claim_first_admin()` in database/schema.sql, which is what turns the
   * very first account into an administrator and leaves every later one
   * pending an existing admin's approval.
   *
   * GoTrue returns two different shapes depending on the project's
   * "Confirm email" setting: a full token response when confirmation is
   * off, and a bare user object when it is on. Both are normalised here so
   * the caller only has to look at `needsConfirmation`.
   */
  async signUp(email, password, { redirectTo } = {}) {
    const query = redirectTo
      ? `?redirect_to=${encodeURIComponent(redirectTo)}`
      : "";
    const data = await authFetch(`/signup${query}`, {
      body: { email, password },
    });

    const session = storeTokenResponse(data);
    return {
      session,
      user: session?.user || data?.user || data || null,
      needsConfirmation: !session,
    };
  },

  /**
   * Sends the "reset your password" email.
   *
   * Always resolves, even for an address with no account. That is
   * deliberate on Supabase's side and correct: a recovery form that
   * distinguished known from unknown addresses would be a free tool for
   * enumerating who has an account here.
   */
  async requestPasswordReset(email, { redirectTo } = {}) {
    const query = redirectTo
      ? `?redirect_to=${encodeURIComponent(redirectTo)}`
      : "";
    await authFetch(`/recover${query}`, { body: { email } });
    return true;
  },

  /**
   * Sets a new password for whoever the current token belongs to.
   *
   * Used in two places: the reset screen, where the token came out of the
   * recovery link, and any future "change my password" screen, where it is
   * the ordinary session token.
   */
  async updatePassword(password, { token } = {}) {
    const bearer = token || (await accessToken());
    if (!bearer) {
      throw new SupabaseError(
        "This password reset link has expired. Request a new one.",
        { code: "NO_TOKEN" }
      );
    }
    const data = await authFetch("/user", {
      method: "PUT",
      token: bearer,
      body: { password },
    });
    return data;
  },

  /**
   * Adopts the tokens Supabase puts in the URL fragment of a recovery link
   * (`#access_token=…&refresh_token=…&type=recovery`) as the live session,
   * so the reset screen can authenticate the password change.
   */
  adoptTokens({ access_token, refresh_token, expires_in, user }) {
    if (!access_token) return null;
    return storeTokenResponse({
      access_token,
      refresh_token,
      expires_in: Number(expires_in) || 3600,
      user: user || null,
    });
  },

  /** Reads the signed-in user's profile straight from GoTrue. */
  async fetchUser() {
    const token = await accessToken();
    if (!token) return null;
    return authFetch("/user", { method: "GET", token });
  },

  async signOut() {
    const token = currentSession()?.access_token;
    setSession(null);
    if (!token) return;
    try {
      await authFetch("/logout", { token });
    } catch {
      /* The local session is already cleared; a failed server-side logout
         is not worth blocking the UI over. */
    }
  },

  getSession() {
    return currentSession();
  },

  getUser() {
    return currentSession()?.user || null;
  },

  isSignedIn() {
    return Boolean(currentSession());
  },

  async ensureFreshToken() {
    return accessToken();
  },
};

/* ==========================================================================
 * POSTGREST QUERY BUILDER
 *
 * Deliberately mirrors the supabase-js surface used by this app:
 *   db.from("projects").select("*").eq("is_active", true).order("sort_order")
 * ========================================================================== */

class Query {
  constructor(table) {
    this.table = table;
    this.params = new URLSearchParams();
    this.method = "GET";
    this.body = null;
    this.headers = {};
    this.prefer = [];
    this.wantsSingle = false;
  }

  /**
   * Adding `select()` to a write is what asks PostgREST to return the
   * affected rows.
   *
   * This matters more than it looks. `return=representation` makes PostgREST
   * read the rows back after writing, which requires SELECT permission. The
   * anon role can INSERT into `submissions` but deliberately cannot SELECT
   * from it — that is what stops one visitor reading another's enquiry — so
   * a public insert that asked for its row back would be rejected by the very
   * policy protecting the table. Writes therefore default to
   * `return=minimal`, and only callers that explicitly select get rows back.
   */
  select(columns = "*") {
    this.params.set("select", columns);
    if (this.method !== "GET") this.prefer.push("return=representation");
    return this;
  }

  eq(column, value) {
    this.params.append(column, `eq.${value}`);
    return this;
  }

  neq(column, value) {
    this.params.append(column, `neq.${value}`);
    return this;
  }

  in(column, values) {
    this.params.append(column, `in.(${values.join(",")})`);
    return this;
  }

  gte(column, value) {
    this.params.append(column, `gte.${value}`);
    return this;
  }

  lte(column, value) {
    this.params.append(column, `lte.${value}`);
    return this;
  }

  /** Case-insensitive contains. Value is escaped for PostgREST's syntax. */
  ilike(column, value) {
    this.params.append(column, `ilike.*${String(value).replace(/[*,()]/g, "")}*`);
    return this;
  }

  /** OR across columns: .or("name.ilike.*ali*,email.ilike.*ali*") */
  or(expression) {
    this.params.append("or", `(${expression})`);
    return this;
  }

  order(column, { ascending = true, nullsFirst = false } = {}) {
    this.params.append(
      "order",
      `${column}.${ascending ? "asc" : "desc"}.${nullsFirst ? "nullsfirst" : "nullslast"}`
    );
    return this;
  }

  limit(n) {
    this.params.set("limit", String(n));
    return this;
  }

  range(from, to) {
    this.headers.Range = `${from}-${to}`;
    this.headers["Range-Unit"] = "items";
    this.params.set("offset", String(from));
    this.params.set("limit", String(to - from + 1));
    return this;
  }

  /** Ask PostgREST for the total row count alongside the page. */
  withCount() {
    this.prefer.push("count=exact");
    return this;
  }

  insert(values) {
    this.method = "POST";
    this.body = Array.isArray(values) ? values : [values];
    return this;
  }

  update(values) {
    this.method = "PATCH";
    this.body = values;
    return this;
  }

  upsert(values, { onConflict } = {}) {
    this.method = "POST";
    this.body = Array.isArray(values) ? values : [values];
    this.prefer.push("resolution=merge-duplicates");
    if (onConflict) this.params.set("on_conflict", onConflict);
    return this;
  }

  delete() {
    this.method = "DELETE";
    return this;
  }

  single() {
    this.wantsSingle = true;
    this.headers.Accept = "application/vnd.pgrst.object+json";
    return this;
  }

  /** Resolves to { data, count }. Rejects with SupabaseError. */
  async run() {
    if (!isConfigured()) throw configError();

    const token = await accessToken();
    const qs = this.params.toString();
    const url = `${URL_BASE}/rest/v1/${this.table}${qs ? `?${qs}` : ""}`;

    const prefer = [...this.prefer];
    if (
      this.method !== "GET" &&
      !prefer.some((item) => item.startsWith("return="))
    ) {
      prefer.push("return=minimal");
    }

    const response = await fetch(url, {
      method: this.method,
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${token || ANON_KEY}`,
        "Content-Type": "application/json",
        ...(prefer.length ? { Prefer: prefer.join(",") } : {}),
        ...this.headers,
      },
      ...(this.body ? { body: JSON.stringify(this.body) } : {}),
    });

    if (!response.ok) throw await toError(response);

    const countHeader = response.headers.get("content-range");
    const count = countHeader ? Number(countHeader.split("/")[1]) : null;

    if (response.status === 204) return { data: null, count };

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    return { data, count: Number.isNaN(count) ? null : count };
  }

  // Thenable, so callers can `await` the query directly.
  then(resolve, reject) {
    return this.run().then(resolve, reject);
  }

  catch(reject) {
    return this.run().catch(reject);
  }
}

export const db = {
  from(table) {
    return new Query(table);
  },

  /** Calls a Postgres function exposed over RPC. */
  async rpc(fn, args = {}) {
    if (!isConfigured()) throw configError();
    const token = await accessToken();
    const response = await fetch(`${URL_BASE}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${token || ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });
    if (!response.ok) throw await toError(response);
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  },
};

/* ==========================================================================
 * STORAGE
 * --------------------------------------------------------------------------
 * Uploads to the public `site-media` bucket created by
 * database/migration-02-cms.sql. Who may upload is decided by the storage
 * policies (is_editor()), not by this file — an anonymous request is refused
 * by Supabase regardless of what the browser sends.
 * ======================================================================== */

export const MEDIA_BUCKET = "site-media";

function safeName(name) {
  const dot = name.lastIndexOf(".");
  const ext = dot > -1 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const base = (dot > -1 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "file";
  return ext ? `${base}.${ext}` : base;
}

export const storage = {
  /** Public URL for an object path inside the media bucket. */
  publicUrl(objectPath, bucket = MEDIA_BUCKET) {
    return `${URL_BASE}/storage/v1/object/public/${bucket}/${objectPath
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
  },

  /**
   * Uploads one File. Returns { path, url }.
   * `folder` groups files, e.g. "projects/<id>" or "pages".
   */
  async upload(file, { folder = "uploads", bucket = MEDIA_BUCKET } = {}) {
    if (!isConfigured()) throw configError();
    const token = await accessToken();
    if (!token) {
      throw new SupabaseError("Your session has expired. Sign in again to upload.", {
        code: "NO_TOKEN",
      });
    }
    const stamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 7);
    const objectPath = `${folder.replace(/^\/+|\/+$/g, "")}/${stamp}-${random}-${safeName(file.name || "file")}`;

    const response = await fetch(
      `${URL_BASE}/storage/v1/object/${bucket}/${objectPath}`,
      {
        method: "POST",
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${token}`,
          "Content-Type": file.type || "application/octet-stream",
          "Cache-Control": "max-age=31536000",
          "x-upsert": "false",
        },
        body: file,
      }
    );
    if (!response.ok) {
      const error = await toError(response);
      if (/bucket not found/i.test(error.message)) {
        error.message =
          "The media bucket does not exist yet. Run database/migration-02-cms.sql in the Supabase SQL editor.";
      } else if (/row-level security|unauthorized|403/i.test(error.message)) {
        error.message = "Your account is not allowed to upload. An admin or editor role is required.";
      } else if (/payload too large|exceeded|size/i.test(error.message)) {
        error.message = "That file is too large. Images should be under 10 MB; videos under 50 MB.";
      }
      throw error;
    }
    return { path: objectPath, url: storage.publicUrl(objectPath, bucket) };
  },

  /** Deletes objects by path. Missing files are not an error. */
  async remove(paths, { bucket = MEDIA_BUCKET } = {}) {
    const list = (Array.isArray(paths) ? paths : [paths]).filter(Boolean);
    if (!list.length || !isConfigured()) return;
    const token = await accessToken();
    const response = await fetch(`${URL_BASE}/storage/v1/object/${bucket}`, {
      method: "DELETE",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${token || ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefixes: list }),
    });
    if (!response.ok) throw await toError(response);
  },

  /** The object path for a URL that lives in our bucket, or "" if external. */
  pathFromUrl(url, bucket = MEDIA_BUCKET) {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = String(url || "").indexOf(marker);
    if (index === -1) return "";
    return decodeURIComponent(String(url).slice(index + marker.length));
  },
};

const supabase = { db, auth, storage, isConfigured, SupabaseError };
export default supabase;
