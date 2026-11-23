import type { BookSource } from "../config/books";

export type ParsedChapter = {
  idx: number;
  title: string;
  paragraphs: string[];
  wordCount: number;
};

const roman: Record<string, number> = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000,
};
export function romanToInt(s: string): number {
  let total = 0;
  const up = s.toUpperCase();
  for (let i = 0; i < up.length; i++) {
    const v = roman[up[i]] ?? 0;
    const next = roman[up[i + 1]] ?? 0;
    total += v < next ? -v : v;
  }
  return total;
}

/** Removes the Project Gutenberg licence header and footer. */
export function stripBoilerplate(raw: string): string {
  const text = raw.replace(/\r\n?/g, "\n");
  const start = /\*\*\* ?START OF (?:THE |THIS )?PROJECT GUTENBERG[^\n]*\n/i.exec(text);
  const end = /\*\*\* ?END OF (?:THE |THIS )?PROJECT GUTENBERG/i.exec(text);
  const from = start ? start.index + start[0].length : 0;
  const to = end ? end.index : text.length;
  return text.slice(from, to);
}

/**
 * Removes illustration placeholders, including multi-paragraph ones such as
 * "[Illustration:

“Caption”

[Copyright 1894 by George Allen.]]" from illustrated editions.
 */
export function stripIllustrations(text: string): string {
  return (
    text
      // A few editions wrap the chapter heading inside the illustration; keep the heading.
      .replace(/\[Illustration:[^\]]*?\n\s*\n\s*(Chapter\s+[IVXLC]+\.?)\]/gi, "$1")
      .replace(/\[Illustration:?[\s\S]*?(?:\[_?Copyright[^\]]*\]\]|\])/g, "")
      .replace(/\[_?Copyright[^\]]*\]\]?/g, "")
  );
}

/** Light cleanup of Gutenberg markup into reader-friendly text. */
export function cleanParagraph(p: string): string {
  return p
    .replace(/\[Illustration[^\]]*\]/gi, "")
    .replace(/\[Footnote[^\]]*\]/gi, "")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/\s*\n\s*/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function splitParagraphs(block: string): string[] {
  return block
    .split(/\n\s*\n/)
    .map(cleanParagraph)
    .filter(
      (p) =>
        p.length > 0 &&
        !/^[IVXLC]{1,6}\.?$/.test(p) &&
        // Publisher advertisements and stray brackets left by scanned editions.
        !/Popular Copyrighted Fiction|^\]$/.test(p),
    );
}

const words = (paras: string[]) => paras.join(" ").split(/\s+/).filter(Boolean).length;

/** Title cleanup: strip markup and tame SHOUTING headings. */
export function cleanTitle(t: string): string {
  let out = t
    .replace(/_/g, "")
    .replace(/--+/g, "—")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.\]]+$/, "");
  const letters = out.replace(/[^A-Za-z]/g, "");
  const upper = out.replace(/[^A-Z]/g, "");
  if (letters.length > 3 && upper.length / letters.length > 0.6) {
    out = out
      .toLowerCase()
      .replace(
        /(^|[\s—:(-])([a-zà-ÿ])/g,
        (_, a: string, b: string) => a + b.toUpperCase(),
      )
      .replace(/\b(Of|The|And|In|On|At|To|A|An|For|With)\b(?!$)/g, (w) => w.toLowerCase())
      .replace(/’S\b/g, "’s");
  }
  return out;
}

/** Splits a book into chapters using the per-book heading rules. */
export function parseChapters(raw: string, src: BookSource): ParsedChapter[] {
  let text = stripIllustrations(stripBoilerplate(raw));

  if (src.startAfter) {
    const re = new RegExp(
      src.startAfter.source,
      src.startAfter.flags.replace("g", "") + "gm",
    );
    const all = [...text.matchAll(re)];
    const m = src.startAtLast ? all[all.length - 1] : all[0];
    // Keep the matching line itself so the first chapter is detected.
    if (m?.index !== undefined) text = text.slice(m.index);
  }
  const lines = text.split("\n");

  type Draft = { title: string; lines: string[] };
  const drafts: Draft[] = [];
  let current: Draft | null = null;
  let partNum: number | string = "";
  const partLabel = src.partLabel ?? "Part";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (src.stopAt?.test(line) && drafts.length > 0) break;

    // Named single sections such as "Epilogue".
    const extra = src.extra?.find((e) => e.pattern.test(line));
    if (extra) {
      current = { title: extra.title, lines: [] };
      drafts.push(current);
      continue;
    }

    if (src.part) {
      const pm = src.part.exec(line);
      if (pm) {
        partNum = pm[1] ? romanToInt(pm[1]) || pm[1] : cleanTitle(pm[0]);
        current = null;
        continue;
      }
    }

    const hm = src.heading.exec(line);
    if (hm) {
      const num = hm[1] ?? "";
      const n = /^\d+$/.test(num) ? Number(num) : romanToInt(num) || num;
      const label = src.label ? `${src.label} ${n}` : cleanTitle(num);
      let title = label;
      let consumed = i;

      if (src.makeTitle) {
        title = src.makeTitle({ part: partNum, match: hm });
      } else if (src.title === "same-line") {
        const rest = (hm[2] ?? "").trim();
        title = rest ? `${label}: ${cleanTitle(rest)}` : label;
      } else if (src.title === "next-line") {
        let j = i + 1;
        while (j < Math.min(lines.length, i + 6) && lines[j].trim() === "") j++;
        const next = lines[j]?.trim();
        if (next && !src.heading.test(next) && next.length < 90) {
          title = `${label}: ${cleanTitle(next)}`;
          consumed = j;
        }
      }
      if (partNum !== "" && !src.makeTitle && typeof partNum === "number")
        title = `${partLabel} ${partNum}, ${title}`;
      else if (partNum !== "" && !src.makeTitle) title = `${partNum}, ${title}`;

      current = { title: cleanTitle(title).replace(/^(.+?): $/, "$1"), lines: [] };
      drafts.push(current);
      i = consumed;
      continue;
    }
    current?.lines.push(line);
  }

  const min = src.minWords ?? 50;
  const chapters: ParsedChapter[] = [];
  for (const d of drafts) {
    let paragraphs = splitParagraphs(d.lines.join("\n"));
    if (
      src.dropCapsLead &&
      paragraphs[0] &&
      paragraphs[0] === paragraphs[0].toUpperCase() &&
      /[A-Z]/.test(paragraphs[0])
    ) {
      paragraphs = paragraphs.slice(1);
    }
    const wordCount = words(paragraphs);
    if (wordCount < min) continue;
    chapters.push({ idx: chapters.length + 1, title: d.title, paragraphs, wordCount });
  }
  return chapters;
}

const CACHE_DIR = ".cache/gutenberg";

/** Downloads a book's plain text, trying several mirrors and caching the result on disk. */
export async function downloadBook(id: number): Promise<string> {
  const { mkdir, readFile, writeFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const dir = join(process.cwd(), "scripts", CACHE_DIR);
  const file = join(dir, `${id}.txt`);
  try {
    return await readFile(file, "utf8");
  } catch {
    /* not cached yet */
  }

  const digits = String(id).slice(0, -1).split("").join("/") || "0";
  const urls = [
    `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
    `https://gutenberg.pglaf.org/cache/epub/${id}/pg${id}.txt`,
    `https://gutenberg.pglaf.org/${digits}/${id}/${id}-0.txt`,
    `https://www.gutenberg.org/files/${id}/${id}-0.txt`,
  ];
  let lastErr: unknown;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (content pipeline)" },
      });
      const text = res.ok ? await res.text() : "";
      if (res.ok && text.includes("PROJECT GUTENBERG")) {
        await mkdir(dir, { recursive: true });
        await writeFile(file, text, "utf8");
        return text;
      }
      lastErr = new Error(`${res.status} ${url}`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(`Could not download Gutenberg #${id}: ${String(lastErr)}`);
}
