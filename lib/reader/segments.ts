/**
 * Splits paragraph text into plain and marked segments (highlights, glossary
 * terms). Highlights win over glossary terms when they overlap.
 */
export type Mark =
  | { kind: "highlight"; start: number; end: number; id: string; color: string; hasNote: boolean }
  | { kind: "gloss"; start: number; end: number; term: string };

export type Segment =
  | { type: "text"; text: string }
  | { type: "mark"; text: string; mark: Mark };

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Finds glossary terms as whole words/phrases, case-insensitively. */
export function findGlossMarks(text: string, terms: string[]): Mark[] {
  const marks: Mark[] = [];
  const sorted = [...new Set(terms)].filter(Boolean).sort((a, b) => b.length - a.length);
  for (const term of sorted) {
    const re = new RegExp(String.raw`(?<![\p{L}\p{N}])${escapeRe(term)}(?![\p{L}\p{N}])`, "giu");
    for (const m of text.matchAll(re)) {
      marks.push({ kind: "gloss", start: m.index!, end: m.index! + m[0].length, term });
    }
  }
  return marks;
}

/** Locates a stored highlight quote inside the text currently on screen. */
export function findHighlightMark(
  text: string,
  h: { id: string; text: string; color: string; note?: string },
): Mark | null {
  if (!h.text) return null;
  const i = text.indexOf(h.text);
  if (i < 0) return null;
  return { kind: "highlight", start: i, end: i + h.text.length, id: h.id, color: h.color, hasNote: Boolean(h.note) };
}

export function buildSegments(text: string, marks: Mark[]): Segment[] {
  const ordered = [...marks].sort(
    (a, b) =>
      a.start - b.start ||
      (a.kind === "highlight" ? -1 : 1) - (b.kind === "highlight" ? -1 : 1) ||
      b.end - a.end,
  );

  const kept: Mark[] = [];
  for (const m of ordered) {
    const overlaps = kept.some((k) => m.start < k.end && m.end > k.start);
    if (!overlaps) kept.push(m);
  }
  kept.sort((a, b) => a.start - b.start);

  const out: Segment[] = [];
  let cursor = 0;
  for (const m of kept) {
    if (m.start > cursor) out.push({ type: "text", text: text.slice(cursor, m.start) });
    out.push({ type: "mark", text: text.slice(m.start, m.end), mark: m });
    cursor = m.end;
  }
  if (cursor < text.length) out.push({ type: "text", text: text.slice(cursor) });
  return out;
}
