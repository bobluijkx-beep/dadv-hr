"use client";

import { useActionState } from "react";
import {
  startLeaveYear,
  createLeaveRequest,
  updateLeaveRequestStatus,
  type ActionState,
} from "@/app/actions/leave";
import type { LeaveType, LeaveBalance, LeaveRequest } from "@/lib/services/leave";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const initialState: ActionState = { error: null };

const statusLabels: Record<LeaveRequest["status"], string> = {
  aangevraagd: "Aangevraagd",
  goedgekeurd: "Goedgekeurd",
  afgewezen: "Afgewezen",
  ingetrokken: "Ingetrokken",
};

function formatHours(hours: number) {
  return hours.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function LeaveBalanceCards({
  leaveTypes,
  balances,
  year,
}: {
  leaveTypes: LeaveType[];
  balances: LeaveBalance[];
  year: number;
}) {
  const now = new Date();
  const afterJuly1 = now.getUTCFullYear() > year || (now.getUTCFullYear() === year && now.getUTCMonth() >= 6);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {leaveTypes.map((type) => {
        const balance = balances.find((b) => b.leave_type_id === type.id);
        const showStatutorySignal = type.is_statutory && afterJuly1 && (balance?.remaining_hours ?? 0) > 0;
        return (
          <div key={type.id} className="rounded-md border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{type.name}</p>
              {showStatutorySignal && (
                <Badge variant="destructive">Nog resterend na 1 juli</Badge>
              )}
            </div>
            {balance ? (
              <p className="text-xs text-muted-foreground">
                {formatHours(balance.accrued_hours)} opgebouwd · {formatHours(balance.taken_hours)} opgenomen ·{" "}
                <span className="font-medium text-foreground">{formatHours(balance.remaining_hours)} resterend</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Nog geen opbouw voor {year}.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function StartLeaveYearForm({ employeeId, year }: { employeeId: string; year: number }) {
  const [state, formAction, pending] = useActionState(startLeaveYear, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="employeeId" value={employeeId} />
      <input type="hidden" name="year" value={year} />
      <Button type="submit" size="sm" variant="outline" disabled={pending} className="w-fit">
        {pending ? "Bezig…" : `Verlofjaar ${year} starten`}
      </Button>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.message && <p className="text-sm text-muted-foreground">{state.message}</p>}
    </form>
  );
}

function LeaveTypeSelect({ leaveTypes }: { leaveTypes: LeaveType[] }) {
  return (
    <select
      id="leaveTypeId"
      name="leaveTypeId"
      required
      className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {leaveTypes.map((type) => (
        <option key={type.id} value={type.id}>
          {type.name}
        </option>
      ))}
    </select>
  );
}

export function NewLeaveRequestForm({ employeeId, leaveTypes }: { employeeId: string; leaveTypes: LeaveType[] }) {
  const [state, formAction, pending] = useActionState(createLeaveRequest, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="employeeId" value={employeeId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="leaveTypeId">Verloftype</Label>
        <LeaveTypeSelect leaveTypes={leaveTypes} />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="start_date">Periode van</Label>
          <Input id="start_date" name="start_date" type="date" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="end_date">Periode tot</Label>
          <Input id="end_date" name="end_date" type="date" required />
        </div>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Berekenen…" : "Verlof aanvragen"}
      </Button>
    </form>
  );
}

function StatusAction({
  request,
  employeeId,
  status,
  label,
  variant,
}: {
  request: LeaveRequest;
  employeeId: string;
  status: "goedgekeurd" | "afgewezen" | "ingetrokken";
  label: string;
  variant?: "outline";
}) {
  const [state, formAction, pending] = useActionState(updateLeaveRequestStatus, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="id" value={request.id} />
      <input type="hidden" name="employeeId" value={employeeId} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" size="sm" variant={variant} disabled={pending}>
        {pending ? "Bezig…" : label}
      </Button>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}

export function LeaveRequestRow({
  request,
  employeeId,
  leaveTypeName,
  canApprove,
  canManage,
}: {
  request: LeaveRequest;
  employeeId: string;
  leaveTypeName: string;
  canApprove: boolean;
  canManage: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 border-b pb-4 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">
            {leaveTypeName}: {request.start_date} – {request.end_date}
          </p>
          <p className="text-xs text-muted-foreground">{formatHours(request.hours)} uur</p>
        </div>
        <Badge variant={request.status === "goedgekeurd" ? "default" : "secondary"}>
          {statusLabels[request.status]}
        </Badge>
      </div>

      {request.status === "aangevraagd" && (
        <div className="flex flex-wrap gap-2">
          {canApprove && (
            <>
              <StatusAction request={request} employeeId={employeeId} status="goedgekeurd" label="Goedkeuren" />
              <StatusAction
                request={request}
                employeeId={employeeId}
                status="afgewezen"
                label="Afwijzen"
                variant="outline"
              />
            </>
          )}
          {canManage && (
            <StatusAction
              request={request}
              employeeId={employeeId}
              status="ingetrokken"
              label="Intrekken"
              variant="outline"
            />
          )}
        </div>
      )}
    </div>
  );
}
