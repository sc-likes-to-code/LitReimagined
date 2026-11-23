"use client";

import { updatePrefs, useReaderPrefs } from "@/lib/client/library";

/** Switches between the page-turning book and the continuous scrolling reader. */
export function ModeToggle() {
  const book = useReaderPrefs().mode === "book";
  const label = book ? "Switch to scrolling view" : "Switch to book view";
  return (
    <button
      type="button"
      onClick={() => updatePrefs({ mode: book ? "scroll" : "book" })}
      aria-label={label}
      title={label}
      className="hairline hover:bg-surface grid size-10 place-items-center rounded-full transition-colors"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {book ? (
          <>
            <path d="M5 4h14M5 9h14M5 14h14M5 19h9" />
          </>
        ) : (
          <>
            <path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.500 5-2 8-2V4c-3 0-6 .5-8 2Z" />
            <path d="M12 6v14" />
          </>
        )}
      </svg>
    </button>
  );
}
