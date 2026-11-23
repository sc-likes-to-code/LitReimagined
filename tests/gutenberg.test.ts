import { describe, expect, it } from "vitest";
import { BOOK_SOURCES, type BookSource } from "../scripts/config/books";
import { cleanTitle, parseChapters, romanToInt, stripBoilerplate } from "../scripts/lib/gutenberg";

const lorem = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");
const wrap = (body: string) =>
  `Header\n*** START OF THE PROJECT GUTENBERG EBOOK X ***\n${body}\n*** END OF THE PROJECT GUTENBERG EBOOK X ***\nLicence`;

describe("gutenberg parser", () => {
  it("converts roman numerals", () => {
    expect([romanToInt("IV"), romanToInt("XXXVIII"), romanToInt("xlii")]).toEqual([4, 38, 42]);
  });

  it("strips the licence header and footer", () => {
    expect(stripBoilerplate(wrap("Body text")).trim()).toBe("Body text");
  });

  it("tames shouting titles but leaves normal ones", () => {
    expect(cleanTitle("JONATHAN HARKER’S JOURNAL--_continued_")).toBe("Jonathan Harker’s Journal—Continued");
    expect(cleanTitle("The Pool of Tears.")).toBe("The Pool of Tears");
  });

  it("splits chapters, joins wrapped lines and drops tiny contents entries", () => {
    const src: BookSource = {
      slug: "t",
      gutenbergId: 1,
      heading: /^\s*CHAPTER\s+([IVXLC]+)\.?\s*$/,
      label: "Chapter",
      minWords: 20,
    };
    const text = wrap(
      `CONTENTS\nCHAPTER I.\nCHAPTER II.\n\nCHAPTER I.\n\n${lorem(30)}\nwrapped line\n\n${lorem(25)}\n\nCHAPTER II.\n\n${lorem(40)}`,
    );
    const chapters = parseChapters(text, src);
    expect(chapters.map((c) => c.title)).toEqual(["Chapter 1", "Chapter 2"]);
    expect(chapters[0].paragraphs).toHaveLength(2);
    expect(chapters[0].paragraphs[0]).toContain("wrapped line");
    expect(chapters.map((c) => c.idx)).toEqual([1, 2]);
  });

  it("uses the last match to skip a contents list", () => {
    const src: BookSource = {
      slug: "t",
      gutenbergId: 1,
      heading: /^\s*CHAPTER\s+(\d+)\.\s*(.*)$/,
      title: "same-line",
      label: "Chapter",
      startAfter: /^\s*CHAPTER\s+1\.\s+Loomings/,
      startAtLast: true,
      minWords: 10,
    };
    const text = wrap(`CHAPTER 1. Loomings.\nCHAPTER 2. Bag.\n\nCHAPTER 1. Loomings.\n\n${lorem(30)}\n\nCHAPTER 2. Bag.\n\n${lorem(30)}`);
    const chapters = parseChapters(text, src);
    expect(chapters.map((c) => c.title)).toEqual(["Chapter 1: Loomings", "Chapter 2: Bag"]);
  });

  it("reads titles from the next line", () => {
    const src: BookSource = {
      slug: "t",
      gutenbergId: 1,
      heading: /^\s*CHAPTER\s+([IVXLC]+)\.\s*$/,
      title: "next-line",
      label: "Chapter",
      minWords: 10,
    };
    const chapters = parseChapters(wrap(`CHAPTER I.\nDown the Rabbit-Hole\n\n${lorem(30)}`), src);
    expect(chapters[0].title).toBe("Chapter 1: Down the Rabbit-Hole");
    expect(chapters[0].paragraphs[0]).not.toContain("Rabbit-Hole");
  });

  it("restarts chapters per part and labels them", () => {
    const src = BOOK_SOURCES.find((b) => b.slug === "crime-and-punishment")!;
    const text = wrap(
      `PART I\n\nCHAPTER I\n\n${lorem(130)}\n\nCHAPTER II\n\n${lorem(130)}\n\nPART II\n\nCHAPTER I\n\n${lorem(130)}`,
    );
    const titles = parseChapters(text, { ...src, startAfter: undefined }).map((c) => c.title);
    expect(titles).toEqual(["Part 1, Chapter 1", "Part 1, Chapter 2", "Part 2, Chapter 1"]);
  });

  it("every configured book has a unique slug and a Gutenberg id", () => {
    const slugs = new Set(BOOK_SOURCES.map((b) => b.slug));
    expect(slugs.size).toBe(BOOK_SOURCES.length);
    expect(BOOK_SOURCES.every((b) => b.gutenbergId > 0)).toBe(true);
  });
});
