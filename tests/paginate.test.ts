import { describe, expect, it } from "vitest";
import { paginate, toViews, viewForPara, type Chunk } from "@/lib/reader/paginate";

const LH = 20;
const CHARS = 40;
/** A fake typesetter: fixed-width characters, so heights are predictable. */
const measure = (text: string) => Math.max(1, Math.ceil(text.length / CHARS)) * LH;

const run = (columns: string[][], lines = 10, firstLines = lines) =>
  paginate({
    columns,
    capacity: (n) => (n === 0 ? firstLines : lines) * LH,
    lineHeight: LH,
    measure,
  });

const sentence = (n: number) => `Sentence number ${n} ends here.`;
const para = (sentences: number, offset = 0) =>
  Array.from({ length: sentences }, (_, i) => sentence(offset + i)).join(" ");

const textOf = (chunks: Chunk[], col: number) =>
  chunks
    .flatMap((c) => c[col])
    .map((p) => p.text)
    .join(" ");

const height = (page: Chunk[number]) => page.reduce((s, p) => s + measure(p.text), 0);

describe("paginate", () => {
  it("puts a short chapter on one page", () => {
    const chunks = run([["One short paragraph.", "Another one."]]);
    expect(chunks).toHaveLength(1);
    expect(chunks[0][0]).toHaveLength(2);
  });

  it("never loses or duplicates text", () => {
    const original = Array.from({ length: 12 }, (_, i) => para(4 + (i % 5), i * 10));
    const modern = Array.from({ length: 12 }, (_, i) => para(3 + (i % 4), i * 10));
    const chunks = run([original, modern]);
    expect(textOf(chunks, 0).replace(/\s+/g, " ")).toBe(original.join(" "));
    expect(textOf(chunks, 1).replace(/\s+/g, " ")).toBe(modern.join(" "));
  });

  it("keeps every page within its capacity", () => {
    const original = Array.from({ length: 20 }, (_, i) => para(5, i * 7));
    const modern = Array.from({ length: 20 }, (_, i) => para(4, i * 7));
    const chunks = run([original, modern], 8);
    for (const chunk of chunks)
      for (const page of chunk) expect(height(page)).toBeLessThanOrEqual(8 * LH);
  });

  it("keeps the two versions of a passage on the same spread", () => {
    const original = Array.from({ length: 10 }, (_, i) => para(3, i * 5));
    const modern = Array.from({ length: 10 }, (_, i) => para(2, i * 5));
    const chunks = run([original, modern], 6);
    const paras = (page: Chunk[number]) => new Set(page.map((p) => p.para));
    for (const chunk of chunks) {
      const a = [...paras(chunk[0])];
      const b = [...paras(chunk[1])];
      // Each side covers the same paragraphs (a split paragraph may reach one side only at the edge).
      expect(Math.abs(Math.min(...a) - Math.min(...b))).toBeLessThanOrEqual(1);
      expect(Math.abs(Math.max(...a) - Math.max(...b))).toBeLessThanOrEqual(1);
    }
  });

  it("splits a paragraph longer than a page across pages, indenting only its start", () => {
    const chunks = run([[para(40)]], 5);
    expect(chunks.length).toBeGreaterThan(2);
    const pieces = chunks.flatMap((c) => c[0]);
    expect(pieces[0].start).toBe(true);
    expect(pieces.slice(1).every((p) => !p.start)).toBe(true);
    expect(pieces.every((p) => p.para === 0)).toBe(true);
  });

  it("ends split pages on a sentence when it can", () => {
    const chunks = run([[para(40)]], 5);
    const pieces = chunks.flatMap((c) => c[0]);
    for (const p of pieces.slice(0, -1)) expect(p.text).toMatch(/\.$/);
  });

  it("breaks both versions on sentence ends, at matching points", () => {
    const chunks = run([[para(30)], [para(18)]], 5);
    expect(chunks.length).toBeGreaterThan(2);
    for (const chunk of chunks.slice(0, -1)) {
      for (const page of chunk) expect(page[page.length - 1].text).toMatch(/\.$/);
    }
    // The share of each paragraph shown so far should stay close between the two sides.
    let a = 0;
    let b = 0;
    for (const chunk of chunks.slice(0, -1)) {
      a += chunk[0].reduce((n, p) => n + p.text.split(" ").length, 0);
      b += chunk[1].reduce((n, p) => n + p.text.split(" ").length, 0);
      expect(Math.abs(a / (30 * 5) - b / (18 * 5))).toBeLessThan(0.2);
    }
  });

  it("uses a shorter first page for the chapter heading", () => {
    const original = Array.from({ length: 6 }, (_, i) => para(3, i * 4));
    const chunks = run([original], 10, 4);
    expect(height(chunks[0][0])).toBeLessThanOrEqual(4 * LH);
  });

  it("always makes progress, even when a page cannot hold a line", () => {
    const chunks = paginate({
      columns: [["alpha beta gamma delta epsilon zeta eta theta"]],
      capacity: () => LH / 2,
      lineHeight: LH,
      measure,
    });
    expect(textOf(chunks, 0).replace(/\s+/g, " ")).toBe(
      "alpha beta gamma delta epsilon zeta eta theta",
    );
  });

  it("handles an empty chapter", () => {
    expect(run([[]])).toEqual([]);
  });
});

describe("views", () => {
  const original = Array.from({ length: 9 }, (_, i) => para(4, i * 6));

  it("pairs consecutive pages into spreads for a single flowing version", () => {
    const chunks = run([original], 6);
    const spreads = toViews(chunks, 1, 2);
    expect(spreads).toHaveLength(Math.ceil(chunks.length / 2));
    expect(spreads[0].pages).toHaveLength(2);
  });

  it("shows one page at a time for a single version on a phone", () => {
    const chunks = run([original], 6);
    expect(toViews(chunks, 1, 1)).toHaveLength(chunks.length);
  });

  it("keeps one view per chunk for aligned versions", () => {
    const chunks = run([original, original], 6);
    expect(toViews(chunks, 2, 2)).toHaveLength(chunks.length);
  });

  it("finds the view for a paragraph, or the last one", () => {
    const views = toViews(run([original], 6), 1, 2);
    const mid = viewForPara(views, 4);
    expect(views[mid].first).toBeLessThanOrEqual(4);
    expect(views[mid].last).toBeGreaterThanOrEqual(4);
    expect(viewForPara(views, Infinity)).toBe(views.length - 1);
    expect(viewForPara([], 3)).toBe(0);
  });
});
