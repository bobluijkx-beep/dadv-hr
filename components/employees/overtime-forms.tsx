"use client";

import { useActionState } from "react";
import { createOvertimeEntry, updateOvertimeStatus, type ActionState } from "@/app/actions/overtime";
import type { OvertimeEntry } from "@/lib/services/overtime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const initialState: ActionState = { error: null };

function PayoutPercentageSelect() {
  return (
    <select
      name="payout_percentage"
      defaultValue="100"
      className="h-9 w-24 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <option value="100">100%</option>
      <option value="125">125%</option>
      <option value="150">150%</option>
      <option value="200">200%</option>
    </select>
  );
}

const statusLabels: Record<OvertimeEntry["status"], string> = {
  geregistreerd: "Geregistreerd",
  goedgekeurd: "Goedgekeurd",
  aangeboden_salarisadministratie: "Aangeboden aan salarisadministratie",
  verwerkt: "Verwerkt",
  uitbetaald: "Uitbetaald",
  tijd_voor_tijd: "Tijd-voor-tijd",
};

function formatHours(hours: number) {
  return hours.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function OvertimeSummary({
  summary,
}: {
  summary: { currentMonthHours: number; currentYearHours: number; totalBalance: number };
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="rounded-md border p-3">
        <p className="text-xs text-muted-foreground">Huidige maand</p>
        <p className="text-lg font-semibold">{formatHours(summary.currentMonthHours)} uur</p>
      </div>
      <div className="rounded-md border p-3">
        <p className="text-xs text-muted-foreground">Lopend jaar</p>
        <p className="text-lg font-semibold">{formatHours(summary.currentYearHours)} uur</p>
      </div>
      <div className="rounded-md border p-3">
        <p className="text-xs text-muted-foreground">Openstaand saldo</p>
        <p className="text-lg font-semibold">{formatHours(summary.totalBalance)} uur</p>
      </div>
    </div>
  );
}

export function NewOvertimeEntryForm({ employeeId }: { employeeId: string }) {
  const [state, formAction, pending] = useActionState(createOvertimeEntry, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="employeeId" value={employeeId} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="period_start">Periode van</Label>
          <Input id="period_start" name="period_start" type="date" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="period_end">Periode tot</Label>
          <Input id="period_end" name="period_end" type="date" required />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Toelichting</Label>
        <Input id="notes" name="notes" />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Berekenen…" : "Automatisch berekenen en registreren"}
      </Button>
    </form>
  );
}

function ApprovalAction({ entry, employeeId }: { entry: OvertimeEntry; employeeId: string }) {
  const [state, formAction, pending] = useActionState(updateOvertimeStatus, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="id" value={entry.id} />
      <input type="hidden" name="employeeId" value={employeeId} />
      <input type="hidden" name="status" value="goedgekeurd" />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Bezig…" : "Goedkeuren"}
      </Button>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}

function PayrollAction({ entry, employeeId }: { entry: OvertimeEntry; employeeId: string }) {
  const [offerState, offerAction, offerPending] = useActionState(updateOvertimeStatus, initialState);
  const [ttoState, ttoAction, ttoPending] = useActionState(updateOvertimeStatus, initialState);

  return (
    <div className="flex flex-col gap-2">
      <form action={offerAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="id" value={entry.id} />
        <input type="hidden" name="employeeId" value={employeeId} />
        <input type="hidden" name="status" value="aangeboden_salarisadministratie" />
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Percentage</Label>
          <PayoutPercentageSelect />
        </div>
        <Button type="submit" size="sm" disabled={offerPending}>
          {offerPending ? "Bezig…" : "Aanbieden aan salarisadministratie"}
        </Button>
      </form>
      <form action={ttoAction}>
        <input type="hidden" name="id" value={entry.id} />
        <input type="hidden" name="employeeId" value={employeeId} />
        <input type="hidden" name="status" value="tijd_voor_tijd" />
        <Button type="submit" size="sm" variant="outline" disabled={ttoPending}>
          Tijd-voor-tijd
        </Button>
      </form>
      {(offerState.error || ttoState.error) && (
        <p className="text-sm text-destructive">{offerState.error || ttoState.error}</p>
      )}
    </div>
  );
}

function AdvanceStatusAction({
  entry,
  employeeId,
  targetStatus,
  label,
}: {
  entry: OvertimeEntry;
  employeeId: string;
  targetStatus: OvertimeEntry["status"];
  label: string;
}) {
  const [state, formAction, pending] = useActionState(updateOvertimeStatus, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="id" value={entry.id} />
      <input type="hidden" name="employeeId" value={employeeId} />
      <input type="hidden" name="status" value={targetStatus} />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Bezig…" : label}
      </Button>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}

export function OvertimeEntryRow({
  entry,
  employeeId,
  canApprove,
  canProcessPayroll,
}: {
  entry: OvertimeEntry;
  employeeId: string;
  canApprove: boolean;
  canProcessPayroll: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 border-b pb-4 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">
            {entry.period_start} – {entry.period_end}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatHours(entry.worked_hours)} gewerkt · {formatHours(entry.contract_hours)} contract ·{" "}
            <span className={entry.overtime_hours >= 0 ? "text-foreground" : "text-destructive"}>
              {formatHours(entry.overtime_hours)} over-/onderuren
            </span>
            {entry.payout_percentage && ` · ${entry.payout_percentage}%`}
          </p>
          {entry.notes && <p className="text-xs text-muted-foreground">{entry.notes}</p>}
        </div>
        <Badge variant={entry.status === "uitbetaald" ? "default" : "secondary"}>
          {statusLabels[entry.status]}
        </Badge>
      </div>

      {canApprove && entry.status === "geregistreerd" && <ApprovalAction entry={entry} employeeId={employeeId} />}
      {canProcessPayroll && entry.status === "goedgekeurd" && (
        <PayrollAction entry={entry} employeeId={employeeId} />
      )}
      {canProcessPayroll && entry.status === "aangeboden_salarisadministratie" && (
        <AdvanceStatusAction entry={entry} employeeId={employeeId} targetStatus="verwerkt" label="Markeer verwerkt" />
      )}
      {canProcessPayroll && entry.status === "verwerkt" && (
        <AdvanceStatusAction entry={entry} employeeId={employeeId} targetStatus="uitbetaald" label="Markeer uitbetaald" />
      )}
    </div>
  );
}
