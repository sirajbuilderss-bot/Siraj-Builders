/**
 * ACTIVITY LOG SERVICE
 * ============================================================================
 * Audit trail. Entries are immutable, but an active admin may remove an
 * individual entry or prune entries before a chosen retention cutoff.
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

export async function removeEntry(id) {
  if (!id) throw new Error("Choose an activity entry to delete.");
  await db.from("activity_logs").delete().eq("id", id).run();
}

export async function removeOlderThan(cutoff) {
  const cutoffDate = new Date(cutoff);
  if (Number.isNaN(cutoffDate.getTime())) {
    throw new Error("Choose a valid date before deleting old activity.");
  }
  const { count } = await db
    .from("activity_logs")
    .delete()
    .lte("created_at", cutoffDate.toISOString())
    .withCount()
    .run();
  return count;
}

const activity = { log, recent, removeEntry, removeOlderThan };
export default activity;
