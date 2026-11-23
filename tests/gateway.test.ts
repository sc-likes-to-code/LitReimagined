import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AiProvider, Subject } from "@/lib/ai/types";

const generate = vi.fn<AiProvider["generate"]>();
let demo = false;

vi.mock("@/lib/ai/providers", () => ({
  getProvider: (): AiProvider => ({
    name: demo ? "mock" : "gemini",
    demo,
    generate,
    embed: async () => null,
  }),
}));

async function load() {
  vi.resetModules();
  return import("@/lib/ai/gateway");
}

const anon = (id: string): Subject => ({ kind: "anon", id, ip: null });
const base = { feature: "rewrite" as const, system: "s", prompt: "p", parse: (r: string) => r };

describe("ai gateway", () => {
  beforeEach(() => {
    generate.mockReset();
    generate.mockResolvedValue("modern text");
    demo = false;
    delete process.env.AI_DAILY_LIMIT_ANON;
    delete process.env.AI_GLOBAL_DAILY_CEILING;
  });

  it("serves identical requests from cache without spending quota", async () => {
    const { runAi } = await load();
    const subject = anon("a1");
    const args = { ...base, subject, cacheInput: { t: "hello" } };

    const first = await runAi(args);
    const second = await runAi(args);

    expect(first).toMatchObject({ ok: true, cached: false, remaining: 2 });
    expect(second).toMatchObject({ ok: true, cached: true, remaining: 2 });
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("enforces the per-visitor daily allowance", async () => {
    process.env.AI_DAILY_LIMIT_ANON = "2";
    const { runAi } = await load();
    const subject = anon("a2");

    await runAi({ ...base, subject, cacheInput: 1 });
    await runAi({ ...base, subject, cacheInput: 2 });
    const third = await runAi({ ...base, subject, cacheInput: 3 });

    expect(third).toMatchObject({ ok: false, code: "quota", remaining: 0 });
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("trips the site-wide breaker near the ceiling", async () => {
    process.env.AI_GLOBAL_DAILY_CEILING = "2";
    process.env.AI_DAILY_LIMIT_ANON = "50";
    const { runAi } = await load();

    await runAi({ ...base, subject: anon("b1"), cacheInput: "x" });
    await runAi({ ...base, subject: anon("b2"), cacheInput: "y" });
    const blocked = await runAi({ ...base, subject: anon("b3"), cacheInput: "z" });

    expect(blocked).toMatchObject({ ok: false, code: "breaker" });
  });

  it("never caches demo-provider output", async () => {
    demo = true;
    const { runAi } = await load();
    const subject = anon("a4");
    const args = { ...base, subject, cacheInput: "same" };

    await runAi(args);
    const again = await runAi(args);

    expect(again).toMatchObject({ ok: true, cached: false, demo: true });
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("returns a friendly error when the provider fails", async () => {
    generate.mockRejectedValue(new Error("429 Too Many Requests"));
    const { runAi } = await load();
    const res = await runAi({ ...base, subject: anon("a5"), cacheInput: "boom" });

    expect(res).toMatchObject({ ok: false, code: "unavailable" });
    // A failed call must not consume the visitor's allowance.
    const quota = await (await load()).peekQuota(anon("a5"));
    expect(quota.remaining).toBe(3);
  });

  it("builds stable cache keys", async () => {
    const { cacheKey } = await load();
    expect(cacheKey("rewrite", { a: 1 })).toBe(cacheKey("rewrite", { a: 1 }));
    expect(cacheKey("rewrite", { a: 1 })).not.toBe(cacheKey("explain", { a: 1 }));
  });
});
