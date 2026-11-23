import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";

let client: SupabaseClient | null = null;

/**
 * Cookie-free, anonymous client for reading the public catalogue. Safe to use
 * inside cached (`use cache`) functions because it never touches request data.
 */
export function getPublicClient(): SupabaseClient {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured");
  client ??= createClient(publicEnv.supabaseUrl!, publicEnv.supabaseAnonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
