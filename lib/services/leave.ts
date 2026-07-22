import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export type LeaveType = {
  id: string;
  name: string;
  is_statutory: boolean;
  accrual_factor: number;
};

export type LeaveBalance = {
  leave_type_id: string;
  year: number;
  accrued_hours: number;
  taken_hours: number;
  remaining_hours: number;
};

export type LeaveRequest = {
  id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  hours: number;
  status: Database["public"]["Enums"]["leave_request_status"];
  requested_at: string;
};

export async function getLeaveTypes(supabase: Client, organizationId: string): Promise<LeaveType[]> {
  const { data, error } = await supabase
    .from("leave_types")
    .select("id, name, is_statutory, accrual_factor")
    .eq("organization_id", organizationId)
    .order("is_statutory", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getLeaveBalances(supabase: Client, employeeId: string, year: number): Promise<LeaveBalance[]> {
  const { data, error } = await supabase
    .from("leave_balances")
    .select("leave_type_id, year, accrued_hours, taken_hours, remaining_hours")
    .eq("employee_id", employeeId)
    .eq("year", year);
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, remaining_hours: row.remaining_hours ?? 0 }));
}

export async function getLeaveRequests(supabase: Client, employeeId: string): Promise<LeaveRequest[]> {
  const { data, error } = await supabase
    .from("leave_requests")
    .select("id, leave_type_id, start_date, end_date, hours, status, requested_at")
    .eq("employee_id", employeeId)
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** §Verlofbeheer: jaarlijks recht = accrual_factor × contracturen/week (4× wettelijk, 1× bovenwettelijk). */
export function computeAnnualEntitlement(hoursPerWeek: number, accrualFactor: number) {
  return Math.round(hoursPerWeek * accrualFactor * 100) / 100;
}
