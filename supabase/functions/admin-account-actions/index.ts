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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const projectUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = request.headers.get("Authorization") || "";
  const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!projectUrl || !serviceKey) {
    return json({ error: "Account management is not configured on the server." }, 503);
  }
  if (!accessToken || accessToken === authHeader) {
    return json({ error: "Sign in as an active Admin to delete accounts." }, 401);
  }

  let payload: { action?: string; userId?: string };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  if (payload.action !== "delete-user" || !payload.userId) {
    return json({ error: "Invalid account deletion request." }, 400);
  }
  const idParts = payload.userId.split("-");
  if (
    payload.userId.length !== 36 ||
    idParts.length !== 5 ||
    [8, 4, 4, 4, 12].some((length, index) => idParts[index].length !== length)
  ) {
    return json({ error: "Invalid account id." }, 400);
  }

  const base = projectUrl.endsWith("/") ? projectUrl.slice(0, -1) : projectUrl;
  const serviceHeaders = {
    apikey: serviceKey,
    Authorization: "Bearer " + serviceKey,
    "Content-Type": "application/json",
  };

  try {
    // Resolve the caller from Supabase Auth; never trust a caller id supplied by the browser.
    const callerResponse = await fetch(base + "/auth/v1/user", {
      headers: { apikey: serviceKey, Authorization: "Bearer " + accessToken },
    });
    if (!callerResponse.ok) return json({ error: "Your session has expired. Sign in again." }, 401);
    const caller = await callerResponse.json();

    const callerUrl = new URL(base + "/rest/v1/admin_users");
    callerUrl.searchParams.set("select", "role,is_active");
    callerUrl.searchParams.set("id", "eq." + caller.id);
    const callerProfileResponse = await fetch(callerUrl, { headers: serviceHeaders });
    if (!callerProfileResponse.ok) throw new Error("Could not verify admin permissions.");
    const callerProfiles = await callerProfileResponse.json();
    const callerProfile = callerProfiles[0];
    if (callerProfile?.role !== "admin" || callerProfile.is_active !== true) {
      return json({ error: "Only an active Admin can permanently delete accounts." }, 403);
    }

    const targetUrl = new URL(base + "/rest/v1/admin_users");
    targetUrl.searchParams.set("select", "id");
    targetUrl.searchParams.set("id", "eq." + payload.userId);
    const targetResponse = await fetch(targetUrl, { headers: serviceHeaders });
    if (!targetResponse.ok) throw new Error("Could not find the admin account.");
    const targets = await targetResponse.json();
    if (!targets.length) return json({ error: "That admin account no longer exists." }, 404);

    // auth.users deletion cascades to public.admin_users via its declared FK.
    const deleteResponse = await fetch(
      base + "/auth/v1/admin/users/" + encodeURIComponent(payload.userId),
      { method: "DELETE", headers: serviceHeaders },
    );
    if (!deleteResponse.ok) return json({ error: "Supabase could not permanently delete this account." }, 400);
    return json({ ok: true, deletedUserId: payload.userId });
  } catch (error) {
    console.error("Admin account deletion failed", error);
    return json({ error: "Could not complete account deletion. Try again later." }, 500);
  }
});
