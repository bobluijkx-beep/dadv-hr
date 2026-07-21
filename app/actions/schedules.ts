"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string | null; success?: boolean };

function fail(message: string): ActionState {
  return { error: message };
}

function addDays(isoDate: string, days: number) {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------
// Nieuw roosterperiode (sluit de huidige automatisch af)
// ---------------------------------------------------------------------

const dayInputSchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
});

const createSchedulePeriodSchema = z.object({
  employeeId: z.guid(),
  start_date: z.string().min(1, "Ingangsdatum is verplicht"),
  days: z.array(dayInputSchema),
});

export async function createSchedulePeriod(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const employeeId = String(formData.get("employeeId") ?? "");
  const start_date = String(formData.get("start_date") ?? "");

  const days = [0, 1, 2, 3, 4, 5, 6].flatMap((weekday) => {
    const start_time = String(formData.get(`day_${weekday}_start`) ?? "").trim();
    const end_time = String(formData.get(`day_${weekday}_end`) ?? "").trim();
    if (!start_time || !end_time) return [];
    return [{ weekday, start_time, end_time }];
  });

  const parsed = createSchedulePeriodSchema.safeParse({ employeeId, start_date, days });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ongeldige invoer.");
  if (parsed.data.days.length === 0) return fail("Vul minstens één werkdag in.");

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("schedule_periods")
    .select("id")
    .eq("employee_id", parsed.data.employeeId)
    .is("end_date", null)
    .maybeSingle();

  if (current) {
    const { error: closeError } = await supabase
      .from("schedule_periods")
      .update({ end_date: addDays(parsed.data.start_date, -1) })
      .eq("id", current.id);
    if (closeError) return fail("Vorige periode afsluiten mislukt: " + closeError.message);
  }

  const { data: period, error: periodError } = await supabase
    .from("schedule_periods")
    .insert({ employee_id: parsed.data.employeeId, start_date: parsed.data.start_date })
    .select("id")
    .single();
  if (periodError) return fail("Aanmaken roosterperiode mislukt: " + periodError.message);

  const { error: daysError } = await supabase.from("schedule_days").insert(
    parsed.data.days.map((d) => ({
      schedule_period_id: period.id,
      weekday: d.weekday,
      start_time: d.start_time,
      end_time: d.end_time,
    })),
  );
  if (daysError) return fail("Roosterperiode aangemaakt, maar dagen opslaan mislukt: " + daysError.message);

  revalidatePath(`/medewerkers/${parsed.data.employeeId}`);
  revalidatePath("/mijn-gegevens");
  return { error: null, success: true };
}

// ---------------------------------------------------------------------
// Pauzeregels (Instellingen, admin/hr — RLS-enforced)
// ---------------------------------------------------------------------

const breakRuleSchema = z.object({
  min_hours: z.coerce.number().positive("Moet groter dan 0 zijn"),
  deduction_minutes: z.coerce.number().int().min(0, "Mag niet negatief zijn"),
  sort_order: z.coerce.number().int(),
});

export async function createBreakRule(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = breakRuleSchema.safeParse({
    min_hours: formData.get("min_hours"),
    deduction_minutes: formData.get("deduction_minutes"),
    sort_order: formData.get("sort_order") ?? 0,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ongeldige invoer.");

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return fail("Niet ingelogd.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", auth.user.id)
    .single();
  if (!profile) return fail("Profiel niet gevonden.");

  const { error } = await supabase
    .from("break_rules")
    .insert({ organization_id: profile.organization_id, ...parsed.data });
  if (error) return fail("Aanmaken pauzeregel mislukt: " + error.message);

  revalidatePath("/instellingen");
  return { error: null, success: true };
}

const updateBreakRuleSchema = breakRuleSchema.extend({ id: z.guid() });

export async function updateBreakRule(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = updateBreakRuleSchema.safeParse({
    id: formData.get("id"),
    min_hours: formData.get("min_hours"),
    deduction_minutes: formData.get("deduction_minutes"),
    sort_order: formData.get("sort_order") ?? 0,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ongeldige invoer.");

  const { id, ...values } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("break_rules").update(values).eq("id", id);
  if (error) return fail("Opslaan mislukt: " + error.message);

  revalidatePath("/instellingen");
  return { error: null, success: true };
}

export async function deleteBreakRule(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return fail("Ongeldige regel.");

  const supabase = await createClient();
  const { error } = await supabase.from("break_rules").delete().eq("id", id);
  if (error) return fail("Verwijderen mislukt: " + error.message);

  revalidatePath("/instellingen");
  return { error: null, success: true };
}
