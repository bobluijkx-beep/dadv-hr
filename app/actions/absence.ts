"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string | null; success?: boolean };

const emptyToNull = (v: FormDataEntryValue | null) => (v && String(v).trim() !== "" ? String(v) : null);

function fail(message: string): ActionState {
  return { error: message };
}

// ---------------------------------------------------------------------
// Nieuwe ziekmelding — admin/hr (RLS-enforced)
// ---------------------------------------------------------------------

const createAbsenceSchema = z.object({
  employeeId: z.guid(),
  first_sick_day: z.string().min(1, "Eerste ziektedag is verplicht"),
  is_full_time_absence: z.enum(["true", "false"]),
  incapacity_percentage: z.coerce.number().min(0).max(100).nullable(),
  notes: z.string().nullable(),
});

export async function createAbsenceRecord(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const percentageRaw = emptyToNull(formData.get("incapacity_percentage"));
  const parsed = createAbsenceSchema.safeParse({
    employeeId: formData.get("employeeId"),
    first_sick_day: formData.get("first_sick_day"),
    is_full_time_absence: formData.get("is_full_time_absence"),
    incapacity_percentage: percentageRaw,
    notes: emptyToNull(formData.get("notes")),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ongeldige invoer.");

  const supabase = await createClient();
  const { error } = await supabase.from("absence_records").insert({
    employee_id: parsed.data.employeeId,
    first_sick_day: parsed.data.first_sick_day,
    is_full_time_absence: parsed.data.is_full_time_absence === "true",
    incapacity_percentage: parsed.data.incapacity_percentage,
    notes: parsed.data.notes,
  });
  if (error) return fail("Registreren mislukt: " + error.message);

  revalidatePath(`/medewerkers/${parsed.data.employeeId}`);
  revalidatePath("/mijn-gegevens");
  return { error: null, success: true };
}

// ---------------------------------------------------------------------
// Bijwerken (hersteldatum/status/percentage/notities) — admin/hr
// ---------------------------------------------------------------------

const updateAbsenceSchema = z.object({
  id: z.guid(),
  employeeId: z.guid(),
  status: z.enum(["actief", "hersteld", "gedeeltelijk_hersteld"]),
  recovery_date: z.string().nullable(),
  incapacity_percentage: z.coerce.number().min(0).max(100).nullable(),
  notes: z.string().nullable(),
});

export async function updateAbsenceRecord(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const percentageRaw = emptyToNull(formData.get("incapacity_percentage"));
  const parsed = updateAbsenceSchema.safeParse({
    id: formData.get("id"),
    employeeId: formData.get("employeeId"),
    status: formData.get("status"),
    recovery_date: emptyToNull(formData.get("recovery_date")),
    incapacity_percentage: percentageRaw,
    notes: emptyToNull(formData.get("notes")),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ongeldige invoer.");
  if (parsed.data.status !== "actief" && !parsed.data.recovery_date) {
    return fail("Hersteldatum is verplicht bij deze status.");
  }

  const { id, employeeId, ...values } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("absence_records").update(values).eq("id", id);
  if (error) return fail("Bijwerken mislukt: " + error.message);

  revalidatePath(`/medewerkers/${employeeId}`);
  revalidatePath("/mijn-gegevens");
  return { error: null, success: true };
}
