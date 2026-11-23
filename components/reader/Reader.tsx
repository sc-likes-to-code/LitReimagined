"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LevelSlider } from "@/components/reader/LevelSlider";
import { Paragraph } from "@/components/reader/Paragraph";
import { ReadAloudBar } from "@/components/reader/ReadAloudBar";
import { ReaderPrefsPanel } from "@/components/reader/ReaderPrefsPanel";
import { SelectionToolbar } from "@/components/reader/SelectionToolbar";
import { useTextSelection } from "@/components/reader/useTextSelection";
import { LogoMark } from "@/components/brand/Logo";
import {
  addHighlight,
  removeHighlight,
  saveProgress,
  toggleBookmark,
  updateHighlightNote,
  updatePrefs,
  useBookmarks,
  useHighlights,
  useProgress,
  useReaderPrefs,
  type HighlightColor,
} from "@/lib/client/library";
import { LEVEL_LABELS, type Chapter, type ChapterSummary, type Level } from "@/lib/data/types";
import { useReadAloud } from "@/lib/client/read-aloud";
import { cn } from "@/lib/utils";

// Loaded on demand: most readers never open the card maker.
const QuoteCardModal = dynamic(
  () => import("@/components/reader/QuoteCardModal").then((m) => m.QuoteCardModal),
  { ssr: false },
);

export type AiRequest = { kind: "rewrite" | "explain"; text: string; context: string };

type Props = {
  book: { slug: string; title: string; authorName: string };
  chapter: Chapter;
  chapters: ChapterSummary[];
  /** Plugs the live AI tools into the selection toolbar. Omitted when AI is unavailable. */
  onAi?: (req: AiRequest) => void;
};

const MEASURE = { narrow: "36rem", medium: "42rem", wide: "50rem" } as const;

type Popover =
  | { kind: "gloss"; term: string; rect: DOMRect }
  | { kind: "highlight"; id: string; rect: DOMRect };

export function Reader({ book, chapter, chapters, onAi }: Props) {
  const prefs = useReaderPrefs();
  const bookmarks = useBookmarks();
  const allHighlights = useHighlights();
  const progress = useProgress();

  const articleRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [activePara, setActivePara] = useState(0);
  const [showPrefs, setShowPrefs] = useState(false);
  const [popover, setPopover] = useState<Popover | null>(null);
  const [selection, clearSelection] = useTextSelection(articleRef);

  /* ---------------------------------------------------------------- levels */
  const available = useMemo(
    () => ([1, 2, 3] as const).filter((l) => chapter.translations[l]) as Level[],
    [chapter.translations],
  );
  const hasModern = available.length > 0;

  // If the preferred level has no translation, fall back to the nearest one we do have.
  const level: Level = useMemo(() => {
    if (prefs.level === 0 || !hasModern) return 0;
    if (available.includes(prefs.level)) return prefs.level;
    return available.reduce(
      (best, l) => (Math.abs(l - prefs.level) < Math.abs(best - prefs.level) ? l : best),
      available[0],
    );
  }, [prefs.level, available, hasModern]);

  const split = prefs.view === "split" && hasModern;
  // In split view the right column always shows a modern version.
  const modernLevel = (
    level === 0 ? (available.includes(2) ? 2 : available[0]) : level
  ) as 1 | 2 | 3;
  const modernText = hasModern ? chapter.translations[modernLevel]! : chapter.original;

  /* ----------------------------------------------------------- read aloud */
  // Reads whichever version is on screen (the modern text in side-by-side view).
  const spoken = split || (level !== 0 && hasModern) ? modernText : chapter.original;
  const speech = useReadAloud(spoken);
  const { stop: stopSpeech, current: speakingPara } = speech;
  const [card, setCard] = useState<string | null>(null);

  // A new chapter, or a different version, should never keep talking over the page.
  useEffect(() => stopSpeech, [stopSpeech, chapter.idx, spoken]);

  useEffect(() => {
    if (speakingPara === null) return;
    const el = document.querySelector<HTMLElement>(`[data-row="${speakingPara}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 120 || r.bottom > window.innerHeight - 160)
      el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [speakingPara]);

  const glossTerms = useMemo(
    () => chapter.glossary.map((g) => g.term),
    [chapter.glossary],
  );
  const highlights = useMemo(
    () => allHighlights.filter((h) => h.book === book.slug && h.chapter === chapter.idx),
    [allHighlights, book.slug, chapter.idx],
  );
  const bookmarkedParas = useMemo(
    () =>
      new Set(
        bookmarks
          .filter((b) => b.book === book.slug && b.chapter === chapter.idx)
          .map((b) => b.paragraph),
      ),
    [bookmarks, book.slug, chapter.idx],
  );

  /* ------------------------------------------------- progress + scroll bar */
  const restored = useRef(false);

  useEffect(() => {
    const root = articleRef.current;
    if (!root) return;
    const paras = Array.from(root.querySelectorAll<HTMLElement>("[data-row]"));
    let timer: ReturnType<typeof setTimeout> | undefined;

    const io = new IntersectionObserver(
      (entries) => {
        // Pick the topmost row that is inside the upper reading band.
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const top = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
        );
        const idx = Number((top.target as HTMLElement).dataset.row);
        setActivePara(idx);
        clearTimeout(timer);
        timer = setTimeout(
          () =>
            saveProgress(book.slug, {
              chapter: chapter.idx,
              paragraph: idx,
              level: prefs.level,
            }),
          900,
        );
      },
      { rootMargin: "-25% 0px -60% 0px" },
    );
    paras.forEach((p) => io.observe(p));
    return () => {
      io.disconnect();
      clearTimeout(timer);
    };
    // Re-observe when the layout of rows changes (split/single).
  }, [book.slug, chapter.idx, prefs.level, split, chapter.original.length]);

  // Resume where the reader left off (once, same chapter only).
  useEffect(() => {
    if (restored.current) return;
    const saved = progress[book.slug];
    if (saved && saved.chapter === chapter.idx && saved.paragraph > 1) {
      restored.current = true;
      requestAnimationFrame(() => {
        document
          .querySelector(`[data-row="${saved.paragraph}"]`)
          ?.scrollIntoView({ block: "center", behavior: "auto" });
      });
    } else if (saved !== undefined || Object.keys(progress).length >= 0) {
      restored.current = true;
    }
  }, [progress, book.slug, chapter.idx]);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    let raf = 0;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* ----------------------------------------------------------- shortcuts */
  const prevHref = chapter.prev !== null ? `/read/${book.slug}/${chapter.prev}` : null;
  const nextHref = chapter.next !== null ? `/read/${book.slug}/${chapter.next}` : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      )
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") {
        setPopover(null);
        setShowPrefs(false);
      } else if (e.key >= "1" && e.key <= "4") {
        const l = (Number(e.key) - 1) as Level;
        if (l === 0 || available.includes(l)) updatePrefs({ level: l });
      } else if (e.key.toLowerCase() === "s" && hasModern) {
        updatePrefs({ view: prefs.view === "split" ? "single" : "split" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [available, hasModern, prefs.view]);

  // Close floating popovers on scroll or outside click.
  useEffect(() => {
    if (!popover) return;
    const close = () => setPopover(null);
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-popover], [data-gloss], mark"))
        close();
    };
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("scroll", close);
      window.removeEventListener("mousedown", onDown);
    };
  }, [popover]);

  /* -------------------------------------------------------------- actions */
  const commitHighlight = useCallback(
    (color: HighlightColor) => {
      if (!selection) return;
      addHighlight({
        book: book.slug,
        chapter: chapter.idx,
        paragraph: selection.paragraph,
        text: selection.text,
        color,
      });
      clearSelection();
    },
    [selection, book.slug, chapter.idx, clearSelection],
  );

  const copy = useCallback(async () => {
    if (!selection) return;
    const quote = `“${selection.text}” — ${book.authorName}, ${book.title}`;
    try {
      await navigator.clipboard.writeText(quote);
    } catch {
      /* clipboard unavailable */
    }
    clearSelection();
  }, [selection, book.authorName, book.title, clearSelection]);

  const requestAi = useCallback(
    (kind: "rewrite" | "explain") => {
      if (!selection || !onAi) return;
      const context = chapter.original[selection.paragraph] ?? "";
      onAi({ kind, text: selection.text, context });
      clearSelection();
    },
    [selection, onAi, chapter.original, clearSelection],
  );

  const activeHighlight =
    popover?.kind === "highlight"
      ? highlights.find((h) => h.id === popover.id)
      : undefined;
  const activeGloss =
    popover?.kind === "gloss"
      ? chapter.glossary.find((g) => g.term.toLowerCase() === popover.term.toLowerCase())
      : undefined;

  /* --------------------------------------------------------------- render */
  const bodyStyle = {
    fontSize: `${prefs.fontSize}px`,
    lineHeight: prefs.lineHeight,
  } as const;

  return (
    <div className="relative min-h-dvh pb-40">
      {/* progress hairline */}
      <div className="fixed inset-x-0 top-0 z-[70] h-0.5">
        <div
          ref={barRef}
          className="from-ember to-ember-2 h-full origin-left scale-x-0 bg-gradient-to-r"
        />
      </div>

      {/* top bar */}
      <header className="glass fixed inset-x-0 top-0 z-50 border-x-0 border-t-0">
        <div className="mx-auto flex h-[var(--nav-h)] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href={`/books/${book.slug}`}
            className="text-muted hover:text-ink flex items-center gap-3 text-sm transition-colors"
          >
            <LogoMark className="h-6" />
            <span className="hidden sm:inline">← {book.title}</span>
            <span className="sm:hidden">← Back</span>
          </Link>
          <p className="text-faint hidden truncate text-xs tracking-[0.18em] uppercase md:block">
            {chapter.title}
            {chapters.length > 1 &&
              ` · ${chapters.findIndex((c) => c.idx === chapter.idx) + 1} of ${chapters.length}`}
          </p>
          <button
            type="button"
            onClick={() => setShowPrefs((v) => !v)}
            aria-expanded={showPrefs}
            className="hairline hover:bg-surface flex h-10 items-center gap-2 rounded-full px-4 text-sm transition-colors"
          >
            <span className="font-display text-base leading-none">Aa</span>
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </header>
      {showPrefs && (
        <ReaderPrefsPanel prefs={prefs} onClose={() => setShowPrefs(false)} />
      )}

      {/* article */}
      <article
        ref={articleRef}
        style={{ maxWidth: split ? "72rem" : MEASURE[prefs.measure] }}
        className="mx-auto px-5 pt-[calc(var(--nav-h)+4rem)] sm:px-10"
      >
        <header className="mb-14 text-center">
          <p className="eyebrow mb-4">{book.authorName}</p>
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
            {chapter.title}
          </h1>
          <p className="text-faint mt-3 text-sm">{book.title}</p>
          {chapter.isSample && (
            <p className="text-circuit border-circuit/30 bg-circuit/10 mx-auto mt-6 inline-block rounded-full border px-4 py-1.5 text-xs">
              Sample excerpt. Full chapters arrive when the library is connected.
            </p>
          )}
          {!hasModern && (
            <p className="text-muted mx-auto mt-6 max-w-sm text-sm">
              The modern version of this chapter is still being written. Showing the
              original text.
            </p>
          )}
        </header>

        <div
          style={bodyStyle}
          className={cn("space-y-[1.4em]", split && "space-y-[1.8em]")}
        >
          {split && (
            <div
              aria-hidden
              className="bg-bg/85 sticky top-[var(--nav-h)] z-30 -mx-2 hidden grid-cols-2 gap-x-12 px-2 py-3 backdrop-blur md:grid"
            >
              <p className="eyebrow label-original">{LEVEL_LABELS[0]} version</p>
              <p className="eyebrow label-modern">{LEVEL_LABELS[modernLevel]} version</p>
            </div>
          )}
          {chapter.original.map((orig, i) => {
            const showOriginal = split || level === 0 || !hasModern;
            const showModern = split || (level !== 0 && hasModern);
            const common = {
              index: i,
              highlights: highlights.filter((h) => h.paragraph === i),
              bookmarked: bookmarkedParas.has(i),
              active: activePara === i,
              focus: prefs.focus,
              speaking: speakingPara === i,
              family: prefs.family,
              onGloss: (term: string, el: HTMLElement) =>
                setPopover({ kind: "gloss", term, rect: el.getBoundingClientRect() }),
              onHighlight: (id: string, el: HTMLElement) =>
                setPopover({ kind: "highlight", id, rect: el.getBoundingClientRect() }),
              onBookmark: () => toggleBookmark(book.slug, chapter.idx, i),
            };
            return (
              <div
                key={i}
                data-row={i}
                className={cn(split && "grid gap-x-12 gap-y-4 md:grid-cols-2")}
              >
                {showOriginal && (
                  <div className={cn(split && "md:order-1")}>
                    {split && (
                      <p className="eyebrow label-original mb-2 md:hidden">
                        {LEVEL_LABELS[0]} version
                      </p>
                    )}
                    <Paragraph
                      {...common}
                      text={orig}
                      source="original"
                      version="orig"
                      glossTerms={glossTerms}
                    />
                  </div>
                )}
                {showModern && (
                  <div className={cn(split && "md:order-2")}>
                    {split && (
                      <p className="eyebrow label-modern mb-2 md:hidden">
                        {LEVEL_LABELS[modernLevel]} version
                      </p>
                    )}
                    <Paragraph
                      {...common}
                      text={modernText[i] ?? orig}
                      source="modern"
                      version={`m${modernLevel}`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* chapter footer */}
        <footer className="border-line mt-24 border-t pt-12 text-center">
          {nextHref ? (
            <>
              <p className="eyebrow mb-4">Next</p>
              <Link
                href={nextHref}
                className="font-display text-gradient-ember text-3xl italic transition-opacity hover:opacity-80"
              >
                Continue to the next chapter →
              </Link>
            </>
          ) : (
            <>
              <p className="font-display text-3xl">
                That&apos;s the end of {chapter.isSample ? "this sample" : "the book"}.
              </p>
              <p className="text-muted mx-auto mt-3 max-w-md text-sm">
                {chapter.isSample
                  ? "The complete text and modern versions arrive once the library is connected."
                  : "Thank you for reading. Pick up another classic whenever you like."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
                <Link
                  href={`/books/${book.slug}`}
                  className="underline underline-offset-4"
                >
                  Back to the book
                </Link>
                <Link href="/explore" className="underline underline-offset-4">
                  Find another
                </Link>
              </div>
            </>
          )}
        </footer>
      </article>

      {/* floating dock */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-3">
        <div className="glass pointer-events-auto flex w-full max-w-2xl items-center gap-3 rounded-full py-2 pr-3 pl-3 shadow-2xl sm:gap-5 sm:pr-4 sm:pl-5">
          <Link
            href={prevHref ?? "#"}
            aria-label="Previous chapter"
            aria-disabled={!prevHref}
            tabIndex={prevHref ? 0 : -1}
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-full transition-colors",
              prevHref ? "hover:bg-surface" : "opacity-25",
            )}
          >
            ←
          </Link>
          <LevelSlider
            compact
            value={level}
            available={available}
            onChange={(l) => updatePrefs({ level: l })}
            className="min-w-0 flex-1"
          />
          <button
            type="button"
            disabled={!hasModern}
            onClick={() => updatePrefs({ view: split ? "single" : "split" })}
            aria-pressed={split}
            aria-label="Toggle side-by-side view"
            title="Side by side (S)"
            className={cn(
              "hidden size-9 shrink-0 place-items-center rounded-full transition-colors disabled:opacity-25 sm:grid",
              split ? "bg-ink text-bg" : "hover:bg-surface",
            )}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-[18px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M12 5v14" />
            </svg>
          </button>
          {speech.supported && (
            <button
              type="button"
              onClick={() =>
                speech.status === "idle" ? speech.start(activePara) : speech.stop()
              }
              aria-pressed={speech.status !== "idle"}
              aria-label={speech.status === "idle" ? "Read aloud" : "Stop reading aloud"}
              title="Read aloud"
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full transition-colors",
                speech.status !== "idle" ? "bg-ink text-bg" : "hover:bg-surface",
              )}
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
                <path d="M4 10v4h3.5L12 18V6L7.5 10Z" />
                <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
              </svg>
            </button>
          )}
          <Link
            href={nextHref ?? "#"}
            aria-label="Next chapter"
            aria-disabled={!nextHref}
            tabIndex={nextHref ? 0 : -1}
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-full transition-colors",
              nextHref ? "hover:bg-surface" : "opacity-25",
            )}
          >
            →
          </Link>
        </div>
      </div>

      {speech.status !== "idle" && (
        <ReadAloudBar
          status={speech.status}
          current={speech.current}
          total={spoken.length}
          rate={speech.rate}
          onPause={speech.pause}
          onResume={speech.resume}
          onStop={speech.stop}
          onSkip={(d) => speech.start((speech.current ?? 0) + d)}
          onRate={speech.setRate}
        />
      )}

      {/* selection toolbar */}
      {selection && (
        <SelectionToolbar
          selection={selection}
          onHighlight={commitHighlight}
          onCopy={copy}
          onAi={onAi ? requestAi : undefined}
          onCard={() => {
            setCard(selection.text);
            clearSelection();
          }}
        />
      )}

      {card && (
        <QuoteCardModal
          quote={card}
          author={book.authorName}
          book={book.title}
          onClose={() => setCard(null)}
        />
      )}

      {/* glossary + highlight popovers */}
      {popover && (
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
          {popover.kind === "gloss" && activeGloss && (
            <>
              <p className="font-display text-lg">{activeGloss.term}</p>
              <p className="text-muted mt-1 text-sm leading-relaxed">
                {activeGloss.definition}
              </p>
              {activeGloss.modernEquiv && (
                <p className="text-circuit mt-2 text-xs">
                  Today: {activeGloss.modernEquiv}
                </p>
              )}
            </>
          )}
          {popover.kind === "highlight" && activeHighlight && (
            <>
              <p className="eyebrow mb-2">Your note</p>
              <textarea
                key={activeHighlight.id}
                defaultValue={activeHighlight.note ?? ""}
                onBlur={(e) => updateHighlightNote(activeHighlight.id, e.target.value)}
                placeholder="Add a thought…"
                rows={3}
                className="bg-surface border-line w-full resize-none rounded-xl border p-3 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  removeHighlight(activeHighlight.id);
                  setPopover(null);
                }}
                className="text-muted hover:text-ember mt-2 text-xs underline underline-offset-4"
              >
                Remove highlight
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
