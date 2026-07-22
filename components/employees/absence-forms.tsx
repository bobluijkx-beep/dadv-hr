"use client";

import { useActionState } from "react";
import { createAbsenceRecord, updateAbsenceRecord, type ActionState } from "@/app/actions/absence";
import type { AbsenceRecord, AbsenceStatus } from "@/lib/services/absence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: ActionState = { error: null };

const statusLabels: Record<AbsenceRecord["status"], string> = {
  actief: "Actief",
  hersteld: "Hersteld",
  gedeeltelijk_hersteld: "Gedeeltelijk hersteld",
};

function FormError({ state }: { state: ActionState }) {
  if (!state.error) return null;
  return <p className="text-sm text-destructive">{state.error}</p>;
}

function StatusSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select
      id="status"
      name="status"
      defaultValue={defaultValue}
      className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {Object.entries(statusLabels).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------
// Eén melding: read-only kaart, of (admin/hr) bewerkbare kaart
// ---------------------------------------------------------------------

export function AbsenceRecordCard({
  employeeId,
  record,
  editable,
}: {
  employeeId: string;
  record: AbsenceRecord;
  editable: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateAbsenceRecord, initialState);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Ziekmelding {record.first_sick_day}</CardTitle>
        <Badge variant={record.status === "actief" ? "destructive" : "secondary"}>
          {statusLabels[record.status]}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Volledig/gedeeltelijk ziek</dt>
          <dd>{record.is_full_time_absence ? "Volledig" : "Gedeeltelijk"}</dd>
          <dt className="text-muted-foreground">Arbeidsongeschiktheid</dt>
          <dd>{record.incapacity_percentage !== null ? `${record.incapacity_percentage}%` : "—"}</dd>
          {!editable && (
            <>
              <dt className="text-muted-foreground">Hersteldatum</dt>
              <dd>{record.recovery_date ?? "—"}</dd>
            </>
          )}
          {!editable && record.notes && (
            <>
              <dt className="text-muted-foreground">Opmerkingen</dt>
              <dd>{record.notes}</dd>
            </>
          )}
        </dl>

        {editable && (
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={record.id} />
            <input type="hidden" name="employeeId" value={employeeId} />
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="status">Status</Label>
                <StatusSelect defaultValue={record.status} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="recovery_date">Hersteldatum</Label>
                <Input
                  id="recovery_date"
                  name="recovery_date"
                  type="date"
                  defaultValue={record.recovery_date ?? ""}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="incapacity_percentage">Arbeidsongeschiktheid %</Label>
                <Input
                  id="incapacity_percentage"
                  name="incapacity_percentage"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={record.incapacity_percentage ?? ""}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Opmerkingen</Label>
              <Input id="notes" name="notes" defaultValue={record.notes ?? ""} />
            </div>
            <FormError state={state} />
            <Button type="submit" size="sm" disabled={pending} className="w-fit">
              {pending ? "Opslaan…" : "Opslaan"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export function NewAbsenceRecordForm({ employeeId }: { employeeId: string }) {
  const [state, formAction, pending] = useActionState(createAbsenceRecord, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="employeeId" value={employeeId} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="first_sick_day">Eerste ziektedag</Label>
          <Input id="first_sick_day" name="first_sick_day" type="date" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="is_full_time_absence">Volledig/gedeeltelijk</Label>
          <select
            id="is_full_time_absence"
            name="is_full_time_absence"
            defaultValue="true"
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="true">Volledig ziek</option>
            <option value="false">Gedeeltelijk ziek</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="incapacity_percentage">Arbeidsongeschiktheid %</Label>
          <Input id="incapacity_percentage" name="incapacity_percentage" type="number" min={0} max={100} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Opmerkingen</Label>
        <Input id="notes" name="notes" />
      </div>
      <FormError state={state} />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Registreren…" : "Ziekmelding registreren"}
      </Button>
    </form>
  );
}

/** §11.2 (approved): manager-facing view — status/dates only, never percentage/notes. */
export function AbsenceStatusCard({ record }: { record: AbsenceStatus }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Ziekmelding {record.first_sick_day}</CardTitle>
        <Badge variant={record.status === "actief" ? "destructive" : "secondary"}>
          {statusLabels[record.status]}
        </Badge>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Volledig/gedeeltelijk ziek</dt>
          <dd>{record.is_full_time_absence ? "Volledig" : "Gedeeltelijk"}</dd>
          <dt className="text-muted-foreground">Hersteldatum</dt>
          <dd>{record.recovery_date ?? "—"}</dd>
        </dl>
      </CardContent>
    </Card>
  );
}
