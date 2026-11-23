import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv, isServiceRoleConfigured, publicEnv } from "@/lib/env";

let client: SupabaseClient | null = null;

/** Service-role client. Server only; bypasses RLS. Used for AI quota and cache tables. */
export function getAdminClient(): SupabaseClient | null {
  if (!isServiceRoleConfigured()) return null;
  client ??= createClient(
    publicEnv.supabaseUrl!,
    getServerEnv().supabaseServiceRoleKey!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  return client;
}
