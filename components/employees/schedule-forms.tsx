"use client";

import { useActionState } from "react";
import {
  createSchedulePeriod,
  createBreakRule,
  updateBreakRule,
  deleteBreakRule,
  type ActionState,
} from "@/app/actions/schedules";
import type { ScheduleDay, BreakRule } from "@/lib/services/schedules";
import { computeWeeklyHours } from "@/lib/services/schedules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const WEEKDAY_LABELS = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];

const initialState: ActionState = { error: null };

function formatHours(hours: number) {
  return hours.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CurrentScheduleCard({
  days,
  breakRules,
  contractHoursPerWeek,
}: {
  days: ScheduleDay[];
  breakRules: BreakRule[];
  contractHoursPerWeek: number | null;
}) {
  if (days.length === 0) {
    return <p className="text-sm text-muted-foreground">Nog geen rooster vastgelegd.</p>;
  }

  const { perDay, rawTotal, netTotal } = computeWeeklyHours(days, breakRules);

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dag</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>Eind</TableHead>
            <TableHead>Bruto uren</TableHead>
            <TableHead>Pauzeaftrek</TableHead>
            <TableHead>Netto uren</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {perDay.map((d) => (
            <TableRow key={d.id}>
              <TableCell>{WEEKDAY_LABELS[d.weekday]}</TableCell>
              <TableCell>{d.start_time.slice(0, 5)}</TableCell>
              <TableCell>{d.end_time.slice(0, 5)}</TableCell>
              <TableCell>{formatHours(d.computed_hours)}</TableCell>
              <TableCell>{d.deductionHours > 0 ? `-${formatHours(d.deductionHours)}` : "—"}</TableCell>
              <TableCell>{formatHours(d.netHours)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-sm">
        Totaal: <span className="font-medium">{formatHours(netTotal)} uur/week</span> netto
        {" "}(<span className="text-muted-foreground">{formatHours(rawTotal)} uur bruto</span>)
        {contractHoursPerWeek != null && (
          <span className="text-muted-foreground"> · contract: {formatHours(contractHoursPerWeek)} uur/week</span>
        )}
      </p>
    </div>
  );
}

export function NewSchedulePeriodForm({ employeeId }: { employeeId: string }) {
  const [state, formAction, pending] = useActionState(createSchedulePeriod, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="employeeId" value={employeeId} />
      <div className="flex flex-col gap-2 max-w-xs">
        <Label htmlFor="start_date">Ingangsdatum nieuw rooster</Label>
        <Input id="start_date" name="start_date" type="date" required />
      </div>

      <div className="flex flex-col gap-2">
        {WEEKDAY_LABELS.map((label, weekday) => (
          <div key={weekday} className="grid grid-cols-[8rem_1fr_1fr] items-center gap-3">
            <Label className="text-sm">{label}</Label>
            <Input name={`day_${weekday}_start`} type="time" />
            <Input name={`day_${weekday}_end`} type="time" />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Laat start en eind leeg voor een dag zonder werk.</p>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Opslaan…" : "Nieuw rooster vastleggen"}
      </Button>
    </form>
  );
}

function BreakRuleRow({ rule }: { rule: BreakRule }) {
  const [updateState, updateAction, updatePending] = useActionState(updateBreakRule, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteBreakRule, initialState);

  return (
    <div className="flex flex-col gap-1 border-b pb-3 last:border-b-0">
      <div className="flex flex-wrap items-end gap-3">
        <form action={updateAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={rule.id} />
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Vanaf (uren)</Label>
            <Input name="min_hours" type="number" step="0.25" min="0.01" defaultValue={rule.min_hours} className="w-24" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Aftrek (minuten)</Label>
            <Input name="deduction_minutes" type="number" min="0" defaultValue={rule.deduction_minutes} className="w-24" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Volgorde</Label>
            <Input name="sort_order" type="number" defaultValue={rule.sort_order} className="w-20" />
          </div>
          <Button type="submit" size="sm" disabled={updatePending}>
            {updatePending ? "Opslaan…" : "Opslaan"}
          </Button>
        </form>
        <form action={deleteAction}>
          <input type="hidden" name="id" value={rule.id} />
          <Button type="submit" size="sm" variant="outline" disabled={deletePending}>
            Verwijderen
          </Button>
        </form>
      </div>
      {(updateState.error || deleteState.error) && (
        <p className="text-sm text-destructive">{updateState.error || deleteState.error}</p>
      )}
    </div>
  );
}

export function BreakRulesManager({ rules }: { rules: BreakRule[] }) {
  const [state, formAction, pending] = useActionState(createBreakRule, initialState);

  return (
    <div className="flex flex-col gap-4">
      {rules.length === 0 && <p className="text-sm text-muted-foreground">Nog geen pauzeregels ingesteld.</p>}
      <div className="flex flex-col gap-3">
        {rules.map((rule) => (
          <BreakRuleRow key={rule.id} rule={rule} />
        ))}
      </div>

      <form action={formAction} className="flex flex-wrap items-end gap-3 border-t pt-4">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Vanaf (uren)</Label>
          <Input name="min_hours" type="number" step="0.25" min="0.01" required className="w-24" />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Aftrek (minuten)</Label>
          <Input name="deduction_minutes" type="number" min="0" required className="w-24" />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Volgorde</Label>
          <Input name="sort_order" type="number" defaultValue={0} className="w-20" />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Toevoegen…" : "Regel toevoegen"}
        </Button>
      </form>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </div>
  );
}

export function ScheduleHistoryList({
  periods,
}: {
  periods: { id: string; start_date: string; end_date: string | null }[];
}) {
  if (periods.length <= 1) return null;

  return (
    <details className="text-xs text-muted-foreground">
      <summary className="cursor-pointer">Roosterhistorie ({periods.length})</summary>
      <ul className="mt-2 flex flex-col gap-1">
        {periods.map((p) => (
          <li key={p.id}>
            {p.start_date} – {p.end_date ?? "heden"}
          </li>
        ))}
      </ul>
    </details>
  );
}
