/**
 * Placeholder for generated Supabase types.
 *
 * Once the project is linked to a real Supabase project, regenerate this file with:
 *
 *   npx supabase gen types typescript --project-id <project-ref> --schema public > lib/supabase/database.types.ts
 *
 * Until then, `Database` is left unconstrained so the app builds without a live project.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
