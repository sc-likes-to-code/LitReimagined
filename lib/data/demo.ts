import { demoAuthors } from "@/data/demo/authors";
import { demoBookRows } from "@/data/demo/books";
import { demoContent } from "@/data/demo/content";
import { buildFacets, filterBooks } from "./filter";
import type { Repository } from "./repository";
import type { BookDetail, BookSummary, Chapter, Collection } from "./types";

const authorBySlug = new Map(demoAuthors.map((a) => [a.slug, a]));

const books: BookSummary[] = demoBookRows.map(({ authorSlug, book }) => {
  const a = authorBySlug.get(authorSlug)!;
  return { ...book, author: { slug: a.slug, name: a.name } };
});
const bookBySlug = new Map(books.map((b) => [b.slug, b]));

const collectionDefs = [
  {
    slug: "dark-and-gothic",
    title: "Dark & Gothic",
    description:
      "Candlelit corridors, brooding heroes and things that should stay buried.",
    slugs: [
      "frankenstein",
      "dracula",
      "jane-eyre",
      "wuthering-heights",
      "the-picture-of-dorian-gray",
    ],
  },
  {
    slug: "love-that-still-hurts",
    title: "Love Stories That Still Hurt",
    description: "Centuries old and somehow still capable of breaking your heart.",
    slugs: ["romeo-and-juliet", "wuthering-heights", "pride-and-prejudice", "jane-eyre"],
  },
  {
    slug: "short-and-brilliant",
    title: "Short & Brilliant",
    description: "Big ideas, small page counts. Ideal first classics.",
    slugs: [
      "alices-adventures-in-wonderland",
      "romeo-and-juliet",
      "frankenstein",
      "the-picture-of-dorian-gray",
    ],
  },
  {
    slug: "epic-journeys",
    title: "Epic Journeys",
    description: "Oceans, monsters, obsession and the long way home.",
    slugs: ["the-odyssey", "moby-dick", "great-expectations"],
  },
];

function pick(slugs: string[]): BookSummary[] {
  return slugs.flatMap((s) => {
    const b = bookBySlug.get(s);
    return b ? [b] : [];
  });
}

function totalChapters(slug: string) {
  return demoContent[slug] ? 1 : 0;
}

export const demoRepository: Repository = {
  async listBooks(filters) {
    return filterBooks(books, filters);
  },

  async getBook(slug): Promise<BookDetail | null> {
    const b = bookBySlug.get(slug);
    if (!b) return null;
    const c = demoContent[slug];
    return {
      ...b,
      chapters: c
        ? [
            {
              idx: 1,
              title: c.title,
              wordCount: c.original.join(" ").split(/\s+/).length,
            },
          ]
        : [],
    };
  },

  async getChapter(bookSlug, idx): Promise<Chapter | null> {
    const c = demoContent[bookSlug];
    if (!c || idx !== 1) return null;
    return {
      bookSlug,
      idx: 1,
      title: c.title,
      original: c.original,
      translations: c.levels,
      glossary: c.glossary,
      prev: null,
      next: null,
      totalChapters: totalChapters(bookSlug),
    };
  },

  async listAuthors() {
    return demoAuthors.map((a) => ({
      ...a,
      bookCount: books.filter((b) => b.author.slug === a.slug).length,
    }));
  },

  async getAuthor(slug) {
    const a = authorBySlug.get(slug);
    if (!a) return null;
    return { ...a, books: books.filter((b) => b.author.slug === slug) };
  },

  async listCollections(): Promise<Collection[]> {
    return collectionDefs.map((c) => ({
      slug: c.slug,
      title: c.title,
      description: c.description,
      books: pick(c.slugs),
    }));
  },

  async getCollection(slug) {
    const c = collectionDefs.find((x) => x.slug === slug);
    if (!c) return null;
    return {
      slug: c.slug,
      title: c.title,
      description: c.description,
      books: pick(c.slugs),
    };
  },

  async getFacets() {
    return buildFacets(books);
  },
};
