"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { calculatePeriodHours } from "@/lib/services/overtime";

export type ActionState = { error: string | null; success?: boolean };

function fail(message: string): ActionState {
  return { error: message };
}

async function getOrganizationId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", auth.user.id)
    .single();
  return profile?.organization_id ?? null;
}

// ---------------------------------------------------------------------
// Nieuwe overurenregistratie — uren automatisch berekend uit het rooster
// ---------------------------------------------------------------------

const createEntrySchema = z.object({
  employeeId: z.guid(),
  period_start: z.string().min(1, "Startdatum is verplicht"),
  period_end: z.string().min(1, "Einddatum is verplicht"),
  notes: z.string().nullable(),
});

export async function createOvertimeEntry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const notesRaw = formData.get("notes");
  const parsed = createEntrySchema.safeParse({
    employeeId: formData.get("employeeId"),
    period_start: formData.get("period_start"),
    period_end: formData.get("period_end"),
    notes: notesRaw && String(notesRaw).trim() !== "" ? String(notesRaw) : null,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ongeldige invoer.");
  if (parsed.data.period_end < parsed.data.period_start) return fail("Einddatum moet na startdatum liggen.");

  const supabase = await createClient();
  const organizationId = await getOrganizationId(supabase);
  if (!organizationId) return fail("Organisatie niet gevonden.");

  const { workedHours, contractHours } = await calculatePeriodHours(
    supabase,
    parsed.data.employeeId,
    organizationId,
    parsed.data.period_start,
    parsed.data.period_end,
  );

  const { error } = await supabase.from("overtime_entries").insert({
    employee_id: parsed.data.employeeId,
    period_start: parsed.data.period_start,
    period_end: parsed.data.period_end,
    worked_hours: workedHours,
    contract_hours: contractHours,
    notes: parsed.data.notes,
  });
  if (error) return fail("Registreren mislukt: " + error.message);

  revalidatePath(`/medewerkers/${parsed.data.employeeId}`);
  revalidatePath("/mijn-gegevens");
  return { error: null, success: true };
}

// ---------------------------------------------------------------------
// Statusworkflow: geregistreerd -> goedgekeurd -> (aangeboden_salaris-
// administratie met percentage, óf tijd_voor_tijd) -> verwerkt -> uitbetaald
// ---------------------------------------------------------------------

const updateStatusSchema = z.object({
  id: z.guid(),
  employeeId: z.guid(),
  status: z.enum([
    "geregistreerd",
    "goedgekeurd",
    "aangeboden_salarisadministratie",
    "verwerkt",
    "uitbetaald",
    "tijd_voor_tijd",
  ]),
  payout_percentage: z.union([z.literal("100"), z.literal("125"), z.literal("150"), z.literal("200")]).nullable(),
});

export async function updateOvertimeStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const payoutRaw = formData.get("payout_percentage");
  const parsed = updateStatusSchema.safeParse({
    id: formData.get("id"),
    employeeId: formData.get("employeeId"),
    status: formData.get("status"),
    payout_percentage: payoutRaw && String(payoutRaw).trim() !== "" ? String(payoutRaw) : null,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ongeldige invoer.");

  if (parsed.data.status === "aangeboden_salarisadministratie" && !parsed.data.payout_percentage) {
    return fail("Kies een uitbetalingspercentage.");
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  // payout_percentage is only ever set on the way into
  // aangeboden_salarisadministratie or explicitly cleared for tijd_voor_tijd —
  // later transitions (verwerkt, uitbetaald) must leave it untouched, not
  // null it back out.
  const update = {
    status: parsed.data.status,
    ...(parsed.data.status === "aangeboden_salarisadministratie"
      ? { payout_percentage: Number(parsed.data.payout_percentage) }
      : parsed.data.status === "tijd_voor_tijd"
        ? { payout_percentage: null }
        : {}),
    ...(parsed.data.status === "goedgekeurd" && auth.user ? { approved_by: auth.user.id } : {}),
  };

  const { error } = await supabase.from("overtime_entries").update(update).eq("id", parsed.data.id);
  if (error) return fail("Bijwerken mislukt: " + error.message);

  revalidatePath(`/medewerkers/${parsed.data.employeeId}`);
  revalidatePath("/mijn-gegevens");
  return { error: null, success: true };
}
