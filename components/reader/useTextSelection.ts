"use client";

import { useEffect, useState, type RefObject } from "react";

export type TextSelection = {
  text: string;
  paragraph: number;
  source: "original" | "modern";
  rect: { top: number; left: number; width: number; bottom: number };
};

/** Tracks a text selection that sits inside a single reader paragraph. */
export function useTextSelection(container: RefObject<HTMLElement | null>) {
  const [selection, setSelection] = useState<TextSelection | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let raf = 0;

    const read = () => {
      const sel = window.getSelection();
      const root = container.current;
      if (!sel || sel.isCollapsed || sel.rangeCount === 0 || !root)
        return setSelection(null);

      const range = sel.getRangeAt(0);
      const node = range.commonAncestorContainer;
      const el = node.nodeType === 1 ? (node as Element) : node.parentElement;
      const p = el?.closest<HTMLElement>("[data-p]");
      if (!p || !root.contains(p)) return setSelection(null);

      const text = sel.toString().replace(/\s+/g, " ").trim();
      if (text.length < 2) return setSelection(null);

      const r = range.getBoundingClientRect();
      setSelection({
        text,
        paragraph: Number(p.dataset.p),
        source: p.dataset.src === "original" ? "original" : "modern",
        rect: { top: r.top, left: r.left, width: r.width, bottom: r.bottom },
      });
    };

    const onChange = () => {
      clearTimeout(timer);
      timer = setTimeout(read, 140);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (window.getSelection()?.isCollapsed === false) read();
      });
    };

    document.addEventListener("selectionchange", onChange);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("selectionchange", onChange);
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [container]);

  return [
    selection,
    () => {
      window.getSelection()?.removeAllRanges();
      setSelection(null);
    },
  ] as const;
}
