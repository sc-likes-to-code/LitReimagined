import { getServerEnv } from "@/lib/env";

/**
 * Live AI configuration. Everything here can be tuned without touching code:
 * model names and limits come from env vars (see .env.example). Free-tier quotas
 * change over time, so check Google AI Studio for your current numbers.
 */
export type AiFeature = "rewrite" | "explain" | "recommend";

export const PROMPT_VERSION: Record<AiFeature, string> = {
  rewrite: "v1",
  explain: "v1",
  recommend: "v1",
};

export const REWRITE_STYLES = {
  plain: { label: "Plain English", hint: "Clear and simple" },
  genz: { label: "Gen-Z", hint: "Casual, internet-fluent" },
  poetic: { label: "Poetic", hint: "Lyrical and vivid" },
  corporate: { label: "Corporate", hint: "Straight from a memo" },
  eli12: { label: "Explain like I'm 12", hint: "Short words, big ideas" },
} as const;
export type RewriteStyle = keyof typeof REWRITE_STYLES;

export const MAX_PASSAGE_CHARS = 1200;
export const MAX_QUERY_CHARS = 200;

export function getModels() {
  const env = getServerEnv();
  return {
    live: env.geminiModelLive ?? "gemini-flash-lite-latest",
    batch: env.geminiModelBatch ?? "gemini-flash-latest",
    embed: env.geminiModelEmbed ?? "gemini-embedding-001",
    embedDimensions: 768,
  };
}

export function getLimits() {
  const env = getServerEnv();
  const ceiling = env.aiGlobalDailyCeiling ?? 400;
  return {
    anon: env.aiDailyLimitAnon ?? 3,
    user: env.aiDailyLimitUser ?? 15,
    /** One network address may spend this many times the per-visitor allowance. */
    ipMultiplier: 3,
    globalCeiling: ceiling,
    /** Live calls stop once this fraction of the ceiling is used. */
    breakerRatio: 0.85,
    /** Max requests per subject per minute, cached or not. */
    perMinute: 8,
  };
}
