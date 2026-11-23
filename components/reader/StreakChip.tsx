"use client";

import Link from "next/link";
import { useStreak } from "@/lib/client/streaks";
import { cn } from "@/lib/utils";

/** Flame and day count in the reader header. Hidden until there is a streak to show. */
export function StreakChip() {
  const { current, todayDone, todayWords, goal } = useStreak();
  if (current === 0 && todayWords === 0) return null;

  const left = Math.max(0, goal - todayWords);
  const label =
    current > 0
      ? `${current}-day reading streak${todayDone ? "" : `, read ${left} more words today to extend it`}`
      : `Read ${left} more words today to start a streak`;

  return (
    <Link
      href="/library"
      title={label}
      aria-label={label}
      className={cn(
        "hairline hover:bg-surface flex h-10 items-center gap-1.5 rounded-full px-3 text-sm tabular-nums transition-colors",
        todayDone ? "text-ember" : "text-faint",
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill={todayDone ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
      <span>{current}</span>
    </Link>
  );
}
