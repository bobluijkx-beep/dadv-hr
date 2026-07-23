import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export type SyncLogEntry = {
  id: string;
  system: string;
  direction: Database["public"]["Enums"]["integration_direction"];
  entity: string;
  status: Database["public"]["Enums"]["integration_sync_status"];
  synced_at: string;
};

/** Admin/hr only, internal plumbing (§RLS) — not user-facing outside Instellingen. */
export async function getSyncLog(supabase: Client, limit = 20): Promise<SyncLogEntry[]> {
  const { data, error } = await supabase
    .from("integration_sync_log")
    .select("id, system, direction, entity, status, synced_at")
    .order("synced_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
