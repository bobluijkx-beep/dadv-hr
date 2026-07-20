"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Fallback for Supabase's older implicit-flow email links, which redirect
 * back with the session in the URL fragment (`#access_token=...&type=...`)
 * instead of a `?code=` query param. A fragment never reaches the server —
 * lib/supabase/middleware.ts handles the `?code=` case — so this has to run
 * client-side. Mounted once in the root layout.
 */
export function AuthHashHandler() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token")) return;

    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");
    if (!accessToken || !refreshToken) return;

    createClient()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(() => {
        const destination = type === "invite" || type === "recovery" ? "/account/wachtwoord-instellen" : "/";
        window.location.href = destination;
      });
  }, []);

  return null;
}
