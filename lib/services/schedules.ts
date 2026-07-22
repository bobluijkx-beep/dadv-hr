import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export type BreakRule = {
  id: string;
  min_hours: number;
  deduction_minutes: number;
  sort_order: number;
};

export type ScheduleDay = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  computed_hours: number;
};

export async function getBreakRules(supabase: Client, organizationId: string): Promise<BreakRule[]> {
  const { data, error } = await supabase
    .from("break_rules")
    .select("id, min_hours, deduction_minutes, sort_order")
    .eq("organization_id", organizationId)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function getSchedulePeriods(supabase: Client, employeeId: string) {
  const { data, error } = await supabase
    .from("schedule_periods")
    .select("id, start_date, end_date")
    .eq("employee_id", employeeId)
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getScheduleDays(supabase: Client, schedulePeriodId: string): Promise<ScheduleDay[]> {
  const { data, error } = await supabase
    .from("schedule_days")
    .select("id, weekday, start_time, end_time, computed_hours")
    .eq("schedule_period_id", schedulePeriodId)
    .order("weekday");
  if (error) throw error;
  return (data ?? []) as ScheduleDay[];
}

/**
 * Deducts the applicable break rule from each day's raw hours, then sums the
 * week. Rules are configurable per §"Pauzeregels" (e.g. >5.5h = -30min,
 * >8h = -45min) — the applicable rule for a day is the one with the highest
 * min_hours threshold that the day's raw hours still exceed.
 */
export function computeWeeklyHours(days: ScheduleDay[], breakRules: BreakRule[]) {
  const sortedRules = [...breakRules].sort((a, b) => b.min_hours - a.min_hours);

  const perDay = days.map((day) => {
    const applicableRule = sortedRules.find((rule) => day.computed_hours > rule.min_hours);
    const deductionHours = applicableRule ? applicableRule.deduction_minutes / 60 : 0;
    const netHours = Math.max(0, day.computed_hours - deductionHours);
    return { ...day, deductionHours, netHours };
  });

  const rawTotal = perDay.reduce((sum, d) => sum + d.computed_hours, 0);
  const netTotal = perDay.reduce((sum, d) => sum + d.netHours, 0);

  return { perDay, rawTotal, netTotal };
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
 * Walks every calendar day in [start, end] against the employee's schedule
 * history — which schedule_period covers that date, and that period's
 * schedule_days for the matching weekday — so a rooster change mid-range is
 * handled correctly instead of assuming a single rooster for the whole span.
 * Shared by overtime (worked hours) and leave (hours a request would cover).
 */
export async function calculateScheduledHours(
  supabase: Client,
  employeeId: string,
  organizationId: string,
  start: string,
  end: string,
) {
  const [{ data: periods, error: periodsError }, breakRules] = await Promise.all([
    supabase.from("schedule_periods").select("id, start_date, end_date").eq("employee_id", employeeId),
    getBreakRules(supabase, organizationId),
  ]);
  if (periodsError) throw periodsError;

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

  let totalHours = 0;
  for (const date of eachDate(start, end)) {
    const iso = date.toISOString().slice(0, 10);
    const weekday = isoWeekday(date);
    const schedulePeriod = (periods ?? []).find(
      (p) => p.start_date <= iso && (p.end_date === null || p.end_date >= iso),
    );
    if (!schedulePeriod) continue;
    const day = daysByPeriod.get(schedulePeriod.id)?.find((d) => d.weekday === weekday);
    if (day) totalHours += netHoursForDay(day.computed_hours, breakRules);
  }

  return Math.round(totalHours * 100) / 100;
}
