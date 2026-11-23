"use client";

import { useSyncExternalStore } from "react";
import type { AiResult } from "@/lib/ai/types";

export type Quota = { remaining: number; limit: number; demo: boolean; loaded: boolean };

let quota: Quota = { remaining: 0, limit: 0, demo: false, loaded: false };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function setQuota(next: Partial<Quota>) {
  quota = { ...quota, ...next, loaded: true };
  emit();
}

export function useAiQuota(): Quota {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => quota,
    () => quota,
  );
}

export async function refreshQuota() {
  try {
    const res = await fetch("/api/ai/quota", { cache: "no-store" });
    if (!res.ok) return;
    const j = (await res.json()) as { remaining: number; limit: number; demo: boolean };
    setQuota({ remaining: j.remaining, limit: j.limit, demo: j.demo });
  } catch {
    /* offline: leave the meter as is */
  }
}

/** POSTs to an AI endpoint and keeps the shared quota meter in sync. */
export async function postAi<T>(path: string, body: unknown): Promise<AiResult<T>> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as AiResult<T>;
    if (typeof json.remaining === "number")
      setQuota({ remaining: json.remaining, limit: json.limit });
    return json;
  } catch {
    return {
      ok: false,
      code: "unavailable",
      message: "You appear to be offline.",
      remaining: quota.remaining,
      limit: quota.limit,
    };
  }
}
