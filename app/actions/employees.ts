"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string | null; success?: boolean };

const emptyToNull = (v: FormDataEntryValue | null) => (v && String(v).trim() !== "" ? String(v) : null);

function fail(message: string): ActionState {
  return { error: message };
}

// ---------------------------------------------------------------------
// Persoonlijk / Werk (core employees row)
// ---------------------------------------------------------------------

const personalInfoSchema = z.object({
  employeeId: z.guid(),
  first_name: z.string().min(1, "Voornaam is verplicht"),
  insertion: z.string().nullable(),
  last_name: z.string().min(1, "Achternaam is verplicht"),
  preferred_name: z.string().nullable(),
  gender: z.enum(["man", "vrouw", "anders", "onbekend"]),
  date_of_birth: z.string().nullable(),
  iban: z.string().nullable(),
});

export async function updatePersonalInfo(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = personalInfoSchema.safeParse({
    employeeId: formData.get("employeeId"),
    first_name: formData.get("first_name"),
    insertion: emptyToNull(formData.get("insertion")),
    last_name: formData.get("last_name"),
    preferred_name: emptyToNull(formData.get("preferred_name")),
    gender: formData.get("gender"),
    date_of_birth: emptyToNull(formData.get("date_of_birth")),
    iban: emptyToNull(formData.get("iban")),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Ongeldige invoer.");
  }

  const { employeeId, ...values } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("employees").update(values).eq("id", employeeId);

  if (error) return fail("Opslaan mislukt: " + error.message);

  revalidatePath(`/medewerkers/${employeeId}`);
  revalidatePath("/mijn-gegevens");
  return { error: null, success: true };
}

const workInfoSchema = z.object({
  employeeId: z.guid(),
  job_title: z.string().nullable(),
  department_id: z.guid().nullable(),
  manager_id: z.guid().nullable(),
  employment_start_date: z.string().nullable(),
  employment_end_date: z.string().nullable(),
  is_active: z.boolean(),
});

export async function updateWorkInfo(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = workInfoSchema.safeParse({
    employeeId: formData.get("employeeId"),
    job_title: emptyToNull(formData.get("job_title")),
    department_id: emptyToNull(formData.get("department_id")),
    manager_id: emptyToNull(formData.get("manager_id")),
    employment_start_date: emptyToNull(formData.get("employment_start_date")),
    employment_end_date: emptyToNull(formData.get("employment_end_date")),
    is_active: formData.get("is_active") === "on",
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Ongeldige invoer.");
  }

  const { employeeId, ...values } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("employees").update(values).eq("id", employeeId);

  if (error) return fail("Opslaan mislukt: " + error.message);

  revalidatePath(`/medewerkers/${employeeId}`);
  return { error: null, success: true };
}

const bsnSchema = z.object({
  employeeId: z.guid(),
  bsn: z.string().regex(/^\d{8,9}$/, "BSN moet uit 8 of 9 cijfers bestaan"),
});

export async function updateEmployeeBsn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = bsnSchema.safeParse({
    employeeId: formData.get("employeeId"),
    bsn: formData.get("bsn"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ongeldige invoer.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_employee_bsn", {
    p_employee_id: parsed.data.employeeId,
    p_bsn: parsed.data.bsn,
  });

  if (error) return fail("BSN opslaan mislukt: " + error.message);

  revalidatePath(`/medewerkers/${parsed.data.employeeId}`);
  return { error: null, success: true };
}

// ---------------------------------------------------------------------
// Adres / contactgegevens (dated history — close current row, insert new)
// ---------------------------------------------------------------------

const addressSchema = z.object({
  employeeId: z.guid(),
  street: z.string().min(1, "Straat is verplicht"),
  postal_code: z.string().min(1, "Postcode is verplicht"),
  city: z.string().min(1, "Woonplaats is verplicht"),
});

export async function updateAddress(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = addressSchema.safeParse({
    employeeId: formData.get("employeeId"),
    street: formData.get("street"),
    postal_code: formData.get("postal_code"),
    city: formData.get("city"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ongeldige invoer.");

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { error: closeError } = await supabase
    .from("employee_addresses")
    .update({ valid_to: today })
    .eq("employee_id", parsed.data.employeeId)
    .is("valid_to", null);
  if (closeError) return fail("Opslaan mislukt: " + closeError.message);

  const { error: insertError } = await supabase.from("employee_addresses").insert({
    employee_id: parsed.data.employeeId,
    street: parsed.data.street,
    postal_code: parsed.data.postal_code,
    city: parsed.data.city,
    valid_from: today,
  });
  if (insertError) return fail("Opslaan mislukt: " + insertError.message);

  revalidatePath(`/medewerkers/${parsed.data.employeeId}`);
  revalidatePath("/mijn-gegevens");
  return { error: null, success: true };
}

const contactSchema = z.object({
  employeeId: z.guid(),
  phone: z.string().nullable(),
  email: z.string().email().nullable().or(z.literal(null)),
  emergency_contact_name: z.string().nullable(),
  emergency_contact_phone: z.string().nullable(),
});

export async function updateContactDetails(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = contactSchema.safeParse({
    employeeId: formData.get("employeeId"),
    phone: emptyToNull(formData.get("phone")),
    email: emptyToNull(formData.get("email")),
    emergency_contact_name: emptyToNull(formData.get("emergency_contact_name")),
    emergency_contact_phone: emptyToNull(formData.get("emergency_contact_phone")),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ongeldige invoer.");

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { error: closeError } = await supabase
    .from("employee_contact_details")
    .update({ valid_to: today })
    .eq("employee_id", parsed.data.employeeId)
    .is("valid_to", null);
  if (closeError) return fail("Opslaan mislukt: " + closeError.message);

  const { error: insertError } = await supabase.from("employee_contact_details").insert({
    employee_id: parsed.data.employeeId,
    phone: parsed.data.phone,
    email: parsed.data.email,
    emergency_contact_name: parsed.data.emergency_contact_name,
    emergency_contact_phone: parsed.data.emergency_contact_phone,
    valid_from: today,
  });
  if (insertError) return fail("Opslaan mislukt: " + insertError.message);

  revalidatePath(`/medewerkers/${parsed.data.employeeId}`);
  revalidatePath("/mijn-gegevens");
  return { error: null, success: true };
}

// ---------------------------------------------------------------------
// Privé (partner, kinderen, hobby's, notities) — never visible to manager
// ---------------------------------------------------------------------

const privateSchema = z.object({
  employeeId: z.guid(),
  partner_name: z.string().nullable(),
  partner_date_of_birth: z.string().nullable(),
  hobbies: z.string().nullable(),
  interests: z.string().nullable(),
  notes: z.string().nullable(),
});

export async function updatePrivateDetails(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = privateSchema.safeParse({
    employeeId: formData.get("employeeId"),
    partner_name: emptyToNull(formData.get("partner_name")),
    partner_date_of_birth: emptyToNull(formData.get("partner_date_of_birth")),
    hobbies: emptyToNull(formData.get("hobbies")),
    interests: emptyToNull(formData.get("interests")),
    notes: emptyToNull(formData.get("notes")),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ongeldige invoer.");

  const { employeeId, ...values } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("employee_private_details")
    .upsert({ employee_id: employeeId, ...values });

  if (error) return fail("Opslaan mislukt: " + error.message);

  revalidatePath(`/medewerkers/${employeeId}`);
  revalidatePath("/mijn-gegevens");
  return { error: null, success: true };
}

const childSchema = z.object({
  employeeId: z.guid(),
  name: z.string().min(1, "Naam is verplicht"),
  date_of_birth: z.string().nullable(),
});

export async function addChild(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = childSchema.safeParse({
    employeeId: formData.get("employeeId"),
    name: formData.get("name"),
    date_of_birth: emptyToNull(formData.get("date_of_birth")),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ongeldige invoer.");

  const supabase = await createClient();
  const { error } = await supabase.from("employee_children").insert({
    employee_id: parsed.data.employeeId,
    name: parsed.data.name,
    date_of_birth: parsed.data.date_of_birth,
  });
  if (error) return fail("Opslaan mislukt: " + error.message);

  revalidatePath(`/medewerkers/${parsed.data.employeeId}`);
  revalidatePath("/mijn-gegevens");
  return { error: null, success: true };
}

export async function removeChild(childId: string, employeeId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("employee_children").delete().eq("id", childId);
  revalidatePath(`/medewerkers/${employeeId}`);
  revalidatePath("/mijn-gegevens");
}

// ---------------------------------------------------------------------
// Nieuwe medewerker
// ---------------------------------------------------------------------

const createSchema = z.object({
  organization_id: z.guid(),
  employee_number: z.string().min(1, "Personeelsnummer is verplicht"),
  first_name: z.string().min(1, "Voornaam is verplicht"),
  last_name: z.string().min(1, "Achternaam is verplicht"),
  job_title: z.string().nullable(),
  department_id: z.guid().nullable(),
  employment_start_date: z.string().nullable(),
});

export async function createEmployee(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = createSchema.safeParse({
    organization_id: formData.get("organization_id"),
    employee_number: formData.get("employee_number"),
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    job_title: emptyToNull(formData.get("job_title")),
    department_id: emptyToNull(formData.get("department_id")),
    employment_start_date: emptyToNull(formData.get("employment_start_date")),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ongeldige invoer.");

  const supabase = await createClient();
  const { data, error } = await supabase.from("employees").insert(parsed.data).select("id").single();

  if (error) return fail("Aanmaken mislukt: " + error.message);

  revalidatePath("/medewerkers");
  redirect(`/medewerkers/${data.id}`);
}
