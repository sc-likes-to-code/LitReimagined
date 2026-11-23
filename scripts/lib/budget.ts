import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { envValue } from "./db";

/**
 * Throttle and daily budget for Gemini calls. Free-tier limits change, so both
 * numbers are configurable: GEMINI_BATCH_RPM and GEMINI_BATCH_RPD in .env.local.
 * The daily count is saved to disk, so re-running the next day resumes cleanly.
 */
const file = join(process.cwd(), "scripts", ".cache", "budget.json");
const today = () => new Date().toISOString().slice(0, 10);

export const limits = {
  rpm: Number(envValue("GEMINI_BATCH_RPM") ?? 8),
  rpd: Number(envValue("GEMINI_BATCH_RPD") ?? 200),
};

let lastCall = 0;
type Saved = { day: string; used: number };

async function load(): Promise<Saved> {
  try {
    const j = JSON.parse(await readFile(file, "utf8")) as Saved;
    if (j.day === today()) return j;
  } catch {
    /* first run */
  }
  return { day: today(), used: 0 };
}

export async function remainingToday(): Promise<number> {
  return Math.max(0, limits.rpd - (await load()).used);
}

/** Waits for the per-minute slot and records one call. Returns false when the day's budget is spent. */
export async function takeSlot(): Promise<boolean> {
  const saved = await load();
  if (saved.used >= limits.rpd) return false;
  const gap = 60_000 / limits.rpm;
  const wait = lastCall + gap - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();
  saved.used += 1;
  await mkdir(join(process.cwd(), "scripts", ".cache"), { recursive: true });
  await writeFile(file, JSON.stringify(saved));
  return true;
}
