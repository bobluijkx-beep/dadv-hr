"use client";

import { useActionState, useState } from "react";
import {
  createContract,
  updateContract,
  updateCompensation,
  type ActionState,
} from "@/app/actions/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const initialState: ActionState = { error: null };

const contractTypeLabels: Record<string, string> = {
  bepaalde_tijd: "Bepaalde tijd",
  onbepaalde_tijd: "Onbepaalde tijd",
  oproep: "Oproep",
  stage: "Stage",
  overig: "Overig",
};

function FormError({ state }: { state: ActionState }) {
  if (!state.error) return null;
  return <p className="text-sm text-destructive">{state.error}</p>;
}

function SavedHint({ state }: { state: ActionState }) {
  if (!state.success) return null;
  return <p className="text-sm text-emerald-600">Opgeslagen.</p>;
}

function ContractTypeSelect({ id, name, defaultValue }: { id: string; name: string; defaultValue: string }) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue}
      className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {Object.entries(contractTypeLabels).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

export type Contract = {
  id: string;
  contract_number: string;
  start_date: string;
  end_date: string | null;
  contract_type: string;
  hours_per_week: number;
  notes: string | null;
};

export type Compensation = { salary_amount: number; salary_scale: string | null };

// ---------------------------------------------------------------------
// Eén contract: read-only kaart of (voor admin/hr) bewerkbare kaart incl. salaris
// ---------------------------------------------------------------------

export function ContractCard({
  employeeId,
  contract,
  compensation,
  editable,
}: {
  employeeId: string;
  contract: Contract;
  compensation: Compensation | null;
  editable: boolean;
}) {
  const [contractState, contractAction, contractPending] = useActionState(updateContract, initialState);
  const [compState, compAction, compPending] = useActionState(updateCompensation, initialState);
  const today = new Date();
  const isCurrent =
    new Date(contract.start_date) <= today && (!contract.end_date || new Date(contract.end_date) >= today);

  if (!editable) {
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{contract.contract_number}</CardTitle>
          {isCurrent && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">Huidig</span>
          )}
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Type</dt>
            <dd>{contractTypeLabels[contract.contract_type] ?? contract.contract_type}</dd>
            <dt className="text-muted-foreground">Contracturen/week</dt>
            <dd>{contract.hours_per_week}</dd>
            <dt className="text-muted-foreground">Startdatum</dt>
            <dd>{contract.start_date}</dd>
            <dt className="text-muted-foreground">Einddatum</dt>
            <dd>{contract.end_date ?? "—"}</dd>
          </dl>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{contract.contract_number}</CardTitle>
        {isCurrent && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">Huidig</span>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form action={contractAction} className="flex flex-col gap-4">
          <input type="hidden" name="contractId" value={contract.id} />
          <input type="hidden" name="employeeId" value={employeeId} />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`contract_number_${contract.id}`}>Contractnummer</Label>
              <Input
                id={`contract_number_${contract.id}`}
                name="contract_number"
                defaultValue={contract.contract_number}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`contract_type_${contract.id}`}>Type</Label>
              <ContractTypeSelect
                id={`contract_type_${contract.id}`}
                name="contract_type"
                defaultValue={contract.contract_type}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`start_date_${contract.id}`}>Startdatum</Label>
              <Input
                id={`start_date_${contract.id}`}
                name="start_date"
                type="date"
                defaultValue={contract.start_date}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`end_date_${contract.id}`}>Einddatum</Label>
              <Input id={`end_date_${contract.id}`} name="end_date" type="date" defaultValue={contract.end_date ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`hours_per_week_${contract.id}`}>Contracturen per week</Label>
              <Input
                id={`hours_per_week_${contract.id}`}
                name="hours_per_week"
                type="number"
                step="0.5"
                min="0.5"
                defaultValue={contract.hours_per_week}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`notes_${contract.id}`}>Opmerkingen</Label>
              <Input id={`notes_${contract.id}`} name="notes" defaultValue={contract.notes ?? ""} />
            </div>
          </div>
          <FormError state={contractState} />
          <SavedHint state={contractState} />
          <Button type="submit" disabled={contractPending} className="w-fit">
            {contractPending ? "Opslaan…" : "Opslaan"}
          </Button>
        </form>

        <div className="border-t pt-4">
          <p className="mb-2 text-sm font-medium">Salaris</p>
          <form action={compAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="contractId" value={contract.id} />
            <input type="hidden" name="employeeId" value={employeeId} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`salary_amount_${contract.id}`}>Bedrag (€/maand)</Label>
              <Input
                id={`salary_amount_${contract.id}`}
                name="salary_amount"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={compensation?.salary_amount ?? ""}
                className="w-36"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`salary_scale_${contract.id}`}>Salarisschaal</Label>
              <Input
                id={`salary_scale_${contract.id}`}
                name="salary_scale"
                defaultValue={compensation?.salary_scale ?? ""}
                className="w-32"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`reason_${contract.id}`}>Reden wijziging</Label>
              <Input id={`reason_${contract.id}`} name="reason" className="w-48" />
            </div>
            <Button type="submit" size="sm" disabled={compPending}>
              {compPending ? "Opslaan…" : "Salaris opslaan"}
            </Button>
          </form>
          <FormError state={compState} />
          <SavedHint state={compState} />
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------
// Nieuw contract
// ---------------------------------------------------------------------

export function NewContractForm({ employeeId }: { employeeId: string }) {
  const [state, formAction, pending] = useActionState(createContract, initialState);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Nieuw contract
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nieuw contract</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="employeeId" value={employeeId} />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new_contract_number">Contractnummer</Label>
              <Input id="new_contract_number" name="contract_number" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new_contract_type">Type</Label>
              <ContractTypeSelect id="new_contract_type" name="contract_type" defaultValue="bepaalde_tijd" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new_start_date">Startdatum</Label>
              <Input id="new_start_date" name="start_date" type="date" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new_end_date">Einddatum</Label>
              <Input id="new_end_date" name="end_date" type="date" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new_hours_per_week">Contracturen per week</Label>
              <Input id="new_hours_per_week" name="hours_per_week" type="number" step="0.5" min="0.5" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new_notes">Opmerkingen</Label>
              <Input id="new_notes" name="notes" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new_salary_amount">Salaris (€/maand)</Label>
              <Input id="new_salary_amount" name="salary_amount" type="number" step="0.01" min="0.01" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new_salary_scale">Salarisschaal</Label>
              <Input id="new_salary_scale" name="salary_scale" />
            </div>
          </div>
          <FormError state={state} />
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Aanmaken…" : "Contract aanmaken"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------
// Salarishistorie
// ---------------------------------------------------------------------

type SalaryHistoryRow = {
  id: string;
  change_date: string;
  old_salary: number | null;
  new_salary: number;
  absolute_difference: number | null;
  percentage_increase: number | null;
  reason: string | null;
};

export function SalaryHistoryTable({ rows }: { rows: SalaryHistoryRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Nog geen salarishistorie.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Datum</TableHead>
          <TableHead>Oud</TableHead>
          <TableHead>Nieuw</TableHead>
          <TableHead>Verschil</TableHead>
          <TableHead>%</TableHead>
          <TableHead>Reden</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.change_date}</TableCell>
            <TableCell>{row.old_salary ?? "—"}</TableCell>
            <TableCell>{row.new_salary}</TableCell>
            <TableCell>{row.absolute_difference ?? "—"}</TableCell>
            <TableCell>{row.percentage_increase ?? "—"}</TableCell>
            <TableCell>{row.reason ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
