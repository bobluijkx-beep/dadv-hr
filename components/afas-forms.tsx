"use client";

import { useActionState } from "react";
import { runAfasTestSync, type ActionState } from "@/app/actions/integrations";
import type { SyncLogEntry } from "@/lib/services/integrations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const initialState: ActionState = { error: null };

const statusLabels: Record<SyncLogEntry["status"], string> = {
  success: "Geslaagd",
  failed: "Mislukt",
  pending: "In behandeling",
};

export function SyncLogTable({ entries }: { entries: SyncLogEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Nog geen synchronisaties uitgevoerd.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Moment</TableHead>
          <TableHead>Richting</TableHead>
          <TableHead>Entiteit</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>{new Date(entry.synced_at).toLocaleString("nl-NL")}</TableCell>
            <TableCell>{entry.direction}</TableCell>
            <TableCell>{entry.entity}</TableCell>
            <TableCell>
              <Badge variant={entry.status === "success" ? "default" : "secondary"}>
                {statusLabels[entry.status]}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function TestSyncForm({ employees }: { employees: { id: string; first_name: string; last_name: string }[] }) {
  const [state, formAction, pending] = useActionState(runAfasTestSync, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <select
          name="employeeId"
          required
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.first_name} {e.last_name}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Bezig…" : "Testsynchronisatie uitvoeren"}
        </Button>
      </div>
      {state.message && (
        <p className={`text-sm ${state.success ? "text-emerald-600" : "text-muted-foreground"}`}>{state.message}</p>
      )}
    </form>
  );
}
