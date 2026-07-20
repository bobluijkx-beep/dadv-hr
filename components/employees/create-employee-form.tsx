"use client";

import { useActionState } from "react";
import { createEmployee, type ActionState } from "@/app/actions/employees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = { error: null };

export function CreateEmployeeForm({
  organizationId,
  departments,
}: {
  organizationId: string;
  departments: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createEmployee, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="organization_id" value={organizationId} />
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="employee_number">Personeelsnummer</Label>
          <Input id="employee_number" name="employee_number" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="job_title">Functie</Label>
          <Input id="job_title" name="job_title" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="first_name">Voornaam</Label>
          <Input id="first_name" name="first_name" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="last_name">Achternaam</Label>
          <Input id="last_name" name="last_name" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="department_id">Afdeling</Label>
          <select
            id="department_id"
            name="department_id"
            defaultValue=""
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Geen</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="employment_start_date">Datum indiensttreding</Label>
          <Input id="employment_start_date" name="employment_start_date" type="date" />
        </div>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Aanmaken…" : "Medewerker aanmaken"}
      </Button>
    </form>
  );
}
