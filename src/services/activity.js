/**
 * ACTIVITY LOG SERVICE
 * ============================================================================
 * Append-only audit trail. The RLS policies allow admins to insert and read
 * but never to update or delete — an audit trail that can be rewritten is not
 * an audit trail.
 *
 * Logging must never break the action it is describing, so every call here
 * swallows its own errors. A project that saved but whose log line failed is
 * a much better outcome than a save that appears to fail.
 */

import { db, auth } from "../lib/supabase";

export async function log(action, entity, { entityId, summary, metadata } = {}) {
  try {
    const user = auth.getUser();
    await db
      .from("activity_logs")
      .insert({
        actor_id: user?.id || null,
        actor_email: user?.email || "",
        action,
        entity,
        entity_id: entityId ? String(entityId) : null,
        summary: summary || "",
        metadata: metadata || {},
      })
      .run();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[activity] Could not write log entry:", error);
    }
  }
}

export async function recent(limit = 12) {
  try {
    const { data } = await db
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)
      .run();
    return data || [];
  } catch {
    return [];
  }
}

const activity = { log, recent };
export default activity;
