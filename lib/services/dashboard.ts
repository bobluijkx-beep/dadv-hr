import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number) {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export async function getHeadcountStats(supabase: Client) {
  const [{ count: total, error: totalError }, { count: active, error: activeError }] = await Promise.all([
    supabase.from("employees").select("id", { count: "exact", head: true }),
    supabase.from("employees").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);
  if (totalError) throw totalError;
  if (activeError) throw activeError;
  return { total: total ?? 0, active: active ?? 0 };
}

export async function getOpenOvertimeCount(supabase: Client) {
  const { count, error } = await supabase
    .from("overtime_entries")
    .select("id", { count: "exact", head: true })
    .eq("status", "geregistreerd");
  if (error) throw error;
  return count ?? 0;
}

export async function getCurrentMonthOvertimeTotal(supabase: Client, now = new Date()) {
  const monthStart = isoDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
  const monthEnd = isoDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)));
  const { data, error } = await supabase
    .from("overtime_entries")
    .select("overtime_hours")
    .gte("period_start", monthStart)
    .lte("period_start", monthEnd);
  if (error) throw error;
  return Math.round((data ?? []).reduce((sum, r) => sum + (r.overtime_hours ?? 0), 0) * 100) / 100;
}

/** Totale overuren per maand, laatste `months` maanden (incl. huidige) — voor de trendgrafiek. */
export async function getOvertimeTrend(supabase: Client, months = 6, now = new Date()) {
  const rangeStart = isoDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1)));
  const { data, error } = await supabase
    .from("overtime_entries")
    .select("period_start, overtime_hours")
    .gte("period_start", rangeStart)
    .order("period_start");
  if (error) throw error;

  const buckets: { key: string; label: string; hours: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    buckets.push({
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("nl-NL", { month: "short", timeZone: "UTC" }),
      hours: 0,
    });
  }
  for (const row of data ?? []) {
    const d = new Date(row.period_start + "T00:00:00Z");
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) bucket.hours += row.overtime_hours ?? 0;
  }
  return buckets.map((b) => ({ ...b, hours: Math.round(b.hours * 100) / 100 }));
}

export async function getOpenLeaveRequestsCount(supabase: Client) {
  const { count, error } = await supabase
    .from("leave_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "aangevraagd");
  if (error) throw error;
  return count ?? 0;
}

export type ExpiringContract = {
  id: string;
  contract_number: string;
  end_date: string;
  employee: { id: string; first_name: string; last_name: string } | null;
};

export async function getExpiringContracts(supabase: Client, withinDays = 90, now = new Date()) {
  const today = isoDate(now);
  const limit = isoDate(addDays(now, withinDays));
  const { data, error } = await supabase
    .from("contracts")
    .select("id, contract_number, end_date, employee:employees(id, first_name, last_name)")
    .gte("end_date", today)
    .lte("end_date", limit)
    .order("end_date");
  if (error) throw error;
  return (data ?? []) as unknown as ExpiringContract[];
}

export type UpcomingBirthday = {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  daysUntil: number;
};

/** Verjaardagen komende `withinDays` dagen — maand/dag-vergelijking, met jaarwissel-support. */
export async function getUpcomingBirthdays(supabase: Client, withinDays = 30, now = new Date()) {
  const { data, error } = await supabase.from("employees").select("id, first_name, last_name, date_of_birth");
  if (error) throw error;

  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const results: UpcomingBirthday[] = [];

  for (const emp of data ?? []) {
    const dateOfBirth = emp.date_of_birth;
    if (!dateOfBirth) continue;
    const dob = new Date(dateOfBirth + "T00:00:00Z");
    let nextBirthday = new Date(Date.UTC(today.getUTCFullYear(), dob.getUTCMonth(), dob.getUTCDate()));
    if (nextBirthday < today) {
      nextBirthday = new Date(Date.UTC(today.getUTCFullYear() + 1, dob.getUTCMonth(), dob.getUTCDate()));
    }
    const daysUntil = Math.round((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= withinDays) {
      results.push({ ...emp, date_of_birth: dateOfBirth, daysUntil });
    }
  }

  return results.sort((a, b) => a.daysUntil - b.daysUntil);
}

export type LowLeaveBalance = {
  employeeId: string;
  employeeName: string;
  leaveTypeName: string;
  remainingHours: number;
};

/** Medewerkers met resterend verlof onder de drempel (standaard 8 uur, ~1 werkdag). */
export async function getLowLeaveBalances(supabase: Client, year: number, thresholdHours = 8) {
  const { data, error } = await supabase
    .from("leave_balances")
    .select(
      "remaining_hours, employee:employees(id, first_name, last_name), leave_type:leave_types(name)",
    )
    .eq("year", year)
    .lt("remaining_hours", thresholdHours);
  if (error) throw error;

  return (data ?? [])
    .filter((row) => row.employee)
    .map((row) => ({
      employeeId: row.employee!.id,
      employeeName: `${row.employee!.first_name} ${row.employee!.last_name}`,
      leaveTypeName: row.leave_type?.name ?? "Onbekend",
      remainingHours: row.remaining_hours ?? 0,
    })) as LowLeaveBalance[];
}

// ---------------------------------------------------------------------
// Verzuim-statistieken. Gebruikt absence_records (admin/hr) of
// absence_status_view (manager) — dezelfde §11.2-scheiding als de
// Verzuim-tab op het dossier.
// ---------------------------------------------------------------------

type AbsenceForStats = { employee_id?: string; first_sick_day: string; recovery_date: string | null; status: string };

async function fetchAbsenceRows(supabase: Client, canSeeFull: boolean): Promise<AbsenceForStats[]> {
  if (canSeeFull) {
    const { data, error } = await supabase.from("absence_records").select("employee_id, first_sick_day, recovery_date, status");
    if (error) throw error;
    return data ?? [];
  }
  const { data, error } = await supabase
    .from("absence_status_view")
    .select("employee_id, first_sick_day, recovery_date, status");
  if (error) throw error;
  return (data ?? []) as AbsenceForStats[];
}

export async function getActiveSickCount(supabase: Client, canSeeFull: boolean) {
  const rows = await fetchAbsenceRows(supabase, canSeeFull);
  return new Set(rows.filter((r) => r.status === "actief").map((r) => r.employee_id)).size;
}

/**
 * Verzuimpercentage over de lopende maand: som van overlappende ziektedagen
 * (per melding, begrensd tot de maand) gedeeld door (actieve medewerkers ×
 * dagen in de maand) × 100 — de gangbare formule, niet alleen een
 * koppen-tellende benadering.
 */
export async function computeVerzuimPercentage(
  supabase: Client,
  canSeeFull: boolean,
  activeEmployeeCount: number,
  now = new Date(),
) {
  const rows = await fetchAbsenceRows(supabase, canSeeFull);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  const daysInMonth = monthEnd.getUTCDate();

  let sickDays = 0;
  for (const row of rows) {
    const start = new Date(row.first_sick_day + "T00:00:00Z");
    const end = row.recovery_date ? new Date(row.recovery_date + "T00:00:00Z") : now;
    const overlapStart = start > monthStart ? start : monthStart;
    const overlapEnd = end < monthEnd ? end : monthEnd;
    if (overlapEnd >= overlapStart) {
      sickDays += Math.round((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
  }

  const availableDays = Math.max(1, activeEmployeeCount) * daysInMonth;
  return Math.round((sickDays / availableDays) * 1000) / 10;
}

export function computeAverageAbsenceDuration(rows: { first_sick_day: string; recovery_date: string | null }[]) {
  const resolved = rows.filter((r) => r.recovery_date);
  if (resolved.length === 0) return 0;
  const totalDays = resolved.reduce((sum, r) => {
    const start = new Date(r.first_sick_day + "T00:00:00Z");
    const end = new Date(r.recovery_date! + "T00:00:00Z");
    return sum + Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, 0);
  return Math.round((totalDays / resolved.length) * 10) / 10;
}

export async function getAbsenceRowsForStats(supabase: Client, canSeeFull: boolean) {
  return fetchAbsenceRows(supabase, canSeeFull);
}
