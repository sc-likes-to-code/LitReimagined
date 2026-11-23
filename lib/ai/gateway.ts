import "server-only";
import { createHash } from "node:crypto";
import { PROMPT_VERSION, getLimits, getModels, type AiFeature } from "@/config/ai";
import { getProvider } from "./providers";
import { getUsageStore } from "./store";
import type { AiResult, Subject } from "./types";

/* ------------------------------------------------------------------ */
/* Subject helpers                                                     */
/* ------------------------------------------------------------------ */

function subjectKeys(subject: Subject) {
  if (subject.kind === "user")
    return { primary: `user:${subject.id}`, ip: null as string | null };
  return {
    primary: `anon:${subject.id}`,
    ip: subject.ip
      ? `ip:${createHash("sha256").update(subject.ip).digest("hex").slice(0, 24)}`
      : null,
  };
}

function allowance(subject: Subject) {
  const l = getLimits();
  return subject.kind === "user" ? l.user : l.anon;
}

/** Short burst limiter (per process); the daily quota is the real ceiling. */
const bursts = new Map<string, number[]>();
function burstOk(key: string) {
  const { perMinute } = getLimits();
  const now = Date.now();
  const recent = (bursts.get(key) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= perMinute) {
    bursts.set(key, recent);
    return false;
  }
  recent.push(now);
  bursts.set(key, recent);
  if (bursts.size > 5000) bursts.clear();
  return true;
}

export function cacheKey(feature: AiFeature, input: unknown) {
  const norm = JSON.stringify(input);
  return createHash("sha256")
    .update(`${feature}|${getModels().live}|${PROMPT_VERSION[feature]}|${norm}`)
    .digest("hex");
}

/* ------------------------------------------------------------------ */
/* Quota                                                               */
/* ------------------------------------------------------------------ */

export async function peekQuota(subject: Subject) {
  const store = getUsageStore();
  const { primary, ip } = subjectKeys(subject);
  const limit = allowance(subject);
  const l = getLimits();
  const [usedPrimary, usedIp] = await Promise.all([
    store.used(primary),
    ip ? store.used(ip) : Promise.resolve(0),
  ]);
  const remainingPrimary = Math.max(0, limit - usedPrimary);
  const remainingIp = ip ? Math.max(0, limit * l.ipMultiplier - usedIp) : Infinity;
  return {
    limit,
    remaining: Math.min(remainingPrimary, remainingIp),
    demo: getProvider().demo,
  };
}

/* ------------------------------------------------------------------ */
/* Gateway                                                             */
/* ------------------------------------------------------------------ */

type RunArgs<O> = {
  feature: AiFeature;
  subject: Subject;
  /** Everything that determines the answer. Hashed into the cache key. */
  cacheInput: unknown;
  system: string;
  prompt: string;
  json?: boolean;
  parse: (raw: string) => O;
  cost?: number;
};

export async function runAi<O>(args: RunArgs<O>): Promise<AiResult<O>> {
  const { feature, subject, cacheInput, system, prompt, json, parse } = args;
  const cost = args.cost ?? 1;
  const store = getUsageStore();
  const provider = getProvider();
  const keys = subjectKeys(subject);
  const limit = allowance(subject);
  const lim = getLimits();

  const fail = (
    code: Extract<AiResult<O>, { ok: false }>["code"],
    message: string,
    remaining = 0,
  ): AiResult<O> => ({
    ok: false,
    code,
    message,
    remaining,
    limit,
  });

  if (!burstOk(keys.primary))
    return fail("rate", "You are going a little fast. Give the quill a moment.");

  const quota = await peekQuota(subject);

  // 1. Cache first: identical requests are free and never touch the quota.
  const key = cacheKey(feature, cacheInput);
  if (!provider.demo) {
    const hit = await store.getCache(key);
    if (hit !== null && hit !== undefined) {
      return {
        ok: true,
        output: hit as O,
        cached: true,
        demo: false,
        remaining: quota.remaining,
        limit,
      };
    }
  }

  // 2. Personal and site-wide limits.
  if (quota.remaining < cost) {
    return fail("quota", "You have used today's ink. Your allowance refills tomorrow.");
  }
  const globalUsed = await store.globalToday();
  if (globalUsed >= lim.globalCeiling * lim.breakerRatio) {
    return fail(
      "breaker",
      "The quill is resting for the day. Please come back tomorrow.",
      quota.remaining,
    );
  }

  // 3. Call the model.
  try {
    const raw = await provider.generate({ feature, prompt, system, json });
    const output = parse(raw);

    if (!provider.demo) await store.setCache(key, feature, output);
    // Demo replies are free: they never touch a real person's allowance or the site-wide count.
    if (!provider.demo) {
      await Promise.all([
        store.spend(
          keys.primary,
          subject.kind === "user" ? subject.id : null,
          feature,
          cost,
        ),
        keys.ip ? store.spend(keys.ip, null, feature, cost) : Promise.resolve(),
        store.bumpGlobal(feature, cost),
      ]);
    }

    return {
      ok: true,
      output,
      cached: false,
      demo: provider.demo,
      remaining: provider.demo ? quota.remaining : Math.max(0, quota.remaining - cost),
      limit,
    };
  } catch (err) {
    console.error(`[ai] ${feature} failed:`, err instanceof Error ? err.message : err);
    return fail(
      "unavailable",
      "The quill could not answer just now. Please try again in a moment.",
      quota.remaining,
    );
  }
}
