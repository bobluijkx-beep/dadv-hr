import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export type AbsenceRecord = {
  id: string;
  first_sick_day: string;
  is_full_time_absence: boolean;
  incapacity_percentage: number | null;
  recovery_date: string | null;
  status: Database["public"]["Enums"]["absence_status"];
  notes: string | null;
};

export type AbsenceStatus = {
  id: string;
  first_sick_day: string;
  is_full_time_absence: boolean;
  recovery_date: string | null;
  status: Database["public"]["Enums"]["absence_status"];
};

/** Full record — admin/hr and the employee themself only (RLS-enforced). */
export async function getAbsenceRecords(supabase: Client, employeeId: string): Promise<AbsenceRecord[]> {
  const { data, error } = await supabase
    .from("absence_records")
    .select("id, first_sick_day, is_full_time_absence, incapacity_percentage, recovery_date, status, notes")
    .eq("employee_id", employeeId)
    .order("first_sick_day", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * §11.2 (approved): the manager-facing view, status/dates only — never
 * incapacity_percentage or notes, which the view doesn't even select.
 */
export async function getAbsenceStatusView(supabase: Client, employeeId: string): Promise<AbsenceStatus[]> {
  const { data, error } = await supabase
    .from("absence_status_view")
    .select("id, first_sick_day, is_full_time_absence, recovery_date, status")
    .eq("employee_id", employeeId)
    .order("first_sick_day", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AbsenceStatus[];
}
