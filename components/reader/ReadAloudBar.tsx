"use client";

import { SPEECH_RATES, type SpeechStatus } from "@/lib/client/read-aloud";

type Props = {
  status: SpeechStatus;
  /** Zero-based paragraph being read, or null. */
  current: number | null;
  total: number;
  rate: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSkip: (delta: number) => void;
  onRate: (rate: number) => void;
};

const btn =
  "grid size-9 place-items-center rounded-full transition-colors hover:bg-surface disabled:opacity-30";

/** Small player that sits above the reader dock while read-aloud is active. */
export function ReadAloudBar({
  status,
  current,
  total,
  rate,
  onPause,
  onResume,
  onStop,
  onSkip,
  onRate,
}: Props) {
  const nextRate = SPEECH_RATES[(SPEECH_RATES.indexOf(rate as never) + 1) % SPEECH_RATES.length];
  const playing = status === "playing";

  return (
    <div
      role="region"
      aria-label="Read aloud"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-3"
    >
      <div className="glass pointer-events-auto flex items-center gap-1 rounded-full px-2 py-1.5 shadow-2xl">
        <button
          type="button"
          className={btn}
          aria-label="Previous paragraph"
          disabled={current === null || current <= 0}
          onClick={() => onSkip(-1)}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
            <path d="M6 5h2v14H6zM20 5v14L9 12z" />
          </svg>
        </button>
        <button
          type="button"
          className={`${btn} bg-ink text-bg hover:bg-ink/85`}
          aria-label={playing ? "Pause reading" : "Resume reading"}
          onClick={playing ? onPause : onResume}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
              <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <button
          type="button"
          className={btn}
          aria-label="Next paragraph"
          disabled={current === null || current >= total - 1}
          onClick={() => onSkip(1)}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
            <path d="M16 5h2v14h-2zM4 5v14l11-7z" />
          </svg>
        </button>
        <span className="text-faint w-16 text-center text-xs tabular-nums" aria-live="off">
          {current === null ? "—" : `${current + 1} / ${total}`}
        </span>
        <button
          type="button"
          onClick={() => onRate(nextRate)}
          aria-label={`Speed ${rate}x. Change speed`}
          className="text-muted hover:bg-surface hover:text-ink h-9 rounded-full px-3 text-xs tabular-nums"
        >
          {rate}×
        </button>
        <button type="button" className={btn} aria-label="Stop reading" onClick={onStop}>
          <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
            <path d="M6 6h12v12H6z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
