import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Service-role Supabase client. Bypasses RLS entirely.
 *
 * Only for Edge Functions and narrowly-scoped, explicitly-audited server
 * code (e.g. creating a profiles row for a new auth user). Never import this
 * from a Server Action that handles ordinary user-driven CRUD — those must
 * go through the RLS-scoped client in lib/supabase/server.ts.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
