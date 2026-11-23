import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const PLACEHOLDER = /^(your[-_].*|placeholder.*|changeme.*)$/i;

/** Loads .env.local (Node 20.12+). Missing file is fine. */
export function loadEnv() {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    /* no .env.local */
  }
}

export function envValue(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v && !PLACEHOLDER.test(v) ? v : undefined;
}

/** Service-role client for the pipeline. Exits with a helpful message if keys are missing. */
export function getDb(): SupabaseClient {
  const url = envValue("NEXT_PUBLIC_SUPABASE_URL");
  const key = envValue("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    console.error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local,\n" +
        "or re-run with --dry-run to preview without a database.",
    );
    process.exit(1);
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
