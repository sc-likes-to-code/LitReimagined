import { describe, expect, it } from "vitest";
import { buildSegments, findGlossMarks, findHighlightMark } from "@/lib/reader/segments";

describe("reader segments", () => {
  it("finds whole-word glossary terms case-insensitively", () => {
    const marks = findGlossMarks("Netherfield is Let at last, but letter is a different word.", ["let"]);
    expect(marks.map((m) => m.start)).toEqual([15]);
  });

  it("prefers longer phrases and never splits words", () => {
    const text = "He is in want of a wife and wants more.";
    const marks = findGlossMarks(text, ["want", "in want of"]);
    const segs = buildSegments(text, marks);
    const marked = segs.filter((s) => s.type === "mark").map((s) => s.text);
    expect(marked).toEqual(["in want of"]);
  });

  it("lets highlights win over overlapping glossary terms", () => {
    const text = "A truth universally acknowledged.";
    const gloss = findGlossMarks(text, ["universally"]);
    const hl = findHighlightMark(text, { id: "1", text: "truth universally", color: "ember" })!;
    const segs = buildSegments(text, [...gloss, hl]);
    expect(segs.filter((s) => s.type === "mark")).toHaveLength(1);
    expect(segs.map((s) => s.text).join("")).toBe(text);
  });

  it("returns null when a highlight quote is not in the current text", () => {
    expect(findHighlightMark("Everyone knows.", { id: "1", text: "universally", color: "ember" })).toBeNull();
  });

  it("round-trips the original text", () => {
    const text = "Alpha beta gamma delta.";
    const marks = findGlossMarks(text, ["beta", "delta"]);
    expect(buildSegments(text, marks).map((s) => s.text).join("")).toBe(text);
  });
});
