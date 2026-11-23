"use client";

import { setShelfStatus, useShelf, type ShelfStatus } from "@/lib/client/library";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ShelfStatus; label: string }[] = [
  { value: "want", label: "Want to read" },
  { value: "reading", label: "Reading" },
  { value: "finished", label: "Finished" },
];

/** Segmented shelf control. Stored locally for guests; synced to the account once signed in. */
export function ShelfButton({ slug }: { slug: string }) {
  const shelf = useShelf();
  const current = shelf[slug]?.status;

  return (
    <div
      role="group"
      aria-label="Add to your shelf"
      className="hairline inline-flex rounded-full p-1"
    >
      {OPTIONS.map((o) => {
        const on = current === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => setShelfStatus(slug, on ? null : o.value)}
            className={cn(
              "rounded-full px-4 py-2 text-sm transition-colors",
              on ? "bg-ink text-bg" : "text-muted hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
