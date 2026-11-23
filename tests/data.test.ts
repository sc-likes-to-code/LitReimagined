import { describe, expect, it } from "vitest";
import { demoRepository as repo } from "@/lib/data/demo";
import { demoContent } from "@/data/demo/content";
import { filterBooks } from "@/lib/data/filter";

describe("demo content", () => {
  it("keeps every translation level aligned paragraph-for-paragraph", () => {
    for (const [slug, ch] of Object.entries(demoContent)) {
      for (const level of [1, 2, 3] as const) {
        expect(ch.levels[level].length, `${slug} level ${level}`).toBe(ch.original.length);
      }
    }
  });

  it("covers all 12 launch books", async () => {
    const books = await repo.listBooks();
    expect(books).toHaveLength(12);
    for (const b of books) expect(demoContent[b.slug], b.slug).toBeDefined();
  });
});

describe("filterBooks", () => {
  it("searches across title, author and mood", async () => {
    const books = await repo.listBooks();
    expect(filterBooks(books, { q: "austen" }).map((b) => b.slug)).toEqual(["pride-and-prejudice"]);
    expect(filterBooks(books, { q: "whimsical" })[0].slug).toBe("alices-adventures-in-wonderland");
  });

  it("filters by genre and difficulty", async () => {
    const books = await repo.listBooks();
    const easy = filterBooks(books, { maxDifficulty: 2 });
    expect(easy.every((b) => b.difficulty <= 2)).toBe(true);
    expect(filterBooks(books, { genre: "gothic" }).length).toBeGreaterThan(2);
  });

  it("sorts by length", async () => {
    const books = await repo.listBooks();
    const sorted = filterBooks(books, { sort: "length" });
    expect(sorted[0].wordCount).toBeLessThanOrEqual(sorted[1].wordCount);
  });
});

describe("demo repository", () => {
  it("resolves books, chapters, authors and collections", async () => {
    expect((await repo.getBook("moby-dick"))?.author.name).toBe("Herman Melville");
    expect((await repo.getChapter("dracula", 0))?.original.length).toBeGreaterThan(0);
    expect(await repo.getBook("nope")).toBeNull();
    expect((await repo.getAuthor("homer"))?.books).toHaveLength(1);
    expect((await repo.listCollections()).every((c) => c.books.length > 0)).toBe(true);
  });
});
