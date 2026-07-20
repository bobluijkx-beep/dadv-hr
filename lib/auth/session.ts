import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "hr" | "manager" | "employee";

export type Profile = {
  id: string;
  organization_id: string;
  employee_id: string | null;
  role: UserRole;
  is_active: boolean;
};

/**
 * Server-side session + profile lookup. This mirrors the RLS helper
 * functions (auth_role/auth_employee_id/auth_organization_id) so UI code
 * can gate what it *renders* — the actual data access boundary is always
 * RLS, this is only ever a UX convenience, never the security control.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id, employee_id, role, is_active")
    .eq("id", user.id)
    .single();

  return (profile as Profile | null) ?? null;
}

/** Redirects to /login when there is no signed-in, active profile. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active) {
    redirect("/login");
  }
  return profile;
}

/** Redirects to / when the signed-in profile doesn't have one of the given roles. */
export async function requireRole(...roles: UserRole[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!roles.includes(profile.role)) {
    redirect("/");
  }
  return profile;
}
