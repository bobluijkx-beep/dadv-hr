"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { syncEmployeeToAfas } from "@/lib/integrations/afas/sync-service";

export type ActionState = { error: string | null; success?: boolean; message?: string };

const runTestSyncSchema = z.object({ employeeId: z.guid() });

/**
 * §Module 10: exercises the full mapper/client/log pipeline against a real
 * employee. Always reports failure in practice — AfasClient has no live
 * environment to call yet — but every step around that stub (BSN decrypt,
 * mapping, sync-log write) is real and this proves it's wired correctly.
 */
export async function runAfasTestSync(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = runTestSyncSchema.safeParse({ employeeId: formData.get("employeeId") });
  if (!parsed.success) return { error: "Ongeldige invoer." };

  const supabase = await createClient();
  const result = await syncEmployeeToAfas(supabase, parsed.data.employeeId);

  revalidatePath("/instellingen");
  return { error: result.ok ? null : result.message, success: result.ok, message: result.message };
}
