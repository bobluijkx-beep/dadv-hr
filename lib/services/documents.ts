import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export type DocumentCategory =
  | "arbeidsovereenkomst"
  | "addendum"
  | "id_document"
  | "certificaat"
  | "functioneringsgesprek"
  | "beoordelingsgesprek"
  | "verzuimdocument"
  | "overig";

export async function getDocuments(supabase: Client, employeeId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("id, category, created_at")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * Grouped by document_id, each list sorted newest-version-first. "Current"
 * is deliberately always "highest version_number" rather than
 * documents.current_version_id — only admin/hr can UPDATE documents (see
 * §8 RLS), so an employee uploading their own document could never keep
 * that pointer in sync. Not writing to it at all keeps both upload paths
 * identical instead of needing an extra RLS policy just for bookkeeping.
 */
export async function getVersionsForDocuments(supabase: Client, documentIds: string[]) {
  const empty = new Map<string, { id: string; version_number: number; file_name: string; uploaded_at: string }[]>();
  if (documentIds.length === 0) return empty;

  const { data, error } = await supabase
    .from("document_versions")
    .select("id, document_id, version_number, file_name, uploaded_at")
    .in("document_id", documentIds)
    .order("version_number", { ascending: false });
  if (error) throw error;

  const map = empty;
  for (const row of data ?? []) {
    const list = map.get(row.document_id) ?? [];
    list.push(row);
    map.set(row.document_id, list);
  }
  return map;
}
