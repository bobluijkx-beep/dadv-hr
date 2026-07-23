"use client";

import { useActionState } from "react";
import { softDeleteEmployee, type ActionState } from "@/app/actions/employees";
import { Button } from "@/components/ui/button";

const initialState: ActionState = { error: null };

export function DeleteEmployeeButton({ employeeId, employeeName }: { employeeId: string; employeeName: string }) {
  const [state, formAction, pending] = useActionState(softDeleteEmployee, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`Weet je zeker dat je ${employeeName} wilt verwijderen? Dit dossier verdwijnt overal uit de lijsten.`)) {
          e.preventDefault();
        }
      }}
      className="flex flex-col items-end gap-1"
    >
      <input type="hidden" name="employeeId" value={employeeId} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Bezig…" : "Verwijderen"}
      </Button>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
