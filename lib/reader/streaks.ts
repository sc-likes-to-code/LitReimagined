/**
 * Pure streak maths. Days are local calendar dates as "YYYY-MM-DD" strings, and all
 * arithmetic goes through UTC so daylight-saving changes can never skip or repeat a day.
 */

export type Activity = Record<string, number>;

export type StreakSummary = {
  current: number;
  longest: number;
  /** Words read today. */
  todayWords: number;
  /** Today already counts toward the streak. */
  todayDone: boolean;
  /** Total days that met the daily goal. */
  totalDays: number;
};

const DAY_MS = 86_400_000;

const toUtc = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(key: string, n: number): string {
  const t = new Date(toUtc(key) + n * DAY_MS);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayMonFirst(key: string): number {
  return (new Date(toUtc(key)).getUTCDay() + 6) % 7;
}

export function computeStreak(
  activity: Activity,
  today: string,
  goal: number,
): StreakSummary {
  const done = (k: string) => (activity[k] ?? 0) >= goal;
  const todayDone = today !== "" && done(today);

  // The streak is still alive if yesterday counted, even before today's reading.
  let current = 0;
  if (today !== "") {
    let cursor = todayDone ? today : addDays(today, -1);
    while (done(cursor)) {
      current++;
      cursor = addDays(cursor, -1);
    }
  }

  const days = Object.keys(activity)
    .filter(done)
    .sort((a, b) => toUtc(a) - toUtc(b));
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }

  return {
    current,
    longest: Math.max(longest, current),
    todayWords: today === "" ? 0 : (activity[today] ?? 0),
    todayDone,
    totalDays: days.length,
  };
}

export type CalendarCell = { day: string; words: number; future: boolean };

/**
 * Builds a calendar of `weeks` columns (Monday at the top), ending with the week that
 * contains today. Cells after today are marked as future.
 */
export function buildCalendar(
  activity: Activity,
  today: string,
  weeks: number,
): CalendarCell[][] {
  if (today === "") return [];
  const lastMonday = addDays(today, -weekdayMonFirst(today));
  const firstMonday = addDays(lastMonday, -(weeks - 1) * 7);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = addDays(firstMonday, w * 7 + d);
      return { day, words: activity[day] ?? 0, future: toUtc(day) > toUtc(today) };
    }),
  );
}

/** 0 = nothing, 1 = some reading, 2-4 = goal met with growing intensity. */
export function intensity(words: number, goal: number): 0 | 1 | 2 | 3 | 4 {
  if (words <= 0) return 0;
  if (words < goal) return 1;
  if (words < goal * 3) return 2;
  if (words < goal * 6) return 3;
  return 4;
}
