import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  const canSeeEmployees = profile.role === "admin" || profile.role === "hr" || profile.role === "manager";

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
            {canSeeEmployees && (
              <Button size="sm" nativeButton={false} render={<Link href="/medewerkers">Naar medewerkers</Link>} />
            )}
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/mijn-gegevens">Mijn gegevens</Link>} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
