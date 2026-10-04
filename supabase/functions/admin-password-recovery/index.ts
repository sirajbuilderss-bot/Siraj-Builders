const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Best-effort throttling within a warm Edge Function isolate.
const recentResetAttempts = new Map<string, number[]>();

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const projectUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!projectUrl || !serviceKey) {
    return json({ error: "Password reset is not configured on the server." }, 503);
  }

  let payload: { action?: string; email?: string; password?: string };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const action = payload.action || "check";
  const email = payload.email?.trim().toLowerCase() || "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Enter a valid admin email." }, 400);
  }
  const password = payload.password || "";
  if (action === "reset" && (password.length < 8 || password.length > 72)) {
    return json({ error: "Use a password between 8 and 72 characters." }, 400);
  }
  if (action !== "check" && action !== "reset") {
    return json({ error: "Invalid request." }, 400);
  }

  const base = projectUrl.replace(/\/+$/, "");
  const headers = {
    apikey: serviceKey,
    Authorization: "Bearer " + serviceKey,
    "Content-Type": "application/json",
  };

  try {
    const adminUrl = new URL(base + "/rest/v1/admin_users");
    adminUrl.searchParams.set("select", "id,role,is_active");
    adminUrl.searchParams.set("email", "eq." + email);
    const adminResponse = await fetch(adminUrl, { headers });
    if (!adminResponse.ok) throw new Error("Could not check the admin account.");
    const admins = await adminResponse.json();
    const admin = admins.find(
      (row: { role?: string; is_active?: boolean }) =>
        row.role === "admin" && row.is_active === true
    );
    if (action === "check") return json({ exists: Boolean(admin) });
    if (!admin) return json({ error: "No active admin account matches that email." }, 404);

    const now = Date.now();
    const attempts = (recentResetAttempts.get(admin.id) || []).filter(
      (attempt) => now - attempt < 10 * 60 * 1000
    );
    if (attempts.length >= 3) {
      recentResetAttempts.set(admin.id, attempts);
      return json({ error: "Too many reset attempts. Wait 10 minutes and try again." }, 429);
    }
    attempts.push(now);
    recentResetAttempts.set(admin.id, attempts);

    const updateResponse = await fetch(
      base + "/auth/v1/admin/users/" + encodeURIComponent(admin.id),
      {
        method: "PUT",
        headers,
        body: JSON.stringify({ password }),
      }
    );
    if (!updateResponse.ok) {
      return json({ error: "Supabase could not update the password. Check password rules and try again." }, 400);
    }

    return json({ ok: true });
  } catch (error) {
    console.error("Admin password reset failed", error);
    return json({ error: "Could not complete the password reset. Try again later." }, 500);
  }
});
