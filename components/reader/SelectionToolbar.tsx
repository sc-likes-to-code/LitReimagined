"use client";

import type { HighlightColor } from "@/lib/client/library";
import type { TextSelection } from "./useTextSelection";

const COLORS: { id: HighlightColor; className: string; label: string }[] = [
  { id: "ember", className: "bg-ember", label: "Ember" },
  { id: "circuit", className: "bg-circuit", label: "Blue" },
  { id: "sage", className: "bg-sage", label: "Sage" },
  { id: "blush", className: "bg-blush", label: "Blush" },
];

type Props = {
  selection: TextSelection;
  onHighlight: (color: HighlightColor) => void;
  onCopy: () => void;
  onAi?: (kind: "rewrite" | "explain") => void;
  onCard?: () => void;
};

export function SelectionToolbar({ selection, onHighlight, onCopy, onAi, onCard }: Props) {
  const { rect } = selection;
  const width = (onAi ? 330 : 210) + (onCard ? 64 : 0);
  const left = Math.min(
    Math.max(12, rect.left + rect.width / 2 - width / 2),
    (typeof window === "undefined" ? 1200 : window.innerWidth) - width - 12,
  );
  const top = rect.top > 90 ? rect.top - 56 : rect.bottom + 12;

  return (
    <div
      role="toolbar"
      aria-label="Text actions"
      onMouseDown={(e) => e.preventDefault()}
      style={{ top, left }}
      className="glass fixed z-[60] flex items-center gap-1 rounded-full p-1.5 shadow-2xl"
    >
      <div className="flex items-center gap-1.5 px-2">
        {COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-label={`Highlight ${c.label}`}
            onClick={() => onHighlight(c.id)}
            className={`${c.className} size-5 rounded-full transition-transform hover:scale-125`}
          />
        ))}
      </div>
      <span className="bg-line-strong mx-1 h-5 w-px" aria-hidden />
      <button
        type="button"
        onClick={onCopy}
        className="text-muted hover:text-ink rounded-full px-3 py-1.5 text-xs"
      >
        Copy
      </button>
      {onCard && (
        <button
          type="button"
          onClick={onCard}
          className="text-muted hover:text-ink rounded-full px-3 py-1.5 text-xs"
        >
          Card
        </button>
      )}
      {onAi && (
        <>
          <button
            type="button"
            onClick={() => onAi("explain")}
            className="text-circuit hover:bg-circuit/10 rounded-full px-3 py-1.5 text-xs font-medium"
          >
            Explain
          </button>
          <button
            type="button"
            onClick={() => onAi("rewrite")}
            className="text-circuit hover:bg-circuit/10 rounded-full px-3 py-1.5 text-xs font-medium"
          >
            Rewrite
          </button>
        </>
      )}
    </div>
  );
}
