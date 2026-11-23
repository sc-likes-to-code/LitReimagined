/**
 * Cuts a chapter into book pages.
 *
 * `columns` holds one list of paragraphs per version shown side by side (original and
 * modern). The lists line up paragraph by paragraph. Every chunk returned holds one page
 * per column covering the same stretch of text, so the left and right pages always show
 * the same passage. Paragraphs may continue onto the next chunk, like in a printed book.
 *
 * Measuring text is left to the caller (`measure`), so this module has no DOM dependency
 * and can be tested directly.
 */

export type Piece = {
  /** Index of the paragraph this text belongs to. */
  para: number;
  text: string;
  /** First piece of its paragraph (gets the first-line indent). */
  start: boolean;
};

/** One page per column. */
export type Chunk = Piece[][];

export type PaginateOptions = {
  columns: string[][];
  /** Text height available in chunk number `n` (the first chunk is usually shorter). */
  capacity: (chunk: number) => number;
  /** Height of one line, used to avoid stranding a single line at a page edge. */
  lineHeight: number;
  /** Height of `text` set as a paragraph in a page-wide column. */
  measure: (text: string, indent: boolean) => number;
};

const SENTENCE_END = /[.!?…]["”’')\]]*$/;
/** Never leave fewer words than this at the start of the next page. */
const MIN_TAIL_WORDS = 5;

const words = (text: string) => text.split(/\s+/).filter(Boolean);

/** Word counts at which a sentence ends (never the very end of the paragraph). */
function sentenceBounds(w: string[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < w.length; i++) if (SENTENCE_END.test(w[i - 1])) out.push(i);
  return out;
}

/** Pulls a cut point back to the end of a sentence when one is nearby. */
function snapToSentence(w: string[], k: number): number {
  const floor = Math.max(1, k - Math.floor(k * 0.35));
  for (let i = k; i >= floor; i--) if (SENTENCE_END.test(w[i - 1])) return i;
  return k;
}

/** Word counts to put on the current page for each column, or null when nothing useful fits. */
function findSplit(
  rest: string[][],
  room: number[],
  start: boolean,
  o: PaginateOptions,
): number[] | null {
  const fit = (f: number) =>
    rest.map((w) =>
      w.length === 0 ? 0 : Math.min(w.length - 1, Math.round(f * w.length)),
    );
  const heights = (ks: number[]) =>
    ks.map((k, c) => (k === 0 ? 0 : o.measure(rest[c].slice(0, k).join(" "), start)));
  const fits = (f: number) => heights(fit(f)).every((h, c) => h <= room[c]);

  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) lo = mid;
    else hi = mid;
  }

  // Words that fit on this page in each column, always leaving a few for the next page.
  const base = fit(lo).map((k, c) =>
    Math.min(k, Math.max(0, rest[c].length - MIN_TAIL_WORDS)),
  );
  const active = rest.map((w, c) => c).filter((c) => rest[c].length > 0);
  const bounds = rest.map((w, c) => sentenceBounds(w).filter((b) => b <= base[c]));

  let ks: number[];
  if (active.length > 0 && active.every((c) => bounds[c].length > 0)) {
    // End every column on a sentence, at the same relative point in the paragraph.
    const f = Math.min(
      ...active.map((c) => bounds[c][bounds[c].length - 1] / rest[c].length),
    );
    ks = rest.map((w, c) => {
      if (w.length === 0) return 0;
      const ok = bounds[c].filter((b) => b / w.length <= f + 1e-9);
      return ok.length ? ok[ok.length - 1] : bounds[c][0];
    });
  } else {
    ks = base.map((k, c) => (k > 0 ? snapToSentence(rest[c], k) : 0));
  }

  // Not worth a split if no column gets at least two lines.
  const best = Math.max(...heights(ks));
  return best >= o.lineHeight * 2 ? ks : null;
}

export function paginate(o: PaginateOptions): Chunk[] {
  const cols = o.columns.length;
  const total = o.columns[0]?.length ?? 0;
  const chunks: Chunk[] = [];

  let page: Piece[][] = Array.from({ length: cols }, () => []);
  let used: number[] = Array(cols).fill(0);
  let cap = o.capacity(0);

  const isEmpty = () => page.every((p) => p.length === 0);
  const flush = () => {
    if (isEmpty()) return;
    chunks.push(page);
    page = Array.from({ length: cols }, () => []);
    used = Array(cols).fill(0);
    cap = o.capacity(chunks.length);
  };
  const put = (c: number, piece: Piece, height: number) => {
    page[c].push(piece);
    used[c] += height;
  };

  for (let p = 0; p < total; p++) {
    let rest = o.columns.map((c) => c[p] ?? "");
    let start = true;

    while (rest.some((r) => r.length > 0)) {
      const heights = rest.map((r) => (r ? o.measure(r, start) : 0));
      if (heights.every((h, c) => used[c] + h <= cap)) {
        rest.forEach((r, c) => r && put(c, { para: p, text: r, start }, heights[c]));
        break;
      }

      const w = rest.map(words);
      const room = used.map((u) => cap - u);
      let ks = findSplit(w, room, start, o);

      if (!ks) {
        if (!isEmpty()) {
          flush();
          continue;
        }
        // A brand-new page that still cannot hold two lines: force progress.
        ks = w.map((x) => (x.length > 1 ? 1 : 0));
        if (ks.every((k) => k === 0)) {
          rest.forEach((r, c) => r && put(c, { para: p, text: r, start }, heights[c]));
          break;
        }
      }

      const next: string[] = [];
      ks.forEach((k, c) => {
        if (k > 0) {
          const text = w[c].slice(0, k).join(" ");
          put(c, { para: p, text, start }, o.measure(text, start));
        }
        next.push(w[c].slice(k).join(" "));
      });
      rest = next;
      start = false;
      flush();
    }
  }
  flush();
  return chunks;
}

/** First and last paragraph index shown on a set of pages. */
export function paraRange(pages: Piece[][]): { first: number; last: number } {
  let first = Infinity;
  let last = -1;
  for (const page of pages)
    for (const piece of page) {
      first = Math.min(first, piece.para);
      last = Math.max(last, piece.para);
    }
  return { first: first === Infinity ? 0 : first, last: Math.max(last, 0) };
}

export type BookView = {
  /** One or two pages shown at once; each is a list of pieces. */
  pages: Piece[][];
  first: number;
  last: number;
};

/**
 * Groups chunks into what the reader sees at once.
 * - Aligned versions (two columns): a view is one chunk, with both versions as its pages.
 * - A single version flowing on: two consecutive chunks make a spread (or one on a phone).
 */
export function toViews(chunks: Chunk[], columns: number, perView: 1 | 2): BookView[] {
  if (columns > 1) {
    return chunks.map((c) => ({ pages: c, ...paraRange(c) }));
  }
  const views: BookView[] = [];
  for (let i = 0; i < chunks.length; i += perView) {
    const pages = chunks.slice(i, i + perView).map((c) => c[0]);
    views.push({ pages, ...paraRange(pages) });
  }
  return views;
}

/** Index of the first view that shows paragraph `para` (or the last view when it is Infinity). */
export function viewForPara(views: BookView[], para: number): number {
  if (views.length === 0) return 0;
  if (!Number.isFinite(para)) return views.length - 1;
  const i = views.findIndex((v) => para >= v.first && para <= v.last);
  if (i >= 0) return i;
  const after = views.findIndex((v) => v.first > para);
  return after === -1 ? views.length - 1 : Math.max(0, after - 1);
}
