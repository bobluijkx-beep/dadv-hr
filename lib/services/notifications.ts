import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type AdminClient = ReturnType<typeof createAdminClient>;
type NotificationType = Database["public"]["Enums"]["notification_type"];

const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * §11 Centrale notificatieservice. notification_log has no INSERT policy
 * for any regular role (admin/hr can only SELECT it — see §7.3/RLS) so both
 * the send and the log write go through the service-role admin client,
 * never the RLS-scoped one a Server Action would normally use.
 */
async function sendViaResend(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    return { ok: false as const, messageId: null, error: "Resend is niet geconfigureerd." };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false as const, messageId: null, error: `Resend ${res.status}: ${body.slice(0, 300)}` };
    }
    const data = (await res.json()) as { id?: string };
    return { ok: true as const, messageId: data.id ?? null, error: null };
  } catch (err) {
    return { ok: false as const, messageId: null, error: err instanceof Error ? err.message : "Onbekende fout" };
  }
}

async function getAccountEmail(admin: AdminClient, profileId: string) {
  const { data, error } = await admin.auth.admin.getUserById(profileId);
  if (error || !data.user?.email) return null;
  return data.user.email;
}

async function getEmployeeAccountEmail(admin: AdminClient, employeeId: string) {
  const { data: profile } = await admin.from("profiles").select("id").eq("employee_id", employeeId).maybeSingle();
  if (!profile) return null;
  return getAccountEmail(admin, profile.id);
}

/** Manager's account email, falling back to an hr then an admin account in the same org. */
async function getApproverEmail(admin: AdminClient, employeeId: string) {
  const { data: employee } = await admin
    .from("employees")
    .select("manager_id, organization_id, first_name, last_name")
    .eq("id", employeeId)
    .single();
  if (!employee) return { email: null, employeeName: "" };

  const employeeName = `${employee.first_name} ${employee.last_name}`;

  if (employee.manager_id) {
    const { data: managerProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("employee_id", employee.manager_id)
      .maybeSingle();
    if (managerProfile) {
      const email = await getAccountEmail(admin, managerProfile.id);
      if (email) return { email, employeeName };
    }
  }

  for (const role of ["hr", "admin"] as const) {
    const { data: fallbackProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("organization_id", employee.organization_id)
      .eq("role", role)
      .limit(1)
      .maybeSingle();
    if (fallbackProfile) {
      const email = await getAccountEmail(admin, fallbackProfile.id);
      if (email) return { email, employeeName };
    }
  }

  return { email: null, employeeName };
}

async function sendAndLog(
  type: NotificationType,
  recipientEmail: string | null,
  subject: string,
  html: string,
  related: { table: string; id: string },
) {
  if (!recipientEmail) return;
  const admin = createAdminClient();
  const result = await sendViaResend(recipientEmail, subject, html);
  await admin.from("notification_log").insert({
    type,
    recipient_email: recipientEmail,
    status: result.ok ? "verzonden" : "mislukt",
    resend_message_id: result.messageId,
    related_table: related.table,
    related_id: related.id,
  });
}

// ---------------------------------------------------------------------
// Verlof
// ---------------------------------------------------------------------

export async function notifyLeaveRequested(
  employeeId: string,
  requestId: string,
  leaveTypeName: string,
  startDate: string,
  endDate: string,
) {
  const admin = createAdminClient();
  const { email, employeeName } = await getApproverEmail(admin, employeeId);
  await sendAndLog(
    "verlof_aangevraagd",
    email,
    `Nieuwe verlofaanvraag: ${employeeName}`,
    `<p>${employeeName} heeft <strong>${leaveTypeName}</strong> aangevraagd van ${startDate} t/m ${endDate}.</p>`,
    { table: "leave_requests", id: requestId },
  );
}

export async function notifyLeaveDecided(
  employeeId: string,
  requestId: string,
  approved: boolean,
  leaveTypeName: string,
  startDate: string,
  endDate: string,
) {
  const admin = createAdminClient();
  const email = await getEmployeeAccountEmail(admin, employeeId);
  await sendAndLog(
    approved ? "verlof_goedgekeurd" : "verlof_afgewezen",
    email,
    approved ? "Je verlofaanvraag is goedgekeurd" : "Je verlofaanvraag is afgewezen",
    `<p>Je aanvraag voor <strong>${leaveTypeName}</strong> (${startDate} t/m ${endDate}) is ${
      approved ? "goedgekeurd" : "afgewezen"
    }.</p>`,
    { table: "leave_requests", id: requestId },
  );
}

// ---------------------------------------------------------------------
// Overuren
// ---------------------------------------------------------------------

export async function notifyOvertimeSubmitted(employeeId: string, entryId: string, periodStart: string, periodEnd: string) {
  const admin = createAdminClient();
  const { email, employeeName } = await getApproverEmail(admin, employeeId);
  await sendAndLog(
    "overuren_ingediend",
    email,
    `Nieuwe overurenregistratie: ${employeeName}`,
    `<p>${employeeName} heeft overuren geregistreerd voor ${periodStart} t/m ${periodEnd}.</p>`,
    { table: "overtime_entries", id: entryId },
  );
}

const overtimeStatusCopy = {
  goedgekeurd: { type: "overuren_goedgekeurd" as const, subject: "Je overuren zijn goedgekeurd", label: "goedgekeurd" },
  aangeboden_salarisadministratie: {
    type: "overuren_aangeboden" as const,
    subject: "Je overuren zijn aangeboden aan de salarisadministratie",
    label: "aangeboden aan de salarisadministratie",
  },
  verwerkt: { type: "overuren_verwerkt" as const, subject: "Je overuren zijn verwerkt", label: "verwerkt" },
};

export async function notifyOvertimeStatus(
  employeeId: string,
  entryId: string,
  status: keyof typeof overtimeStatusCopy,
  periodStart: string,
  periodEnd: string,
  payoutPercentage?: number | null,
) {
  const copy = overtimeStatusCopy[status];
  const admin = createAdminClient();
  const email = await getEmployeeAccountEmail(admin, employeeId);
  const extra = status === "aangeboden_salarisadministratie" && payoutPercentage ? ` (${payoutPercentage}%)` : "";
  await sendAndLog(
    copy.type,
    email,
    copy.subject,
    `<p>Je overuren voor ${periodStart} t/m ${periodEnd} zijn ${copy.label}${extra}.</p>`,
    { table: "overtime_entries", id: entryId },
  );
}
