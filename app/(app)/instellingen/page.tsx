import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getBreakRules } from "@/lib/services/schedules";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BreakRulesManager } from "@/components/employees/schedule-forms";

export default async function InstellingenPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const rules = await getBreakRules(supabase, profile.organization_id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Instellingen</h1>

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
    </div>
  );
}
