import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { calculateScheduledHours } from "@/lib/services/schedules";

type Client = SupabaseClient<Database>;

export type OvertimeEntry = {
  id: string;
  period_start: string;
  period_end: string;
  worked_hours: number;
  contract_hours: number;
  overtime_hours: number;
  status: Database["public"]["Enums"]["overtime_status"];
  payout_percentage: number | null;
  notes: string | null;
};

export async function getOvertimeEntries(supabase: Client, employeeId: string): Promise<OvertimeEntry[]> {
  const { data, error } = await supabase
    .from("overtime_entries")
    .select("id, period_start, period_end, worked_hours, contract_hours, overtime_hours, status, payout_percentage, notes")
    .eq("employee_id", employeeId)
    .order("period_start", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, overtime_hours: row.overtime_hours ?? 0 }));
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Worked hours come from lib/services/schedules' calculateScheduledHours
 * (shared with leave-request hour suggestions); contract_hours is prorated
 * per day from whichever contract was active on that date, so a contract
 * change mid-period is handled correctly instead of assuming one contract
 * for the whole span.
 */
export async function calculatePeriodHours(
  supabase: Client,
  employeeId: string,
  organizationId: string,
  periodStart: string,
  periodEnd: string,
) {
  const [workedHours, { data: contracts, error: contractsError }] = await Promise.all([
    calculateScheduledHours(supabase, employeeId, organizationId, periodStart, periodEnd),
    supabase.from("contracts").select("start_date, end_date, hours_per_week").eq("employee_id", employeeId),
  ]);
  if (contractsError) throw contractsError;

  let contractHours = 0;
  const cur = new Date(periodStart + "T00:00:00Z");
  const last = new Date(periodEnd + "T00:00:00Z");
  while (cur <= last) {
    const iso = isoDate(cur);
    const contract = (contracts ?? []).find(
      (c) => c.start_date <= iso && (c.end_date === null || c.end_date >= iso),
    );
    if (contract) contractHours += contract.hours_per_week / 7;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  return {
    workedHours,
    contractHours: Math.round(contractHours * 100) / 100,
  };
}

function isSameMonth(dateIso: string, ref: Date) {
  const d = new Date(dateIso + "T00:00:00Z");
  return d.getUTCFullYear() === ref.getUTCFullYear() && d.getUTCMonth() === ref.getUTCMonth();
}

function isSameYear(dateIso: string, ref: Date) {
  return new Date(dateIso + "T00:00:00Z").getUTCFullYear() === ref.getUTCFullYear();
}

/** §Overuren: dashboard van huidige maand, lopend jaar en totaal saldo. */
export function computeOvertimeSummary(entries: OvertimeEntry[], now = new Date()) {
  const currentMonthHours = entries
    .filter((e) => isSameMonth(e.period_start, now))
    .reduce((sum, e) => sum + e.overtime_hours, 0);

  const currentYearHours = entries
    .filter((e) => isSameYear(e.period_start, now))
    .reduce((sum, e) => sum + e.overtime_hours, 0);

  // Uitbetaalde uren zijn al verrekend — tellen niet meer mee in het openstaande saldo.
  const totalBalance = entries
    .filter((e) => e.status !== "uitbetaald")
    .reduce((sum, e) => sum + e.overtime_hours, 0);

  return {
    currentMonthHours: Math.round(currentMonthHours * 100) / 100,
    currentYearHours: Math.round(currentYearHours * 100) / 100,
    totalBalance: Math.round(totalBalance * 100) / 100,
  };
}
