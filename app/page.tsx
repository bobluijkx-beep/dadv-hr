import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  return (
    <div className="flex min-h-screen flex-col items-center bg-muted/30 px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welkom, {displayName}</CardTitle>
          <CardDescription>{employee?.job_title ?? "Geen functie geregistreerd"}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rol:</span>
            <Badge variant="secondary">{roleLabels[profile.role] ?? profile.role}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Fase 1 (architectuur, database, Auth) is actief. De HR-modules (dossiers, contracten,
            verlof, overuren, verzuim, dashboards) volgen in de eerstvolgende fases.
          </p>
          <form action={logout}>
            <Button type="submit" variant="outline" className="w-full">
              Uitloggen
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
