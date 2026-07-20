import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

/**
 * Deliberately never embeds contract_compensation here (e.g.
 * `select=...,contract_compensation(*)`), even though it's a normal
 * cross-table FK (not the self-referential kind that broke the manager
 * embed in Fase 2). contract_compensation has no SELECT policy at all for
 * manager/employee, so fetching it separately — and only when the caller
 * is admin/hr — keeps the "no salary access" guarantee simple to reason
 * about without depending on PostgREST's embed-vs-RLS behaviour.
 */
export async function getContractsForEmployee(supabase: Client, employeeId: string) {
  const { data, error } = await supabase
    .from("contracts")
    .select("id, contract_number, start_date, end_date, contract_type, hours_per_week, notes")
    .eq("employee_id", employeeId)
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getCompensationForContracts(supabase: Client, contractIds: string[]) {
  if (contractIds.length === 0) return new Map<string, { salary_amount: number; salary_scale: string | null }>();

  const { data, error } = await supabase
    .from("contract_compensation")
    .select("contract_id, salary_amount, salary_scale")
    .in("contract_id", contractIds);
  if (error) throw error;

  return new Map((data ?? []).map((row) => [row.contract_id, row]));
}

export async function getSalaryHistory(supabase: Client, employeeId: string) {
  const { data, error } = await supabase
    .from("salary_history")
    .select("id, change_date, old_salary, new_salary, absolute_difference, percentage_increase, reason")
    .eq("employee_id", employeeId)
    .order("change_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
