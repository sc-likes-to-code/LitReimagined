"use client";

import { Fragment, useMemo } from "react";
import {
  buildSegments,
  findGlossMarks,
  findHighlightMark,
  type Mark,
} from "@/lib/reader/segments";
import type { Highlight } from "@/lib/client/library";
import { cn } from "@/lib/utils";

type Props = {
  index: number;
  text: string;
  source: "original" | "modern";
  /** Changes when the visible version changes, replaying the morph animation. */
  version: string;
  glossTerms?: string[];
  highlights: Highlight[];
  bookmarked: boolean;
  active: boolean;
  focus: boolean;
  onGloss: (term: string, el: HTMLElement) => void;
  onHighlight: (id: string, el: HTMLElement) => void;
  onBookmark: () => void;
  family: "serif" | "sans";
};

const HL_CLASS: Record<string, string> = {
  ember: "bg-ember/25 decoration-ember",
  circuit: "bg-circuit/25 decoration-circuit",
  sage: "bg-sage/30 decoration-sage",
  blush: "bg-blush/35 decoration-blush",
};

export function Paragraph({
  index,
  text,
  source,
  version,
  glossTerms,
  highlights,
  bookmarked,
  active,
  focus,
  onGloss,
  onHighlight,
  onBookmark,
  family,
}: Props) {
  const { segments, hiddenHighlights } = useMemo(() => {
    const marks: Mark[] = [];
    let hidden = 0;
    for (const h of highlights) {
      const m = findHighlightMark(text, h);
      if (m) marks.push(m);
      else hidden++;
    }
    if (glossTerms?.length) marks.push(...findGlossMarks(text, glossTerms));
    return { segments: buildSegments(text, marks), hiddenHighlights: hidden };
  }, [text, highlights, glossTerms]);

  return (
    <div className="group/p relative">
      <button
        type="button"
        onClick={onBookmark}
        aria-pressed={bookmarked}
        aria-label={
          bookmarked
            ? `Remove bookmark at paragraph ${index + 1}`
            : `Bookmark paragraph ${index + 1}`
        }
        className={cn(
          "absolute top-1 -left-9 hidden size-7 place-items-center rounded-full transition-opacity md:grid",
          bookmarked
            ? "text-ember opacity-100"
            : "text-faint hover:text-ink opacity-0 group-hover/p:opacity-100 focus-visible:opacity-100",
        )}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill={bookmarked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        >
          <path d="M6 3h12v18l-6-4.5L6 21Z" />
        </svg>
      </button>

      <p
        key={version}
        data-p={index}
        data-src={source}
        className={cn(
          "morph-in whitespace-pre-line transition-opacity duration-500",
          family === "serif" ? "font-reading" : "font-sans",
          focus && !active && "opacity-35",
        )}
      >
        {segments.map((s, i) => {
          if (s.type === "text") return <Fragment key={i}>{s.text}</Fragment>;
          const m = s.mark;
          if (m.kind === "gloss") {
            return (
              <button
                key={i}
                type="button"
                onClick={(e) => onGloss(m.term, e.currentTarget)}
                className="decoration-circuit/70 hover:decoration-circuit cursor-help underline decoration-dotted underline-offset-[5px]"
              >
                {s.text}
              </button>
            );
          }
          return (
            <mark
              key={i}
              tabIndex={0}
              role="button"
              onClick={(e) => onHighlight(m.id, e.currentTarget)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onHighlight(m.id, e.currentTarget);
                }
              }}
              className={cn(
                "cursor-pointer rounded-sm px-0.5 text-inherit",
                HL_CLASS[m.color] ?? HL_CLASS.ember,
                m.hasNote && "underline decoration-2 underline-offset-4",
              )}
            >
              {s.text}
            </mark>
          );
        })}
        {hiddenHighlights > 0 && (
          <span
            className="bg-ember/70 ml-1.5 inline-block size-1.5 rounded-full align-middle"
            title="You highlighted this passage in another version"
          />
        )}
      </p>
    </div>
  );
}
