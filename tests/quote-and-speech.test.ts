import { describe, expect, it } from "vitest";
import { speechChunks } from "@/lib/client/read-aloud";
import { prepareQuote, wrapLines } from "@/lib/reader/quote-card";

describe("speechChunks", () => {
  it("keeps short text in one piece", () => {
    expect(speechChunks("Call me Ishmael.")).toEqual(["Call me Ishmael."]);
  });

  it("splits long paragraphs on sentence ends without losing words", () => {
    const text = Array.from({ length: 12 }, (_, i) => `This is sentence number ${i} of the paragraph.`).join(" ");
    const parts = speechChunks(text, 120);
    expect(parts.length).toBeGreaterThan(2);
    expect(parts.every((p) => p.length <= 160)).toBe(true);
    expect(parts.join(" ").replace(/\s+/g, " ")).toBe(text);
  });

  it("handles text with no punctuation", () => {
    expect(speechChunks("no punctuation here at all")).toEqual(["no punctuation here at all"]);
  });
});

describe("prepareQuote", () => {
  it("collapses whitespace", () => {
    expect(prepareQuote("  a   b\n c ")).toBe("a b c");
  });

  it("trims overlong quotes at a word boundary with an ellipsis", () => {
    const out = prepareQuote("word ".repeat(300), 100);
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(101);
    expect(out).not.toMatch(/wor…$/);
  });
});

describe("wrapLines", () => {
  it("wraps by measured width", () => {
    const ctx = { measureText: (s: string) => ({ width: s.length * 10 }) } as CanvasRenderingContext2D;
    expect(wrapLines(ctx, "aaa bbb ccc ddd", 75)).toEqual(["aaa bbb", "ccc ddd"]);
  });
});
