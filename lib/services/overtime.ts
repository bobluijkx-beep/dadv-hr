import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getBreakRules, type BreakRule } from "@/lib/services/schedules";

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

/** ISO-ish weekday matching schedule_days.weekday: 0 = maandag … 6 = zondag. */
function isoWeekday(date: Date) {
  return (date.getUTCDay() + 6) % 7;
}

function eachDate(start: string, end: string): Date[] {
  const dates: Date[] = [];
  const cur = new Date(start + "T00:00:00Z");
  const last = new Date(end + "T00:00:00Z");
  while (cur <= last) {
    dates.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

function netHoursForDay(rawHours: number, breakRules: BreakRule[]) {
  const applicable = [...breakRules].sort((a, b) => b.min_hours - a.min_hours).find((r) => rawHours > r.min_hours);
  const deduction = applicable ? applicable.deduction_minutes / 60 : 0;
  return Math.max(0, rawHours - deduction);
}

/**
 * Walks every calendar day in [periodStart, periodEnd] against the
 * employee's schedule history (which schedule_period covers that date, and
 * that period's schedule_days for the matching weekday) and their contract
 * history, so a rooster or contract change mid-period is handled correctly
 * instead of assuming a single rooster/contract for the whole span.
 */
export async function calculatePeriodHours(
  supabase: Client,
  employeeId: string,
  organizationId: string,
  periodStart: string,
  periodEnd: string,
) {
  const [{ data: periods, error: periodsError }, { data: contracts, error: contractsError }, breakRules] =
    await Promise.all([
      supabase
        .from("schedule_periods")
        .select("id, start_date, end_date")
        .eq("employee_id", employeeId),
      supabase
        .from("contracts")
        .select("start_date, end_date, hours_per_week")
        .eq("employee_id", employeeId),
      getBreakRules(supabase, organizationId),
    ]);
  if (periodsError) throw periodsError;
  if (contractsError) throw contractsError;

  const periodIds = (periods ?? []).map((p) => p.id);
  const daysByPeriod = new Map<string, { weekday: number; computed_hours: number }[]>();
  if (periodIds.length > 0) {
    const { data: days, error: daysError } = await supabase
      .from("schedule_days")
      .select("schedule_period_id, weekday, computed_hours")
      .in("schedule_period_id", periodIds);
    if (daysError) throw daysError;
    for (const day of days ?? []) {
      const list = daysByPeriod.get(day.schedule_period_id) ?? [];
      list.push({ weekday: day.weekday, computed_hours: day.computed_hours ?? 0 });
      daysByPeriod.set(day.schedule_period_id, list);
    }
  }

  let workedHours = 0;
  let contractHours = 0;

  for (const date of eachDate(periodStart, periodEnd)) {
    const iso = date.toISOString().slice(0, 10);
    const weekday = isoWeekday(date);

    const schedulePeriod = (periods ?? []).find(
      (p) => p.start_date <= iso && (p.end_date === null || p.end_date >= iso),
    );
    if (schedulePeriod) {
      const day = daysByPeriod.get(schedulePeriod.id)?.find((d) => d.weekday === weekday);
      if (day) workedHours += netHoursForDay(day.computed_hours, breakRules);
    }

    const contract = (contracts ?? []).find(
      (c) => c.start_date <= iso && (c.end_date === null || c.end_date >= iso),
    );
    if (contract) contractHours += contract.hours_per_week / 7;
  }

  return {
    workedHours: Math.round(workedHours * 100) / 100,
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
