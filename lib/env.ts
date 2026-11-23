import { z } from "zod";

/**
 * Typed, forgiving environment loader.
 *
 * Empty values and obvious placeholders ("your-...-here", "placeholder", "changeme")
 * are treated as "not configured" so the app runs in demo mode instead of crashing.
 * Paste real keys into .env.local and the feature flags flip automatically.
 */

const PLACEHOLDER = /^(your[-_].*|placeholder.*|changeme.*|xxx+|todo.*)$/i;

function clean(value: string | undefined): string | undefined {
  const v = value?.trim();
  if (!v || PLACEHOLDER.test(v)) return undefined;
  return v;
}

const optionalInt = (value: string | undefined) => {
  const v = clean(value);
  if (!v) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

const siteUrl = (() => {
  const v = clean(process.env.NEXT_PUBLIC_SITE_URL) ?? "http://localhost:3000";
  try {
    return new URL(v).origin;
  } catch {
    return "http://localhost:3000";
  }
})();

const supabaseUrl = (() => {
  const v = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!v) return undefined;
  return z.url().safeParse(v).success ? v : undefined;
})();

// NEXT_PUBLIC_* values must be referenced statically so Next can inline them.
const supabaseAnonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const publicEnv = {
  siteUrl,
  supabaseUrl,
  supabaseAnonKey,
} as const;

/** True when the browser/server clients can talk to Supabase. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** Server-only values. Never import from client components. */
export function getServerEnv() {
  return {
    supabaseServiceRoleKey: clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    geminiApiKey: clean(process.env.GEMINI_API_KEY),
    geminiModelLive: clean(process.env.GEMINI_MODEL_LIVE),
    geminiModelBatch: clean(process.env.GEMINI_MODEL_BATCH),
    geminiModelEmbed: clean(process.env.GEMINI_MODEL_EMBED),
    aiDailyLimitAnon: optionalInt(process.env.AI_DAILY_LIMIT_ANON),
    aiDailyLimitUser: optionalInt(process.env.AI_DAILY_LIMIT_USER),
    aiGlobalDailyCeiling: optionalInt(process.env.AI_GLOBAL_DAILY_CEILING),
    revalidateSecret: clean(process.env.REVALIDATE_SECRET),
  };
}

export function isGeminiConfigured() {
  return Boolean(getServerEnv().geminiApiKey);
}

export function isServiceRoleConfigured() {
  return Boolean(isSupabaseConfigured && getServerEnv().supabaseServiceRoleKey);
}
