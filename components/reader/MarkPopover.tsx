"use client";

import { useEffect, useRef } from "react";
import {
  removeHighlight,
  updateHighlightNote,
  type Highlight,
} from "@/lib/client/library";
import type { GlossaryEntry } from "@/lib/data/types";

export type Popover =
  | { kind: "gloss"; term: string; rect: DOMRect }
  | { kind: "highlight"; id: string; rect: DOMRect };

type Props = {
  popover: Popover;
  glossary: GlossaryEntry[];
  highlights: Highlight[];
  onClose: () => void;
};

/**
 * The note box. It saves on blur, and also when it goes away (click outside, scroll, switching
 * to another highlight), because unmounting a focused field fires no blur event.
 */
function NoteField({ highlight, onClose }: { highlight: Highlight; onClose: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const saved = useRef(highlight.note ?? "");
  const id = highlight.id;

  useEffect(() => {
    const el = ref.current;
    return () => {
      if (el && el.value !== saved.current) updateHighlightNote(id, el.value);
    };
  }, [id]);

  const save = (value: string) => {
    if (value === saved.current) return;
    saved.current = value;
    updateHighlightNote(id, value);
  };

  return (
    <textarea
      ref={ref}
      defaultValue={highlight.note ?? ""}
      onBlur={(e) => save(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          save(e.currentTarget.value);
          onClose();
        }
      }}
      placeholder="Add a thought…"
      rows={3}
      className="bg-surface border-line w-full resize-none rounded-xl border p-3 text-sm outline-none"
    />
  );
}

/** The small card opened by tapping a glossary term or a highlight (shared by both readers). */
export function MarkPopover({ popover, glossary, highlights, onClose }: Props) {
  // Close on scroll or on a click outside.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-popover], [data-gloss], mark"))
        onClose();
    };
    window.addEventListener("scroll", onClose, { passive: true });
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("scroll", onClose);
      window.removeEventListener("mousedown", onDown);
    };
  }, [onClose]);

  const highlight =
    popover.kind === "highlight" ? highlights.find((h) => h.id === popover.id) : undefined;
  const gloss =
    popover.kind === "gloss"
      ? glossary.find((g) => g.term.toLowerCase() === popover.term.toLowerCase())
      : undefined;

  return (
    <div
      data-popover
      role="dialog"
      style={{
        top: Math.min(
          popover.rect.bottom + 10,
          (typeof window === "undefined" ? 800 : window.innerHeight) - 220,
        ),
        left: Math.min(
          Math.max(12, popover.rect.left),
          (typeof window === "undefined" ? 1200 : window.innerWidth) - 316,
        ),
      }}
      className="glass fixed z-[60] w-[19rem] rounded-2xl p-4 shadow-2xl"
    >
      {gloss && (
        <>
          <p className="font-display text-lg">{gloss.term}</p>
          <p className="text-muted mt-1 text-sm leading-relaxed">{gloss.definition}</p>
          {gloss.modernEquiv && (
            <p className="text-circuit mt-2 text-xs">Today: {gloss.modernEquiv}</p>
          )}
        </>
      )}
      {highlight && (
        <>
          <p className="eyebrow mb-2">Your note</p>
          <NoteField key={highlight.id} highlight={highlight} onClose={onClose} />
          <button
            type="button"
            onClick={() => {
              removeHighlight(highlight.id);
              onClose();
            }}
            className="text-muted hover:text-ember mt-2 text-xs underline underline-offset-4"
          >
            Remove highlight
          </button>
        </>
      )}
    </div>
  );
}
