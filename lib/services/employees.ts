import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export type EmployeeListItem = {
  id: string;
  employee_number: string;
  first_name: string;
  insertion: string | null;
  last_name: string;
  job_title: string | null;
  is_active: boolean;
  department: { id: string; name: string } | null;
};

export type EmployeeListFilters = {
  search?: string;
  departmentId?: string;
  status?: "actief" | "inactief" | "alle";
};

/** Row visibility is entirely up to RLS — this just applies the optional UI filters. */
export async function listEmployees(supabase: Client, filters: EmployeeListFilters = {}) {
  let query = supabase
    .from("employees")
    .select(
      "id, employee_number, first_name, insertion, last_name, job_title, is_active, department:departments(id, name)",
    )
    .order("last_name", { ascending: true });

  if (filters.search) {
    const term = filters.search.trim();
    if (term) {
      query = query.or(
        `first_name.ilike.%${term}%,last_name.ilike.%${term}%,employee_number.ilike.%${term}%`,
      );
    }
  }

  if (filters.departmentId) {
    query = query.eq("department_id", filters.departmentId);
  }

  if (!filters.status || filters.status === "actief") {
    query = query.eq("is_active", true);
  } else if (filters.status === "inactief") {
    query = query.eq("is_active", false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as EmployeeListItem[];
}

export async function getDepartments(supabase: Client) {
  const { data, error } = await supabase.from("departments").select("id, name").order("name");
  if (error) throw error;
  return data ?? [];
}

/** Minimal fields, for the "leidinggevende" picker on the create/edit forms. */
export async function getManagerOptions(supabase: Client) {
  const { data, error } = await supabase
    .from("employees")
    .select("id, first_name, last_name")
    .eq("is_active", true)
    .order("last_name");
  if (error) throw error;
  return data ?? [];
}

export async function getEmployeeCore(supabase: Client, id: string) {
  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, employee_number, first_name, insertion, last_name, preferred_name, gender, date_of_birth, iban, job_title, department_id, manager_id, employment_start_date, employment_end_date, is_active, bsn_encrypted, department:departments(id, name)",
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getCurrentAddress(supabase: Client, employeeId: string) {
  const { data, error } = await supabase
    .from("employee_addresses")
    .select("id, street, postal_code, city, valid_from")
    .eq("employee_id", employeeId)
    .is("valid_to", null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAddressHistory(supabase: Client, employeeId: string) {
  const { data, error } = await supabase
    .from("employee_addresses")
    .select("id, street, postal_code, city, valid_from, valid_to")
    .eq("employee_id", employeeId)
    .order("valid_from", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getCurrentContact(supabase: Client, employeeId: string) {
  const { data, error } = await supabase
    .from("employee_contact_details")
    .select("id, phone, email, emergency_contact_name, emergency_contact_phone, valid_from")
    .eq("employee_id", employeeId)
    .is("valid_to", null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getContactHistory(supabase: Client, employeeId: string) {
  const { data, error } = await supabase
    .from("employee_contact_details")
    .select("id, phone, email, emergency_contact_name, emergency_contact_phone, valid_from, valid_to")
    .eq("employee_id", employeeId)
    .order("valid_from", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * Returns null if the row doesn't exist *or* RLS hides it (e.g. a manager
 * querying a table they have no policy on) — both look identical to a
 * PostgREST client, which is exactly the point: RLS is the boundary, not
 * this helper.
 */
export async function getPrivateDetails(supabase: Client, employeeId: string) {
  const { data, error } = await supabase
    .from("employee_private_details")
    .select("employee_id, partner_name, partner_date_of_birth, hobbies, interests, notes")
    .eq("employee_id", employeeId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getChildren(supabase: Client, employeeId: string) {
  const { data, error } = await supabase
    .from("employee_children")
    .select("id, name, date_of_birth")
    .eq("employee_id", employeeId)
    .order("date_of_birth");
  if (error) throw error;
  return data ?? [];
}

/** Only succeeds for admin/hr — decrypt_bsn() itself enforces that (§7.2). */
export async function decryptBsn(supabase: Client, bsnEncrypted: string | null) {
  if (!bsnEncrypted) return null;
  const { data, error } = await supabase.rpc("decrypt_bsn", { bsn_encrypted: bsnEncrypted });
  if (error) throw error;
  return data;
}
