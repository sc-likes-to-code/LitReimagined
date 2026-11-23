"use client";

import { cn } from "@/lib/utils";

type Props = {
  text: string;
  /** Changes whenever the visible version changes, restarting the animation. */
  version: string | number;
  /** Word-by-word dissolve (used for short demo text only). */
  words?: boolean;
  className?: string;
};

/** Text that dissolves into place when its version changes. */
export function MorphText({ text, version, words, className }: Props) {
  if (words) {
    return (
      <span key={version} className={className}>
        {text.split(/(\s+)/).map((w, i) =>
          /^\s+$/.test(w) ? (
            w
          ) : (
            <span
              key={i}
              className="morph-in inline-block"
              style={{ animationDelay: `${Math.min(i, 60) * 14}ms` }}
            >
              {w}
            </span>
          ),
        )}
      </span>
    );
  }
  return (
    <span key={version} className={cn("morph-in inline", className)}>
      {text}
    </span>
  );
}
