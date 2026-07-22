"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { calculateScheduledHours } from "@/lib/services/schedules";
import { computeAnnualEntitlement } from "@/lib/services/leave";
import { notifyLeaveRequested, notifyLeaveDecided } from "@/lib/services/notifications";

export type ActionState = { error: string | null; success?: boolean; message?: string };

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
// Verlofjaar starten — schrijft de jaarlijkse opbouw (§Jaarverwerking, 1 jan)
// ---------------------------------------------------------------------

const startLeaveYearSchema = z.object({
  employeeId: z.guid(),
  year: z.coerce.number().int().min(2000).max(2100),
});

export async function startLeaveYear(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = startLeaveYearSchema.safeParse({
    employeeId: formData.get("employeeId"),
    year: formData.get("year"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ongeldige invoer.");
  const { employeeId, year } = parsed.data;

  const supabase = await createClient();
  const organizationId = await getOrganizationId(supabase);
  if (!organizationId) return fail("Organisatie niet gevonden.");

  const jan1 = `${year}-01-01`;
  const dec31 = `${year}-12-31`;

  const [{ data: leaveTypes, error: typesError }, { data: contracts, error: contractsError }] = await Promise.all([
    supabase.from("leave_types").select("id, accrual_factor").eq("organization_id", organizationId),
    supabase
      .from("contracts")
      .select("start_date, end_date, hours_per_week")
      .eq("employee_id", employeeId)
      .order("start_date", { ascending: false }),
  ]);
  if (typesError) return fail("Ophalen verloftypen mislukt: " + typesError.message);
  if (contractsError) return fail("Ophalen contracten mislukt: " + contractsError.message);

  const activeContract =
    (contracts ?? []).find((c) => c.start_date <= jan1 && (c.end_date === null || c.end_date >= jan1)) ??
    (contracts ?? []).find((c) => c.start_date <= dec31);
  if (!activeContract) return fail("Geen contract gevonden voor dit jaar — kan geen verlof opbouwen.");

  const { data: existingBalances, error: existingError } = await supabase
    .from("leave_balances")
    .select("leave_type_id")
    .eq("employee_id", employeeId)
    .eq("year", year);
  if (existingError) return fail("Controleren bestaand saldo mislukt: " + existingError.message);
  const existingTypeIds = new Set((existingBalances ?? []).map((b) => b.leave_type_id));

  const typesToProcess = (leaveTypes ?? []).filter((t) => !existingTypeIds.has(t.id));
  if (typesToProcess.length === 0) {
    return { error: null, success: true, message: `Verlofjaar ${year} was al gestart voor deze medewerker.` };
  }

  for (const leaveType of typesToProcess) {
    const entitlement = computeAnnualEntitlement(activeContract.hours_per_week, leaveType.accrual_factor);

    const { error: txError } = await supabase.from("leave_transactions").insert({
      employee_id: employeeId,
      leave_type_id: leaveType.id,
      transaction_date: jan1,
      hours: entitlement,
      transaction_type: "opbouw",
    });
    if (txError) return fail("Opbouw registreren mislukt: " + txError.message);

    const { error: balanceError } = await supabase
      .from("leave_balances")
      .insert({ employee_id: employeeId, leave_type_id: leaveType.id, year, accrued_hours: entitlement, taken_hours: 0 });
    if (balanceError) return fail("Saldo aanmaken mislukt: " + balanceError.message);
  }

  revalidatePath(`/medewerkers/${employeeId}`);
  revalidatePath("/mijn-gegevens");
  return { error: null, success: true, message: `Verlofjaar ${year} gestart.` };
}

// ---------------------------------------------------------------------
// Verlof aanvragen — uren automatisch berekend uit het rooster
// ---------------------------------------------------------------------

const createRequestSchema = z.object({
  employeeId: z.guid(),
  leaveTypeId: z.guid(),
  start_date: z.string().min(1, "Startdatum is verplicht"),
  end_date: z.string().min(1, "Einddatum is verplicht"),
});

export async function createLeaveRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = createRequestSchema.safeParse({
    employeeId: formData.get("employeeId"),
    leaveTypeId: formData.get("leaveTypeId"),
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ongeldige invoer.");
  if (parsed.data.end_date < parsed.data.start_date) return fail("Einddatum moet na startdatum liggen.");

  const supabase = await createClient();
  const organizationId = await getOrganizationId(supabase);
  if (!organizationId) return fail("Organisatie niet gevonden.");

  const hours = await calculateScheduledHours(
    supabase,
    parsed.data.employeeId,
    organizationId,
    parsed.data.start_date,
    parsed.data.end_date,
  );
  if (hours <= 0) return fail("Geen geplande werkuren in deze periode volgens het rooster.");

  const { data: request, error } = await supabase
    .from("leave_requests")
    .insert({
      employee_id: parsed.data.employeeId,
      leave_type_id: parsed.data.leaveTypeId,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      hours,
    })
    .select("id, leave_type:leave_types(name)")
    .single();
  if (error) return fail("Aanvragen mislukt: " + error.message);

  notifyLeaveRequested(
    parsed.data.employeeId,
    request.id,
    request.leave_type?.name ?? "Verlof",
    parsed.data.start_date,
    parsed.data.end_date,
  ).catch(() => {});

  revalidatePath(`/medewerkers/${parsed.data.employeeId}`);
  revalidatePath("/mijn-gegevens");
  return { error: null, success: true };
}

// ---------------------------------------------------------------------
// Status bijwerken — goedkeuren loopt via de approve_leave_request()
// database-functie (schrijft ook de ledger-transactie + saldo bij, wat een
// leidinggevende niet rechtstreeks mag doen op leave_transactions/-balances)
// ---------------------------------------------------------------------

const updateStatusSchema = z.object({
  id: z.guid(),
  employeeId: z.guid(),
  status: z.enum(["goedgekeurd", "afgewezen", "ingetrokken"]),
});

export async function updateLeaveRequestStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = updateStatusSchema.safeParse({
    id: formData.get("id"),
    employeeId: formData.get("employeeId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ongeldige invoer.");

  const supabase = await createClient();

  if (parsed.data.status === "goedgekeurd") {
    const { error } = await supabase.rpc("approve_leave_request", { p_request_id: parsed.data.id });
    if (error) return fail("Goedkeuren mislukt: " + error.message);
  } else {
    const { error } = await supabase
      .from("leave_requests")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.id);
    if (error) return fail("Bijwerken mislukt: " + error.message);
  }

  if (parsed.data.status === "goedgekeurd" || parsed.data.status === "afgewezen") {
    const { data: request } = await supabase
      .from("leave_requests")
      .select("start_date, end_date, leave_type:leave_types(name)")
      .eq("id", parsed.data.id)
      .single();
    if (request) {
      notifyLeaveDecided(
        parsed.data.employeeId,
        parsed.data.id,
        parsed.data.status === "goedgekeurd",
        request.leave_type?.name ?? "Verlof",
        request.start_date,
        request.end_date,
      ).catch(() => {});
    }
  }

  revalidatePath(`/medewerkers/${parsed.data.employeeId}`);
  revalidatePath("/mijn-gegevens");
  return { error: null, success: true };
}
