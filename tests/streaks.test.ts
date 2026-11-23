import { describe, expect, it } from "vitest";
import {
  addDays,
  buildCalendar,
  computeStreak,
  dayKey,
  intensity,
  weekdayMonFirst,
} from "@/lib/reader/streaks";

const GOAL = 150;

describe("date helpers", () => {
  it("formats local dates", () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("adds days across month, year and leap boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-29", 1)).toBe("2026-03-30");
  });

  it("knows the weekday with Monday first", () => {
    expect(weekdayMonFirst("2026-11-23")).toBe(0); // a Monday
    expect(weekdayMonFirst("2026-11-29")).toBe(6);
  });
});

describe("computeStreak", () => {
  const today = "2026-11-23";

  it("is zero with no reading", () => {
    expect(computeStreak({}, today, GOAL)).toMatchObject({ current: 0, longest: 0 });
  });

  it("counts consecutive days ending today", () => {
    const a = { "2026-11-21": 200, "2026-11-22": 160, [today]: 150 };
    expect(computeStreak(a, today, GOAL)).toMatchObject({
      current: 3,
      longest: 3,
      todayDone: true,
    });
  });

  it("stays alive until the end of today when yesterday counted", () => {
    const a = { "2026-11-21": 300, "2026-11-22": 300 };
    expect(computeStreak(a, today, GOAL)).toMatchObject({ current: 2, todayDone: false });
  });

  it("breaks after a missed day but remembers the longest run", () => {
    const a = {
      "2026-11-10": 200,
      "2026-11-11": 200,
      "2026-11-12": 200,
      "2026-11-13": 200,
      "2026-11-22": 200,
    };
    expect(computeStreak(a, today, GOAL)).toMatchObject({ current: 1, longest: 4 });
    expect(computeStreak({ "2026-11-20": 500 }, today, GOAL).current).toBe(0);
  });

  it("ignores days below the goal", () => {
    expect(computeStreak({ [today]: 149 }, today, GOAL)).toMatchObject({
      current: 0,
      todayDone: false,
      todayWords: 149,
    });
  });

  it("does nothing until the date is known", () => {
    expect(computeStreak({ "2026-11-22": 500 }, "", GOAL).current).toBe(0);
  });
});

describe("calendar", () => {
  it("ends on the week containing today, with future days marked", () => {
    const cal = buildCalendar({ "2026-11-24": 400 }, "2026-11-25", 3);
    expect(cal).toHaveLength(3);
    expect(cal.every((w) => w.length === 7)).toBe(true);
    expect(cal[2][0].day).toBe("2026-11-23");
    expect(cal[2][2]).toMatchObject({ day: "2026-11-25", future: false });
    expect(cal[2][3].future).toBe(true);
    expect(cal[2][1].words).toBe(400);
    expect(cal[0][0].day).toBe("2026-11-09");
  });

  it("maps words to intensity bands", () => {
    expect([0, 10, 150, 450, 900].map((w) => intensity(w, GOAL))).toEqual([0, 1, 2, 3, 4]);
  });
});
