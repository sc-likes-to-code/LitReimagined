"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { LogoMark } from "@/components/brand/Logo";
import { LevelSlider } from "@/components/reader/LevelSlider";
import { ModeToggle } from "@/components/reader/ModeToggle";
import { ReaderPrefsPanel } from "@/components/reader/ReaderPrefsPanel";
import {
  saveProgress,
  updatePrefs,
  useProgress,
  useReaderPrefs,
} from "@/lib/client/library";
import { recordReading } from "@/lib/client/streaks";
import {
  LEVEL_LABELS,
  type Chapter,
  type ChapterSummary,
  type Level,
} from "@/lib/data/types";
import {
  buildBook,
  type BookGeometry,
  type BookLayout,
  type BookType,
} from "@/lib/reader/book-layout";
import { viewForPara, type Piece } from "@/lib/reader/paginate";
import { cn } from "@/lib/utils";

type Props = {
  book: { slug: string; title: string; authorName: string };
  chapter: Chapter;
  chapters: ChapterSummary[];
};

/** Set when paging backwards across a chapter so the previous chapter opens on its last page. */
const OPEN_AT_END = "lr:book-open-end";

export function BookReader({ book, chapter, chapters }: Props) {
  const prefs = useReaderPrefs();
  const progress = useProgress();
  const stageRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<{ w: number; h: number } | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  /** First paragraph of the page the reader last turned to. Survives re-layout. */
  const [anchor, setAnchor] = useState<number | null>(null);
  const [openAtEnd] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem(OPEN_AT_END) === "1",
  );

  /* ---------------------------------------------------------------- versions */
  const available = useMemo(
    () => ([1, 2, 3] as const).filter((l) => chapter.translations[l]) as Level[],
    [chapter.translations],
  );
  const hasModern = available.length > 0;
  // The right page defaults to the modern version; Original is not an option here.
  const modernLevel = (
    available.includes(prefs.level) && prefs.level !== 0
      ? prefs.level
      : available.includes(2)
        ? 2
        : available[0]
  ) as 1 | 2 | 3;
  const modernText = hasModern ? chapter.translations[modernLevel]! : null;

  /* -------------------------------------------------------------- measuring */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let first = true;
    const ro = new ResizeObserver(([entry]) => {
      const next = {
        w: Math.round(entry.contentRect.width),
        h: Math.round(entry.contentRect.height),
      };
      const apply = () =>
        setStage((s) => (s && s.w === next.w && s.h === next.h ? s : next));
      clearTimeout(timer);
      if (first) {
        first = false;
        apply();
      } else timer = setTimeout(apply, 150);
    });
    ro.observe(el);
    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    let live = true;
    document.fonts.ready.then(() => live && setFontsReady(true));
    try {
      sessionStorage.removeItem(OPEN_AT_END);
    } catch {
      /* storage unavailable */
    }
    return () => {
      live = false;
    };
  }, []);

  // Books are set a little smaller and tighter than the scrolling reader so a page holds a decent amount.
  const type = useMemo<BookType>(
    () => ({
      fontSize: Math.max(13, prefs.fontSize - 2),
      lineHeight: Math.min(prefs.lineHeight, 1.65),
      family: prefs.family,
    }),
    [prefs.fontSize, prefs.lineHeight, prefs.family],
  );

  const layout = useMemo<BookLayout | null>(
    () =>
      stage && fontsReady
        ? buildBook({ stage, type, original: chapter.original, modern: modernText })
        : null,
    [stage, fontsReady, type, chapter.original, modernText],
  );

  /* -------------------------------------------------------------- navigation */
  const prevHref = chapter.prev !== null ? `/read/${book.slug}/${chapter.prev}` : null;
  const nextHref = chapter.next !== null ? `/read/${book.slug}/${chapter.next}` : null;

  const saved = progress[book.slug];
  const savedPara = saved && saved.chapter === chapter.idx ? saved.paragraph : 0;
  const initialPara = anchor ?? (openAtEnd ? Infinity : savedPara);

  // Digits pick the right-hand version: 2 Light, 3 Modern, 4 Contemporary.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable))
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") setShowPrefs(false);
      else if (e.key >= "2" && e.key <= "4") {
        const l = (Number(e.key) - 1) as Level;
        if (available.includes(l)) updatePrefs({ level: l });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [available]);

  const chapterPos = chapters.findIndex((c) => c.idx === chapter.idx) + 1;

  return (
    <div className="fixed inset-0 overflow-hidden">
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
            {chapters.length > 1 && ` · ${chapterPos} of ${chapters.length}`}
          </p>
          <div className="flex items-center gap-2">
            <ModeToggle />
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
        </div>
      </header>
      {showPrefs && (
        <ReaderPrefsPanel prefs={prefs} onClose={() => setShowPrefs(false)} />
      )}

      {/* the book */}
      <div
        ref={stageRef}
        className="absolute inset-x-3 top-[calc(var(--nav-h)+0.75rem)] bottom-28 grid place-items-center sm:inset-x-8"
      >
        {layout ? (
          <BookView
            key={layout.key}
            layout={layout}
            type={type}
            book={book}
            chapter={chapter}
            modernLevel={hasModern ? modernLevel : null}
            level={prefs.level}
            initialPara={initialPara}
            onAnchor={setAnchor}
            prevHref={prevHref}
            nextHref={nextHref}
          />
        ) : (
          <p className="font-display text-muted animate-pulse text-2xl italic">
            Opening the book…
          </p>
        )}
      </div>

      {/* dock */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-3">
        <div className="glass pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-full py-2 pr-3 pl-3 shadow-2xl sm:gap-5 sm:pr-4 sm:pl-5">
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
          {hasModern ? (
            <LevelSlider
              compact
              hideOriginal
              value={modernLevel}
              available={available}
              onChange={(l) => updatePrefs({ level: l })}
              className="min-w-0 flex-1"
            />
          ) : (
            <p className="text-faint min-w-0 flex-1 text-center text-xs">
              The modern version of this chapter is still being written.
            </p>
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
    </div>
  );
}

/* ====================================================================== */

type ViewProps = {
  layout: BookLayout;
  type: BookType;
  book: Props["book"];
  chapter: Chapter;
  modernLevel: 1 | 2 | 3 | null;
  level: Level;
  initialPara: number;
  onAnchor: (para: number) => void;
  prevHref: string | null;
  nextHref: string | null;
};

type Zone = "prev" | "next" | null;

function BookView({
  layout,
  type,
  book,
  chapter,
  modernLevel,
  level,
  initialPara,
  onAnchor,
  prevHref,
  nextHref,
}: ViewProps) {
  const router = useRouter();
  const { views, geometry, aligned } = layout;
  const [index, setIndex] = useState(() => viewForPara(views, initialPara));
  const [side, setSide] = useState<"orig" | "modern">("modern");
  const [hover, setHover] = useState<Zone>(null);
  /** The page turn in progress: its direction and the view it started from. */
  const [flip, setFlip] = useState<{ dir: 1 | -1; from: number } | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const counted = useRef(new Set<string>());
  const view = views[index] ?? views[0];

  const go = useCallback(
    (delta: 1 | -1) => {
      const next = index + delta;
      if (next >= views.length) {
        if (nextHref) router.push(nextHref);
        return;
      }
      if (next < 0) {
        if (prevHref) {
          try {
            sessionStorage.setItem(OPEN_AT_END, "1");
          } catch {
            /* storage unavailable */
          }
          router.push(prevHref);
        }
        return;
      }
      setFlip({ dir: delta, from: index });
      setIndex(next);
      onAnchor(views[next].first);
    },
    [index, views, nextHref, prevHref, router, onAnchor],
  );

  // Keyboard: arrows and page keys turn pages.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      // Space activates a focused button or link, so leave it alone there; arrows still turn pages.
      if (e.key === " " && t && ["BUTTON", "A"].includes(t.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (
        e.key === "ArrowRight" ||
        e.key === "PageDown" ||
        (e.key === " " && !e.shiftKey)
      ) {
        e.preventDefault();
        go(1);
      } else if (
        e.key === "ArrowLeft" ||
        e.key === "PageUp" ||
        (e.key === " " && e.shiftKey)
      ) {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // Remember the place and count the reading once a page has been on screen for a moment.
  useEffect(() => {
    if (!view) return;
    const timer = setTimeout(() => {
      saveProgress(book.slug, { chapter: chapter.idx, paragraph: view.first, level });
      const pages = aligned ? [view.pages[0]] : view.pages;
      for (const page of pages)
        for (const piece of page) {
          const key = `${piece.para}:${piece.text.length}`;
          if (counted.current.has(key)) continue;
          counted.current.add(key);
          recordReading(piece.text);
        }
    }, 900);
    return () => clearTimeout(timer);
  }, [view, aligned, book.slug, chapter.idx, level]);

  if (!view) {
    return <p className="text-muted">This chapter has no text yet.</p>;
  }

  const origLabel = (
    <span className="eyebrow label-original">{LEVEL_LABELS[0]} version</span>
  );
  const modernLabel = modernLevel ? (
    <span className="eyebrow label-modern">{LEVEL_LABELS[modernLevel]} version</span>
  ) : null;

  const pageNo = (n: number) => (n <= layout.totalPages ? n : null);
  const status = geometry.phone
    ? `Page ${index + 1} of ${views.length}`
    : `Pages ${index * 2 + 1}${view.pages.length > 1 ? `–${index * 2 + 2}` : ""} of ${layout.totalPages}`;

  const zoneOf = (
    e: MouseEvent<HTMLElement>,
    position: "left" | "right" | "single",
  ): Zone => {
    const r = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - r.left) / r.width;
    if (position === "left") return rel < 0.34 ? "prev" : null;
    if (position === "right") return rel > 0.66 ? "next" : null;
    return rel < 0.3 ? "prev" : rel > 0.7 ? "next" : null;
  };
  const onPageClick = (
    e: MouseEvent<HTMLElement>,
    position: "left" | "right" | "single",
  ) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    if (!window.getSelection()?.isCollapsed) return;
    const zone = zoneOf(e, position);
    if (zone === "next") go(1);
    else if (zone === "prev") go(-1);
  };

  const makePage = (
    vi: number,
    pieces: Piece[],
    position: "left" | "right" | "single",
    head: ReactNode,
    number: number | null,
    title: ReactNode,
    live = true,
  ) => (
    <BookPage
      pieces={pieces}
      geometry={geometry}
      type={type}
      position={position}
      head={head}
      number={number}
      title={vi === 0 ? title : null}
      hover={live ? hover : null}
      onMove={(e) => live && setHover(zoneOf(e, position))}
      onLeave={() => live && setHover(null)}
      onClick={(e) => live && onPageClick(e, position)}
    />
  );

  /** One page of the open spread `vi`, as it is printed. */
  const spreadPage = (vi: number, position: "left" | "right", live = true) => {
    const v = views[vi];
    const left = position === "left";
    const head = left
      ? aligned
        ? origLabel
        : <span className="eyebrow">{book.title}</span>
      : v.pages[1] || aligned
        ? aligned
          ? modernLabel
          : <span className="eyebrow">{chapter.title}</span>
        : null;
    return makePage(
      vi,
      v.pages[left ? 0 : 1] ?? [],
      position,
      head,
      left ? pageNo(vi * 2 + 1) : v.pages[1] ? pageNo(vi * 2 + 2) : null,
      left ? titleBlock(false) : aligned ? titleBlock(true) : null,
      live,
    );
  };

  const titleBlock = (right: boolean) => (
    <div
      style={{ height: geometry.titleReserve }}
      className="overflow-hidden text-center"
    >
      {right ? (
        <>
          <div className="eyebrow mb-3" aria-hidden>
            ❦
          </div>
          <div className="text-faint text-sm italic">{chapter.title}</div>
        </>
      ) : (
        <>
          <div className="eyebrow mb-3">{book.authorName}</div>
          <h1
            className="font-display leading-tight tracking-tight"
            style={{ fontSize: "1.55em" }}
          >
            {chapter.title}
          </h1>
        </>
      )}
    </div>
  );

  let body: ReactNode;
  if (geometry.phone) {
    const showOrig = !aligned || side === "orig";
    const pieces = aligned ? view.pages[showOrig ? 0 : 1] : view.pages[0];
    const head = aligned ? (
      <div
        className="flex items-center justify-center gap-1"
        role="group"
        aria-label="Version"
      >
        {(["orig", "modern"] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={side === s}
            onClick={() => setSide(s)}
            className={cn(
              "rounded-full px-3 py-1 text-[0.7rem] tracking-wide transition-colors",
              side === s ? "bg-ink text-bg" : "text-muted",
            )}
          >
            {s === "orig"
              ? "Original"
              : modernLevel
                ? LEVEL_LABELS[modernLevel]
                : "Modern"}
          </button>
        ))}
      </div>
    ) : (
      <span className="eyebrow">{book.title}</span>
    );
    body = (
      <div
        key={index}
        className={flip ? (flip.dir > 0 ? "turn-next" : "turn-prev") : undefined}
        onAnimationEnd={() => setFlip(null)}
      >
        {makePage(index, pieces, "single", head, pageNo(index + 1), titleBlock(false))}
      </div>
    );
  } else {
    // While a leaf is turning, each half still shows what is under it.
    const leftIdx = flip && flip.dir > 0 ? flip.from : index;
    const rightIdx = flip && flip.dir < 0 ? flip.from : index;
    const leaf = flip && views[flip.from] && (
      <div
        key={`${flip.from}-${index}`}
        aria-hidden
        className={cn("book-leaf", flip.dir > 0 ? "book-leaf-next" : "book-leaf-prev")}
        style={{ width: geometry.pageW, height: geometry.pageH }}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) setFlip(null);
        }}
      >
        <div className="book-leaf-face">
          {spreadPage(flip.from, flip.dir > 0 ? "right" : "left", false)}
          <span className="book-leaf-shade" />
        </div>
        <div className="book-leaf-face book-leaf-back">
          {spreadPage(index, flip.dir > 0 ? "left" : "right", false)}
          <span className="book-leaf-shade" />
        </div>
      </div>
    );
    body = (
      <div
        className="relative flex"
        style={{
          width: geometry.pageW * 2,
          height: geometry.pageH,
          perspective: geometry.pageW * 6,
        }}
      >
        {spreadPage(leftIdx, "left")}
        {spreadPage(rightIdx, "right")}
        {leaf}
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-roledescription="book"
      aria-label={`${chapter.title}, ${book.title}`}
      className="select-text"
      onTouchStart={(e) => {
        touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        const start = touch.current;
        touch.current = null;
        if (!start) return;
        const dx = e.changedTouches[0].clientX - start.x;
        const dy = e.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) > 50 && Math.abs(dy) < 60) go(dx < 0 ? 1 : -1);
      }}
    >
      {body}
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>
      <div className="sr-only">
        <button type="button" onClick={() => go(-1)}>
          Previous page
        </button>
        <button type="button" onClick={() => go(1)}>
          Next page
        </button>
      </div>
    </div>
  );
}

/* ====================================================================== */

function BookPage({
  pieces,
  geometry: g,
  type,
  position,
  head,
  number,
  title,
  hover,
  onMove,
  onLeave,
  onClick,
}: {
  pieces: Piece[];
  geometry: BookGeometry;
  type: BookType;
  position: "left" | "right" | "single";
  head: ReactNode;
  number: number | null;
  title: ReactNode;
  hover: Zone;
  onMove: (e: MouseEvent<HTMLElement>) => void;
  onLeave: () => void;
  onClick: (e: MouseEvent<HTMLElement>) => void;
}) {
  const edge = position === "left" ? "prev" : position === "right" ? "next" : null;
  return (
    <div
      className={cn(
        "book-page relative shrink-0",
        position === "left" && "book-page-left",
        position === "right" && "book-page-right",
        position === "single" && "book-page-single",
        hover && (edge === hover || position === "single") && "cursor-pointer",
      )}
      style={{ width: g.pageW, height: g.pageH }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <div
        className="text-faint absolute inset-x-0 top-4 flex justify-center"
        style={{ paddingInline: g.padX }}
      >
        {head}
      </div>

      <div
        lang="en"
        className={cn(
          "book-text absolute",
          type.family === "serif" ? "font-reading" : "font-sans",
        )}
        style={{
          left: g.padX,
          top: g.padTop,
          width: g.textW,
          height: g.textH,
          fontSize: type.fontSize,
          lineHeight: type.lineHeight,
          overflow: "hidden",
        }}
      >
        {title}
        {pieces.map((p, i) => (
          <p
            key={`${p.para}-${i}`}
            data-p={p.para}
            style={{ textIndent: p.start ? "1.4em" : 0 }}
          >
            {p.text}
          </p>
        ))}
      </div>

      {number !== null && (
        <p
          className="text-faint absolute inset-x-0 bottom-4 text-center text-xs tabular-nums"
          aria-hidden
        >
          {number}
        </p>
      )}

      {/* edge hints */}
      {hover === "prev" && (position === "left" || position === "single") && (
        <span aria-hidden className="book-edge book-edge-prev">
          ‹
        </span>
      )}
      {hover === "next" && (position === "right" || position === "single") && (
        <span aria-hidden className="book-edge book-edge-next">
          ›
        </span>
      )}
    </div>
  );
}
