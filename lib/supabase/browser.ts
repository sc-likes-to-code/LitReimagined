"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";

let client: SupabaseClient | null = null;

/** Browser Supabase client, or null when Supabase is not configured (demo mode). */
export function getBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  client ??= createBrowserClient(publicEnv.supabaseUrl!, publicEnv.supabaseAnonKey!);
  return client;
}
