"use client";

import { STREAK } from "@/config/streaks";
import { useStreak } from "@/lib/client/streaks";
import { buildCalendar, intensity } from "@/lib/reader/streaks";
import { cn } from "@/lib/utils";

const CELL = [
  "bg-surface-2/60",
  "bg-ember/20",
  "bg-ember/45",
  "bg-ember/70",
  "bg-ember",
] as const;

const fmt = new Intl.NumberFormat("en");
const dateLabel = (day: string) =>
  new Date(`${day}T12:00:00`).toLocaleDateString("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <p className="font-display text-4xl tabular-nums sm:text-5xl">{value}</p>
      <p className="text-faint mt-1 text-xs tracking-wide uppercase">{label}</p>
    </div>
  );
}

/** Streak numbers and a calendar of the last few months of reading. */
export function ReadingRhythm() {
  const { activity, today, goal, current, longest, todayDone, todayWords, totalDays } =
    useStreak();
  const weeks = buildCalendar(activity, today, STREAK.calendarWeeks);
  const left = Math.max(0, goal - todayWords);

  const message =
    current === 0
      ? `Read about a page (${goal} words) today to start a streak.`
      : todayDone
        ? "Today is done. Come back tomorrow to keep it going."
        : `Read ${left} more words today to extend your streak.`;

  return (
    <section aria-labelledby="rhythm-title" className="mb-20">
      <h2 id="rhythm-title" className="font-display mb-6 text-3xl">
        Reading rhythm
      </h2>
      <div className="border-line rounded-[2rem] border p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex gap-10 sm:gap-14">
            <Stat value={current} label={current === 1 ? "Day streak" : "Day streak"} />
            <Stat value={longest} label="Longest" />
            <Stat value={totalDays} label="Days read" />
          </div>
          <p className="text-muted max-w-xs text-sm" aria-live="polite">
            {message}
          </p>
        </div>

        <div
          role="img"
          aria-label={`Reading calendar for the last ${STREAK.calendarWeeks} weeks. ${totalDays} days read in total.`}
          className="mt-8 grid max-w-[46rem] gap-1 sm:gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${STREAK.calendarWeeks}, minmax(0, 1fr))`,
          }}
        >
          {weeks.map((week, w) => (
            <div key={w} className="grid gap-1 sm:gap-1.5">
              {week.map((c) => (
                <div
                  key={c.day}
                  title={
                    c.future
                      ? undefined
                      : `${dateLabel(c.day)}: ${fmt.format(c.words)} words`
                  }
                  className={cn(
                    "aspect-square rounded-[3px] sm:rounded-[4px]",
                    c.future ? "opacity-0" : CELL[intensity(c.words, goal)],
                    c.day === today && "ring-ink/60 ring-1",
                  )}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="text-faint mt-4 flex max-w-[46rem] items-center justify-end gap-1.5 text-xs">
          Less
          {CELL.map((c, i) => (
            <span key={i} className={cn("size-3 rounded-[3px]", c)} aria-hidden />
          ))}
          More
        </div>
      </div>
    </section>
  );
}
