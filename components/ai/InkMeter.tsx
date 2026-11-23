"use client";

import { useEffect } from "react";
import { refreshQuota, useAiQuota } from "@/lib/client/ai";
import { cn } from "@/lib/utils";

/** The "quill ink" meter: shows how many live AI actions are left today. */
export function InkMeter({ className }: { className?: string }) {
  const q = useAiQuota();
  useEffect(() => {
    if (!q.loaded) void refreshQuota();
  }, [q.loaded]);

  if (!q.loaded || q.limit === 0) return null;
  const drops = Math.min(q.limit, 10);
  const filled = q.limit > 10 ? Math.ceil((q.remaining / q.limit) * 10) : q.remaining;

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      title="Live AI actions left today. Your allowance refills every day."
    >
      <span className="flex gap-1" aria-hidden>
        {Array.from({ length: drops }).map((_, i) => (
          <svg
            key={i}
            viewBox="0 0 12 16"
            className={cn(
              "h-3.5 w-2.5 transition-colors",
              i < filled ? "text-circuit" : "text-line-strong",
            )}
          >
            <path
              d="M6 0C6 0 1 6 1 10a5 5 0 0 0 10 0C11 6 6 0 6 0Z"
              fill="currentColor"
            />
          </svg>
        ))}
      </span>
      <span className="text-faint text-xs">
        {q.remaining} of {q.limit} left today
      </span>
    </div>
  );
}
