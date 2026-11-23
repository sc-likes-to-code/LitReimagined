"use client";

import { useEffect, useRef, useState } from "react";
import {
  CARD_FORMATS,
  CARD_THEMES,
  canvasToBlob,
  drawQuoteCard,
  type CardFormat,
  type CardTheme,
} from "@/lib/reader/quote-card";
import { cn } from "@/lib/utils";

type Props = {
  quote: string;
  author: string;
  book: string;
  onClose: () => void;
};

/** Reads the resolved font stacks (next/font renames families, so read them from CSS). */
function readFonts() {
  const css = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: string) =>
    css.getPropertyValue(name).trim() || fallback;
  return {
    display: get("--font-display", "Georgia, serif"),
    reading: get("--font-reading", "Georgia, serif"),
    sans: get("--font-sans", "system-ui, sans-serif"),
  };
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function QuoteCardModal({ quote, author, book, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [format, setFormat] = useState<CardFormat>("portrait");
  const [theme, setTheme] = useState<CardTheme>("ink");
  const [notice, setNotice] = useState<string | null>(null);
  const [canShare] = useState(
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
  );

  // Redraw when the options change. Fonts are awaited so the first paint is not a fallback.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    const fonts = readFonts();
    const draw = () => !cancelled && drawQuoteCard(canvas, { quote, author, book, format, theme, fonts });
    draw();
    Promise.all([
      document.fonts.load(`italic 400 48px ${fonts.reading}`),
      document.fonts.load(`500 40px ${fonts.display}`),
      document.fonts.load(`italic 400 200px ${fonts.display}`),
    ])
      .then(draw)
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [quote, author, book, format, theme]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const fileName = `${slug(book)}-quote.png`;

  async function getBlob() {
    const canvas = canvasRef.current;
    return canvas ? canvasToBlob(canvas) : null;
  }

  async function download() {
    const blob = await getBlob();
    if (!blob) return setNotice("Could not create the image.");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    setNotice("Saved to your downloads.");
  }

  async function copyImage() {
    const blob = await getBlob();
    try {
      if (!blob) throw new Error("no image");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setNotice("Image copied.");
    } catch {
      setNotice("Copying images is not supported here. Use Download instead.");
    }
  }

  async function share() {
    const blob = await getBlob();
    if (!blob) return;
    const file = new File([blob], fileName, { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] }))
        await navigator.share({ files: [file], title: book });
      else await navigator.share({ title: book, text: `“${quote}” — ${author}, ${book}` });
    } catch {
      /* the share sheet was dismissed */
    }
  }

  const chip = (active: boolean) =>
    cn(
      "rounded-full px-3.5 py-1.5 text-xs transition-colors",
      active ? "bg-ink text-bg" : "hairline text-muted hover:text-ink",
    );

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Make a quote card"
        className="glass grid w-full max-w-4xl gap-6 rounded-3xl p-5 shadow-2xl sm:p-7 md:grid-cols-[minmax(0,1fr)_17rem]"
      >
        <div className="grid place-items-center">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`Quote card: ${quote}`}
            className="max-h-[70dvh] w-auto max-w-full rounded-2xl shadow-xl"
            style={{ aspectRatio: `${CARD_FORMATS[format].w} / ${CARD_FORMATS[format].h}` }}
          />
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-2xl">Quote card</h2>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="hover:bg-surface grid size-9 place-items-center rounded-full"
            >
              ✕
            </button>
          </div>

          <fieldset>
            <legend className="eyebrow mb-2">Shape</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CARD_FORMATS) as CardFormat[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={format === f}
                  onClick={() => setFormat(f)}
                  className={chip(format === f)}
                >
                  {CARD_FORMATS[f].label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="eyebrow mb-2">Style</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CARD_THEMES) as CardTheme[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={theme === t}
                  onClick={() => setTheme(t)}
                  className={chip(theme === t)}
                >
                  {CARD_THEMES[t].label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-auto flex flex-col gap-2">
            <button
              type="button"
              onClick={download}
              className="bg-ink text-bg rounded-full px-5 py-3 text-sm font-medium transition-opacity hover:opacity-90"
            >
              Download image
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyImage}
                className="hairline hover:bg-surface flex-1 rounded-full px-4 py-2.5 text-sm"
              >
                Copy image
              </button>
              {canShare && (
                <button
                  type="button"
                  onClick={share}
                  className="hairline hover:bg-surface flex-1 rounded-full px-4 py-2.5 text-sm"
                >
                  Share
                </button>
              )}
            </div>
            <p role="status" className="text-muted min-h-5 text-xs">
              {notice}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
