import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

/**
 * Refreshes the Supabase auth session on every request and keeps the
 * request/response cookies in sync. Route-level access control still lives
 * in RLS + the role checks in lib/auth — this only keeps the session alive.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Handles Supabase's PKCE-style email links (invite/recovery/magic link),
  // which redirect back as `?code=...`. Must run before auth.getUser() below
  // and before any redirect a page might issue, since a query string (unlike
  // a URL fragment) is dropped once that redirect happens.
  //
  // This app has no other use of the code-exchange flow (no OAuth, no magic
  // links yet), so any `?code=` is always an invite or password-reset link —
  // send it straight to the "set a password" page unless a `next` override
  // was explicitly supplied.
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
    const redirectUrl = request.nextUrl.clone();
    const next = redirectUrl.searchParams.get("next");
    redirectUrl.search = "";
    redirectUrl.pathname = next || "/account/wachtwoord-instellen";
    return NextResponse.redirect(redirectUrl, { headers: supabaseResponse.headers });
  }

  // Required: triggers a token refresh and must be called before any other
  // Supabase call in the request. Do not remove or reorder.
  await supabase.auth.getUser();

  return supabaseResponse;
}
