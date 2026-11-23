import type {
  Author,
  BookDetail,
  BookFilters,
  BookSummary,
  Chapter,
  Collection,
} from "./types";

export type AuthorWithCount = Author & { bookCount: number };
export type AuthorDetail = Author & { books: BookSummary[] };
export type Facets = { genres: string[]; eras: string[]; moods: string[] };

/**
 * Everything the UI needs from the catalogue. Pages depend on this interface only,
 * so swapping the bundled demo data for Supabase needs no page changes.
 */
export interface Repository {
  listBooks(filters?: BookFilters): Promise<BookSummary[]>;
  getBook(slug: string): Promise<BookDetail | null>;
  getChapter(bookSlug: string, idx: number): Promise<Chapter | null>;
  listAuthors(): Promise<AuthorWithCount[]>;
  getAuthor(slug: string): Promise<AuthorDetail | null>;
  listCollections(): Promise<Collection[]>;
  getCollection(slug: string): Promise<Collection | null>;
  getFacets(): Promise<Facets>;
}
