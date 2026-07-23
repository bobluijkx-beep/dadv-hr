import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getBreakRules } from "@/lib/services/schedules";
import { getSyncLog } from "@/lib/services/integrations";
import { getManagerOptions } from "@/lib/services/employees";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BreakRulesManager } from "@/components/employees/schedule-forms";
import { SyncLogTable, TestSyncForm } from "@/components/afas-forms";

export default async function InstellingenPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const [rules, syncLog, employees] = await Promise.all([
    getBreakRules(supabase, profile.organization_id),
    getSyncLog(supabase),
    getManagerOptions(supabase),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Pauzeregels</CardTitle>
          <CardDescription>
            Bepaalt hoeveel pauzetijd automatisch wordt afgetrokken van gewerkte uren. De regel met de
            hoogste drempel die een dag overschrijdt, wordt toegepast.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BreakRulesManager rules={rules} />
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Integraties — AFAS</CardTitle>
          <CardDescription>
            Voorbereiding voor een toekomstige AFAS-koppeling (Fase 11) — nog geen live verbinding. De
            testsynchronisatie hieronder doorloopt de volledige pijplijn (BSN ontsleutelen, veldmapping,
            logging) maar meldt altijd &ldquo;mislukt&rdquo; zolang er geen AFAS-omgeving is gekoppeld.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <TestSyncForm employees={employees} />
          <SyncLogTable entries={syncLog} />
        </CardContent>
      </Card>
    </div>
  );
}
