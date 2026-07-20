"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string | null; success?: boolean };

const emptyToNull = (v: FormDataEntryValue | null) => (v && String(v).trim() !== "" ? String(v) : null);

function fail(message: string): ActionState {
  return { error: message };
}

const contractFieldsSchema = z.object({
  contract_number: z.string().min(1, "Contractnummer is verplicht"),
  start_date: z.string().min(1, "Startdatum is verplicht"),
  end_date: z.string().nullable(),
  contract_type: z.enum(["bepaalde_tijd", "onbepaalde_tijd", "oproep", "stage", "overig"]),
  hours_per_week: z.coerce.number().positive("Contracturen moet groter dan 0 zijn"),
  notes: z.string().nullable(),
});

// ---------------------------------------------------------------------
// Nieuw contract (met optioneel startsalaris)
// ---------------------------------------------------------------------

const createContractSchema = contractFieldsSchema.extend({
  employeeId: z.guid(),
  salary_amount: z.coerce.number().positive().nullable(),
  salary_scale: z.string().nullable(),
});

export async function createContract(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const salaryRaw = emptyToNull(formData.get("salary_amount"));
  const parsed = createContractSchema.safeParse({
    employeeId: formData.get("employeeId"),
    contract_number: formData.get("contract_number"),
    start_date: formData.get("start_date"),
    end_date: emptyToNull(formData.get("end_date")),
    contract_type: formData.get("contract_type"),
    hours_per_week: formData.get("hours_per_week"),
    notes: emptyToNull(formData.get("notes")),
    salary_amount: salaryRaw,
    salary_scale: emptyToNull(formData.get("salary_scale")),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ongeldige invoer.");

  const { employeeId, salary_amount, salary_scale, ...contractValues } = parsed.data;
  const supabase = await createClient();

  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .insert({ employee_id: employeeId, ...contractValues })
    .select("id")
    .single();
  if (contractError) return fail("Aanmaken contract mislukt: " + contractError.message);

  if (salary_amount !== null) {
    const { error: compError } = await supabase
      .from("contract_compensation")
      .insert({ contract_id: contract.id, salary_amount, salary_scale });
    if (compError) return fail("Contract aangemaakt, maar salaris opslaan mislukt: " + compError.message);

    const { error: historyError } = await supabase.from("salary_history").insert({
      employee_id: employeeId,
      old_salary: null,
      new_salary: salary_amount,
      reason: "Nieuw contract",
    });
    if (historyError) return fail("Contract en salaris opgeslagen, maar salarishistorie bijwerken mislukt: " + historyError.message);
  }

  revalidatePath(`/medewerkers/${employeeId}`);
  revalidatePath("/mijn-gegevens");
  return { error: null, success: true };
}

// ---------------------------------------------------------------------
// Contract basisgegevens bewerken (geen salaris)
// ---------------------------------------------------------------------

const updateContractSchema = contractFieldsSchema.extend({
  contractId: z.guid(),
  employeeId: z.guid(),
});

export async function updateContract(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = updateContractSchema.safeParse({
    contractId: formData.get("contractId"),
    employeeId: formData.get("employeeId"),
    contract_number: formData.get("contract_number"),
    start_date: formData.get("start_date"),
    end_date: emptyToNull(formData.get("end_date")),
    contract_type: formData.get("contract_type"),
    hours_per_week: formData.get("hours_per_week"),
    notes: emptyToNull(formData.get("notes")),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ongeldige invoer.");

  const { contractId, employeeId, ...values } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("contracts").update(values).eq("id", contractId);
  if (error) return fail("Opslaan mislukt: " + error.message);

  revalidatePath(`/medewerkers/${employeeId}`);
  revalidatePath("/mijn-gegevens");
  return { error: null, success: true };
}

// ---------------------------------------------------------------------
// Salaris wijzigen — schrijft altijd een salary_history-rij (§ Salarisbeheer)
// ---------------------------------------------------------------------

const updateCompensationSchema = z.object({
  contractId: z.guid(),
  employeeId: z.guid(),
  salary_amount: z.coerce.number().positive("Salaris moet groter dan 0 zijn"),
  salary_scale: z.string().nullable(),
  reason: z.string().nullable(),
});

export async function updateCompensation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = updateCompensationSchema.safeParse({
    contractId: formData.get("contractId"),
    employeeId: formData.get("employeeId"),
    salary_amount: formData.get("salary_amount"),
    salary_scale: emptyToNull(formData.get("salary_scale")),
    reason: emptyToNull(formData.get("reason")),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ongeldige invoer.");

  const { contractId, employeeId, salary_amount, salary_scale, reason } = parsed.data;
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("contract_compensation")
    .select("salary_amount")
    .eq("contract_id", contractId)
    .maybeSingle();

  const { error: upsertError } = await supabase
    .from("contract_compensation")
    .upsert({ contract_id: contractId, salary_amount, salary_scale });
  if (upsertError) return fail("Opslaan mislukt: " + upsertError.message);

  if (existing?.salary_amount !== salary_amount) {
    const { error: historyError } = await supabase.from("salary_history").insert({
      employee_id: employeeId,
      old_salary: existing?.salary_amount ?? null,
      new_salary: salary_amount,
      reason: reason ?? "Salariswijziging",
    });
    if (historyError) return fail("Salaris opgeslagen, maar salarishistorie bijwerken mislukt: " + historyError.message);
  }

  revalidatePath(`/medewerkers/${employeeId}`);
  return { error: null, success: true };
}
