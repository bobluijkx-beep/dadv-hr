import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployeeCore, decryptBsn } from "@/lib/services/employees";
import { employeeToAfasRecord } from "./mapper";
import { AfasClient } from "./client";

type Client = SupabaseClient<Database>;

/**
 * §Module 10 orchestration: fetch → map → (attempt) push → record mapping +
 * log. Every step already exists for a reason production would need it —
 * only the actual HTTP call in AfasClient is a stub — so wiring a real
 * environment in later only means implementing AfasClient's methods.
 */
export async function syncEmployeeToAfas(supabase: Client, employeeId: string): Promise<{ ok: boolean; message: string }> {
  const employee = await getEmployeeCore(supabase, employeeId);
  const bsn = await decryptBsn(supabase, employee.bsn_encrypted);

  if (!bsn) {
    await logSync(supabase, "outbound", "employee", "failed", { employeeId, reason: "BSN niet beschikbaar" });
    return { ok: false, message: "BSN kon niet worden ontsleuteld — synchronisatie geannuleerd." };
  }
  if (!employee.date_of_birth || !employee.employment_start_date) {
    await logSync(supabase, "outbound", "employee", "failed", {
      employeeId,
      reason: "Geboortedatum of datum indiensttreding ontbreekt",
    });
    return { ok: false, message: "Geboortedatum of datum indiensttreding ontbreekt — synchronisatie geannuleerd." };
  }

  const record = employeeToAfasRecord({
    employee_number: employee.employee_number,
    first_name: employee.first_name,
    insertion: employee.insertion,
    last_name: employee.last_name,
    date_of_birth: employee.date_of_birth,
    bsn,
    iban: employee.iban,
    job_title: employee.job_title,
    department_name: employee.department?.name ?? null,
    employment_start_date: employee.employment_start_date,
    employment_end_date: employee.employment_end_date,
  });

  const client = new AfasClient();
  const result = await client.pushEmployee(record);

  if (result.success) {
    await recordMapping(supabase, "employees", employeeId, result.externalId);
    await logSync(supabase, "outbound", "employee", "success", { employeeId });
    return { ok: true, message: "Gesynchroniseerd met AFAS." };
  }

  await logSync(supabase, "outbound", "employee", "failed", { employeeId, reason: result.error });
  return { ok: false, message: result.error };
}

export async function recordMapping(supabase: Client, localTable: string, localId: string, externalId: string) {
  const { error } = await supabase
    .from("integration_mappings")
    .upsert({ system: "afas", local_table: localTable, local_id: localId, external_id: externalId });
  if (error) throw error;
}

export async function getMapping(supabase: Client, localTable: string, localId: string) {
  const { data, error } = await supabase
    .from("integration_mappings")
    .select("external_id")
    .eq("system", "afas")
    .eq("local_table", localTable)
    .eq("local_id", localId)
    .maybeSingle();
  if (error) throw error;
  return data?.external_id ?? null;
}

/**
 * integration_sync_log has no INSERT policy for any regular role (only
 * "admin/hr select" — see supabase/migrations/00000000000016_rls_policies.sql)
 * so this write must go through the service-role admin client, same as
 * notification_log in Fase 10.
 */
async function logSync(
  _supabase: Client,
  direction: Database["public"]["Enums"]["integration_direction"],
  entity: string,
  status: Database["public"]["Enums"]["integration_sync_status"],
  payload: Record<string, Json>,
) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("integration_sync_log")
    .insert({ system: "afas", direction, entity, status, payload });
  if (error) throw error;
}
