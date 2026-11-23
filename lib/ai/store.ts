import "server-only";
import type { AiFeature } from "@/config/ai";
import { getAdminClient } from "@/lib/supabase/admin";
import type { UsageStore } from "./types";

const day = () => new Date().toISOString().slice(0, 10);

/** In-process store used in demo mode. Resets on restart, which is fine for development. */
class MemoryStore implements UsageStore {
  private cache = new Map<string, unknown>();
  private usage = new Map<string, number>();
  private global = new Map<string, number>();

  async getCache(key: string) {
    return this.cache.get(key) ?? null;
  }
  async setCache(key: string, _feature: AiFeature, output: unknown) {
    if (this.cache.size > 500) this.cache.delete(this.cache.keys().next().value!);
    this.cache.set(key, output);
  }
  async used(subjectKey: string) {
    return this.usage.get(`${day()}:${subjectKey}`) ?? 0;
  }
  async spend(
    subjectKey: string,
    _userId: string | null,
    _feature: AiFeature,
    units: number,
  ) {
    const k = `${day()}:${subjectKey}`;
    this.usage.set(k, (this.usage.get(k) ?? 0) + units);
  }
  async globalToday() {
    return this.global.get(day()) ?? 0;
  }
  async bumpGlobal(_feature: AiFeature, units: number) {
    this.global.set(day(), (this.global.get(day()) ?? 0) + units);
  }
}

/** Supabase-backed store (service role). Survives restarts and works across serverless instances. */
class SupabaseStore implements UsageStore {
  constructor(private sb: NonNullable<ReturnType<typeof getAdminClient>>) {}

  async getCache(key: string) {
    const { data } = await this.sb
      .from("ai_cache")
      .select("output,hits")
      .eq("key", key)
      .maybeSingle();
    if (!data) return null;
    // Fire and forget: hit counting is informational.
    void this.sb
      .from("ai_cache")
      .update({ hits: (data.hits ?? 0) + 1 })
      .eq("key", key);
    return data.output;
  }
  async setCache(key: string, feature: AiFeature, output: unknown) {
    await this.sb
      .from("ai_cache")
      .upsert({ key, feature, output }, { onConflict: "key" });
  }
  async used(subjectKey: string) {
    const isUser = subjectKey.startsWith("user:");
    const col = isUser ? "user_id" : "anon_id";
    const value = isUser ? subjectKey.slice(5) : subjectKey;
    const { data } = await this.sb
      .from("ai_usage")
      .select("cost_units")
      .eq(col, value)
      .eq("day", day());
    return (data ?? []).reduce((n, r) => n + (r.cost_units as number), 0);
  }
  async spend(
    subjectKey: string,
    userId: string | null,
    feature: AiFeature,
    units: number,
  ) {
    await this.sb.from("ai_usage").insert({
      user_id: userId,
      anon_id: userId ? null : subjectKey,
      feature,
      day: day(),
      cost_units: units,
    });
  }
  async globalToday() {
    const { data } = await this.sb
      .from("ai_global_usage")
      .select("count")
      .eq("day", day());
    return (data ?? []).reduce((n, r) => n + (r.count as number), 0);
  }
  async bumpGlobal(feature: AiFeature, units: number) {
    await this.sb.rpc("bump_ai_global_usage", { p_feature: feature, p_amount: units });
  }
}

let memory: MemoryStore | null = null;

export function getUsageStore(): UsageStore {
  const admin = getAdminClient();
  if (admin) return new SupabaseStore(admin);
  memory ??= new MemoryStore();
  return memory;
}
