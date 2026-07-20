import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getDepartments } from "@/lib/services/employees";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateEmployeeForm } from "@/components/employees/create-employee-form";

export default async function NieuweMedewerkerPage() {
  const profile = await requireRole("admin", "hr");
  const supabase = await createClient();
  const departments = await getDepartments(supabase);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Nieuwe medewerker</h1>
        <p className="text-sm text-muted-foreground">
          Maakt alleen het personeelsdossier aan. Een inlogaccount koppel je apart via een uitnodiging.
        </p>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Basisgegevens</CardTitle>
          <CardDescription>Overige gegevens (adres, contract, privé) vul je aan op het dossier zelf.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateEmployeeForm organizationId={profile.organization_id} departments={departments} />
        </CardContent>
      </Card>
    </div>
  );
}
