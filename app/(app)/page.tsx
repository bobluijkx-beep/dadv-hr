import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/dashboard/stat-tile";
import { OvertimeTrendChart } from "@/components/dashboard/overtime-trend-chart";
import {
  getHeadcountStats,
  getOpenOvertimeCount,
  getCurrentMonthOvertimeTotal,
  getOvertimeTrend,
  getOpenLeaveRequestsCount,
  getExpiringContracts,
  getUpcomingBirthdays,
  getLowLeaveBalances,
  getActiveSickCount,
  getAbsenceRowsForStats,
  computeVerzuimPercentage,
  computeAverageAbsenceDuration,
} from "@/lib/services/dashboard";

const roleLabels: Record<string, string> = {
  admin: "Beheerder",
  hr: "HR",
  manager: "Leidinggevende",
  employee: "Medewerker",
};

export default async function Home() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: employee } = profile.employee_id
    ? await supabase
        .from("employees")
        .select("first_name, last_name, job_title")
        .eq("id", profile.employee_id)
        .single()
    : { data: null };

  const displayName = employee ? `${employee.first_name} ${employee.last_name}` : "Onbekend";
  const canSeeDashboard = profile.role === "admin" || profile.role === "hr" || profile.role === "manager";

  if (!canSeeDashboard) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Welkom, {displayName}</CardTitle>
            <CardDescription>{employee?.job_title ?? "Geen functie geregistreerd"}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rol:</span>
              <Badge variant="secondary">{roleLabels[profile.role] ?? profile.role}</Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/mijn-gegevens">Mijn gegevens</Link>} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canSeeFullAbsence = profile.role === "admin" || profile.role === "hr";
  const currentYear = new Date().getFullYear();

  const [
    headcount,
    openOvertimeCount,
    currentMonthOvertime,
    overtimeTrend,
    openLeaveRequests,
    expiringContracts,
    upcomingBirthdays,
    lowLeaveBalances,
    activeSickCount,
    absenceRows,
  ] = await Promise.all([
    getHeadcountStats(supabase),
    getOpenOvertimeCount(supabase),
    getCurrentMonthOvertimeTotal(supabase),
    getOvertimeTrend(supabase),
    getOpenLeaveRequestsCount(supabase),
    getExpiringContracts(supabase),
    getUpcomingBirthdays(supabase),
    getLowLeaveBalances(supabase, currentYear),
    getActiveSickCount(supabase, canSeeFullAbsence),
    getAbsenceRowsForStats(supabase, canSeeFullAbsence),
  ]);

  const verzuimPercentage = await computeVerzuimPercentage(supabase, canSeeFullAbsence, headcount.active);
  const avgAbsenceDuration = computeAverageAbsenceDuration(absenceRows);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Welkom, {displayName}</h1>
          <p className="text-sm text-muted-foreground">
            {profile.role === "manager" ? "Overzicht van jouw team" : "Organisatiebreed overzicht"}
          </p>
        </div>
        <Badge variant="secondary">{roleLabels[profile.role] ?? profile.role}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Totaal medewerkers" value={String(headcount.total)} />
        <StatTile label="Actieve medewerkers" value={String(headcount.active)} />
        <StatTile
          label="Medewerkers ziek"
          value={String(activeSickCount)}
          tone={activeSickCount > 0 ? "warning" : undefined}
        />
        <StatTile label="Ziekteverzuimpercentage" value={`${verzuimPercentage.toLocaleString("nl-NL")}%`} />
        <StatTile label="Gem. verzuimduur" value={`${avgAbsenceDuration.toLocaleString("nl-NL")} dgn`} />
        <StatTile label="Overuren deze maand" value={`${currentMonthOvertime.toLocaleString("nl-NL")}u`} />
        <StatTile
          label="Openstaande overuren"
          value={String(openOvertimeCount)}
          tone={openOvertimeCount > 0 ? "warning" : undefined}
        />
        <StatTile
          label="Openstaande verlofaanvragen"
          value={String(openLeaveRequests)}
          tone={openLeaveRequests > 0 ? "warning" : undefined}
        />
        <StatTile
          label="Contracten binnen 90 dagen"
          value={String(expiringContracts.length)}
          tone={expiringContracts.length > 0 ? "critical" : undefined}
        />
        <StatTile label="Verjaardagen komende 30 dagen" value={String(upcomingBirthdays.length)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overuren afgelopen 6 maanden</CardTitle>
        </CardHeader>
        <CardContent>
          <OvertimeTrendChart data={overtimeTrend} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contracten binnen 90 dagen</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {expiringContracts.length === 0 && <p className="text-muted-foreground">Geen aflopende contracten.</p>}
            {expiringContracts.map((c) => (
              <Link
                key={c.id}
                href={c.employee ? `/medewerkers/${c.employee.id}` : "#"}
                className="flex items-center justify-between hover:underline"
              >
                <span>{c.employee ? `${c.employee.first_name} ${c.employee.last_name}` : c.contract_number}</span>
                <span className="text-muted-foreground">{c.end_date}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verjaardagen komende 30 dagen</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {upcomingBirthdays.length === 0 && <p className="text-muted-foreground">Geen verjaardagen.</p>}
            {upcomingBirthdays.map((b) => (
              <Link key={b.id} href={`/medewerkers/${b.id}`} className="flex items-center justify-between hover:underline">
                <span>
                  {b.first_name} {b.last_name}
                </span>
                <span className="text-muted-foreground">
                  {b.daysUntil === 0 ? "Vandaag" : `over ${b.daysUntil} dgn`}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Laag verlofsaldo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {lowLeaveBalances.length === 0 && <p className="text-muted-foreground">Geen lage saldi.</p>}
            {lowLeaveBalances.map((b, i) => (
              <Link
                key={`${b.employeeId}-${i}`}
                href={`/medewerkers/${b.employeeId}`}
                className="flex items-center justify-between hover:underline"
              >
                <span>
                  {b.employeeName} · {b.leaveTypeName}
                </span>
                <span className="text-muted-foreground">{b.remainingHours}u</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
