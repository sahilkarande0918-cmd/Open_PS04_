/**
 * Supabase project URL, reduced to its origin: a value pasted from the dashboard's REST endpoint
 * (`https://<ref>.supabase.co/rest/v1/`) would otherwise send auth calls to PostgREST
 * ("Invalid path specified in request URL"). Literal `process.env.NEXT_PUBLIC_*` reads keep build-time inlining.
 */
export const SUPABASE_URL = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
