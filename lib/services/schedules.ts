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
