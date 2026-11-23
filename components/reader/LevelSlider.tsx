"use client";

import { useId } from "react";
import { LEVEL_LABELS, type Level } from "@/lib/data/types";
import { cn } from "@/lib/utils";

type Props = {
  value: Level;
  onChange: (level: Level) => void;
  /** Levels that exist for this chapter. 0 (original) is always available. */
  available?: Level[];
  className?: string;
  compact?: boolean;
};

const LEVELS: Level[] = [0, 1, 2, 3];

/** The signature control: slide from the author's original to a contemporary voice. */
export function LevelSlider({
  value,
  onChange,
  available = LEVELS,
  className,
  compact,
}: Props) {
  const id = useId();
  const ok = (l: Level) => l === 0 || available.includes(l);

  function set(next: number) {
    const l = Math.max(0, Math.min(3, Math.round(next))) as Level;
    if (ok(l)) onChange(l);
  }

  return (
    <div className={cn("w-full", className)}>
      <label htmlFor={id} className="sr-only">
        Modernization level
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={3}
        step={1}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        aria-valuetext={LEVEL_LABELS[value]}
        className="level-range"
        style={{ "--p": String((value / 3) * 100) } as React.CSSProperties}
      />
      <div
        className={cn("mt-1 grid grid-cols-4", compact ? "text-[0.65rem]" : "text-xs")}
      >
        {LEVELS.map((l, i) => (
          <button
            key={l}
            type="button"
            disabled={!ok(l)}
            onClick={() => set(l)}
            className={cn(
              "py-1 tracking-wide transition-colors disabled:opacity-30",
              i === 0 ? "text-left" : i === 3 ? "text-right" : "text-center",
              value === l ? "text-ink font-medium" : "text-faint hover:text-muted",
            )}
          >
            {LEVEL_LABELS[l]}
          </button>
        ))}
      </div>
    </div>
  );
}
