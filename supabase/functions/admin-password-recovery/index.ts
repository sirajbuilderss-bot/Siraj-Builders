// Retired: password changes must use Supabase Auth's verified recovery flow.
// This function intentionally performs no account lookup or password update.
Deno.serve(() =>
  new Response(
    JSON.stringify({ error: "This endpoint is retired. Request a verified password reset email." }),
    {
      status: 410,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Content-Type": "application/json",
      },
    },
  ),
);
