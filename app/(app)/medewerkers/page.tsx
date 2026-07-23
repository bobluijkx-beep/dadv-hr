import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listEmployees, getDepartments } from "@/lib/services/employees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DeleteEmployeeButton } from "@/components/employees/delete-employee-button";

type SearchParams = Promise<{ q?: string; department?: string; status?: string }>;

export default async function MedewerkersPage({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole("admin", "hr", "manager");
  const params = await searchParams;

  const supabase = await createClient();
  const [employees, departments] = await Promise.all([
    listEmployees(supabase, {
      search: params.q,
      departmentId: params.department && params.department !== "alle" ? params.department : undefined,
      status: (params.status as "actief" | "inactief" | "alle") ?? "actief",
    }),
    getDepartments(supabase),
  ]);

  const canCreate = profile.role === "admin" || profile.role === "hr";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Medewerkers</h1>
          <p className="text-sm text-muted-foreground">
            {profile.role === "manager"
              ? "Jouw team en jijzelf."
              : "Alle medewerkers binnen de organisatie."}
          </p>
        </div>
        {canCreate && (
          <Button nativeButton={false} render={<Link href="/medewerkers/nieuw">Nieuwe medewerker</Link>} />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zoeken en filteren</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3" method="get">
            <div className="flex flex-col gap-1">
              <label htmlFor="q" className="text-xs text-muted-foreground">
                Naam of personeelsnummer
              </label>
              <Input id="q" name="q" defaultValue={params.q ?? ""} placeholder="Zoeken…" className="w-56" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="department" className="text-xs text-muted-foreground">
                Afdeling
              </label>
              <select
                id="department"
                name="department"
                defaultValue={params.department ?? "alle"}
                className="h-8 w-48 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="alle">Alle afdelingen</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="status" className="text-xs text-muted-foreground">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={params.status ?? "actief"}
                className="h-8 w-40 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="actief">Actief</option>
                <option value="inactief">Inactief</option>
                <option value="alle">Alle</option>
              </select>
            </div>
            <Button type="submit" variant="secondary">
              Filteren
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Personeelsnr.</TableHead>
                <TableHead>Functie</TableHead>
                <TableHead>Afdeling</TableHead>
                <TableHead>Status</TableHead>
                {canCreate && <TableHead className="text-right">Acties</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canCreate ? 6 : 5} className="text-center text-muted-foreground">
                    Geen medewerkers gevonden.
                  </TableCell>
                </TableRow>
              )}
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <Link href={`/medewerkers/${employee.id}`} className="font-medium hover:underline">
                      {employee.first_name} {employee.insertion ? `${employee.insertion} ` : ""}
                      {employee.last_name}
                    </Link>
                  </TableCell>
                  <TableCell>{employee.employee_number}</TableCell>
                  <TableCell>{employee.job_title ?? "—"}</TableCell>
                  <TableCell>{employee.department?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={employee.is_active ? "default" : "secondary"}>
                      {employee.is_active ? "Actief" : "Inactief"}
                    </Badge>
                  </TableCell>
                  {canCreate && (
                    <TableCell className="text-right">
                      {!employee.is_active && (
                        <DeleteEmployeeButton
                          employeeId={employee.id}
                          employeeName={`${employee.first_name} ${employee.last_name}`}
                        />
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
