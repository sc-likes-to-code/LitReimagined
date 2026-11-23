import type { AiFeature } from "@/config/ai";

export type Subject =
  { kind: "user"; id: string } | { kind: "anon"; id: string; ip: string | null };

export type AiErrorCode = "quota" | "breaker" | "rate" | "unavailable" | "invalid";

export type AiResult<T> =
  | {
      ok: true;
      output: T;
      cached: boolean;
      demo: boolean;
      remaining: number;
      limit: number;
    }
  | { ok: false; code: AiErrorCode; message: string; remaining: number; limit: number };

export interface AiProvider {
  readonly name: "gemini" | "mock";
  /** True when output is placeholder text rather than a real model reply. */
  readonly demo: boolean;
  generate(req: {
    feature: AiFeature;
    prompt: string;
    system: string;
    json?: boolean;
  }): Promise<string>;
  embed(text: string): Promise<number[] | null>;
}

export type UsageStore = {
  getCache(key: string): Promise<unknown | null>;
  setCache(key: string, feature: AiFeature, output: unknown): Promise<void>;
  /** Units a subject has spent today. */
  used(subjectKey: string): Promise<number>;
  spend(
    subjectKey: string,
    userId: string | null,
    feature: AiFeature,
    units: number,
  ): Promise<void>;
  globalToday(): Promise<number>;
  bumpGlobal(feature: AiFeature, units: number): Promise<void>;
};
