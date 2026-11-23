import { cacheLife, cacheTag } from "next/cache";
import { getPublicClient } from "@/lib/supabase/public";
import { buildFacets, filterBooks } from "./filter";
import type { AuthorDetail, AuthorWithCount, Facets, Repository } from "./repository";
import type {
  Author,
  BookDetail,
  BookSummary,
  Chapter,
  CoverStyle,
  Collection,
  GlossaryEntry,
} from "./types";

/* ------------------------------------------------------------------ */
/* Row shapes and mappers                                              */
/* ------------------------------------------------------------------ */

type AuthorRow = {
  slug: string;
  name: string;
  born_year: number | null;
  died_year: number | null;
  nationality: string | null;
  bio: string;
  portrait_url: string | null;
};

type BookRow = {
  slug: string;
  title: string;
  subtitle: string | null;
  original_year: number | null;
  era: string | null;
  genres: string[];
  moods: string[];
  difficulty: number | null;
  word_count: number | null;
  reading_minutes: number | null;
  synopsis: string;
  why_read: string;
  cover_url: string | null;
  cover_style: Partial<CoverStyle> | null;
  featured: boolean;
  authors: { slug: string; name: string } | { slug: string; name: string }[] | null;
};

const BOOK_COLUMNS =
  "slug,title,subtitle,original_year,era,genres,moods,difficulty,word_count,reading_minutes,synopsis,why_read,cover_url,cover_style,featured,authors(slug,name)";

const DEFAULT_COVER: CoverStyle = {
  from: "#272233",
  to: "#0e0c14",
  ink: "#f3ebdd",
  motif: "feather",
};

function mapAuthor(r: AuthorRow): Author {
  return {
    slug: r.slug,
    name: r.name,
    bornYear: r.born_year,
    diedYear: r.died_year,
    nationality: r.nationality,
    bio: r.bio,
    portraitUrl: r.portrait_url,
  };
}

function mapBook(r: BookRow): BookSummary {
  const a = Array.isArray(r.authors) ? r.authors[0] : r.authors;
  const words = r.word_count ?? 0;
  return {
    slug: r.slug,
    title: r.title,
    subtitle: r.subtitle,
    author: { slug: a?.slug ?? "unknown", name: a?.name ?? "Unknown" },
    originalYear: r.original_year,
    era: r.era,
    genres: r.genres ?? [],
    moods: r.moods ?? [],
    difficulty: r.difficulty ?? 3,
    wordCount: words,
    readingMinutes: r.reading_minutes ?? Math.round(words / 230),
    synopsis: r.synopsis,
    whyRead: r.why_read,
    coverUrl: r.cover_url,
    coverStyle: { ...DEFAULT_COVER, ...(r.cover_style ?? {}) },
    featured: r.featured,
  };
}

/* ------------------------------------------------------------------ */
/* Cached reads (public catalogue; revalidate with tags)               */
/* ------------------------------------------------------------------ */

async function fetchAllBooks(): Promise<BookSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("books");
  const { data, error } = await getPublicClient().from("books").select(BOOK_COLUMNS);
  if (error) throw new Error(`books: ${error.message}`);
  return ((data ?? []) as unknown as BookRow[]).map(mapBook);
}

async function fetchAllAuthors(): Promise<Author[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("authors");
  const { data, error } = await getPublicClient()
    .from("authors")
    .select("slug,name,born_year,died_year,nationality,bio,portrait_url")
    .order("name");
  if (error) throw new Error(`authors: ${error.message}`);
  return ((data ?? []) as AuthorRow[]).map(mapAuthor);
}

async function fetchBookDetail(slug: string): Promise<BookDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("books", `book:${slug}`);
  const sb = getPublicClient();
  const { data, error } = await sb
    .from("books")
    .select(`id,${BOOK_COLUMNS}`)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`book: ${error.message}`);
  if (!data) return null;
  const row = data as unknown as BookRow & { id: string };
  const { data: chs, error: chErr } = await sb
    .from("chapters")
    .select("idx,title,word_count")
    .eq("book_id", row.id)
    .order("idx");
  if (chErr) throw new Error(`chapters: ${chErr.message}`);
  return {
    ...mapBook(row),
    chapters: (chs ?? []).map((c) => ({
      idx: c.idx,
      title: c.title,
      wordCount: c.word_count,
    })),
  };
}

async function fetchChapter(bookSlug: string, idx: number): Promise<Chapter | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("books", `book:${bookSlug}`);
  const sb = getPublicClient();
  const { data: book } = await sb
    .from("books")
    .select("id")
    .eq("slug", bookSlug)
    .maybeSingle();
  if (!book) return null;

  const { data: chs, error } = await sb
    .from("chapters")
    .select("id,idx,title,original_paragraphs")
    .eq("book_id", book.id)
    .order("idx");
  if (error) throw new Error(`chapter: ${error.message}`);
  const list = chs ?? [];
  const pos = list.findIndex((c) => c.idx === idx);
  if (pos < 0) return null;
  const ch = list[pos];
  const original = (ch.original_paragraphs ?? []) as string[];

  const [{ data: trs }, { data: gloss }] = await Promise.all([
    sb.from("translations").select("level,paragraphs").eq("chapter_id", ch.id),
    sb.from("glossary").select("term,definition,modern_equiv").eq("book_id", book.id),
  ]);

  const translations: Chapter["translations"] = {};
  for (const t of trs ?? []) {
    const paras = (t.paragraphs ?? []) as string[];
    // Only expose levels that line up with the original so split view never drifts.
    if (
      (t.level === 1 || t.level === 2 || t.level === 3) &&
      paras.length === original.length
    ) {
      translations[t.level as 1 | 2 | 3] = paras;
    }
  }

  const glossary: GlossaryEntry[] = (gloss ?? []).map((g) => ({
    term: g.term,
    definition: g.definition,
    modernEquiv: g.modern_equiv,
  }));

  return {
    bookSlug,
    idx,
    title: ch.title,
    original,
    translations,
    glossary,
    prev: pos > 0 ? list[pos - 1].idx : null,
    next: pos < list.length - 1 ? list[pos + 1].idx : null,
    totalChapters: list.length,
  };
}

async function fetchCollections(): Promise<Collection[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("collections");
  const sb = getPublicClient();
  const { data, error } = await sb
    .from("collections")
    .select(
      "slug,title,description,sort,collection_books(sort,books(" + BOOK_COLUMNS + "))",
    )
    .order("sort");
  if (error) throw new Error(`collections: ${error.message}`);
  type Row = {
    slug: string;
    title: string;
    description: string;
    collection_books: { sort: number; books: BookRow | BookRow[] | null }[];
  };
  return ((data ?? []) as unknown as Row[]).map((c) => ({
    slug: c.slug,
    title: c.title,
    description: c.description,
    books: [...c.collection_books]
      .sort((a, b) => a.sort - b.sort)
      .flatMap((cb) =>
        cb.books ? [Array.isArray(cb.books) ? cb.books[0] : cb.books] : [],
      )
      .map(mapBook),
  }));
}

/* ------------------------------------------------------------------ */

export const supabaseRepository: Repository = {
  async listBooks(filters) {
    return filterBooks(await fetchAllBooks(), filters);
  },
  getBook: (slug) => fetchBookDetail(slug),
  getChapter: (slug, idx) => fetchChapter(slug, idx),

  async listAuthors(): Promise<AuthorWithCount[]> {
    const [authors, books] = await Promise.all([fetchAllAuthors(), fetchAllBooks()]);
    return authors
      .map((a) => ({
        ...a,
        bookCount: books.filter((b) => b.author.slug === a.slug).length,
      }))
      .filter((a) => a.bookCount > 0);
  },

  async getAuthor(slug): Promise<AuthorDetail | null> {
    const [authors, books] = await Promise.all([fetchAllAuthors(), fetchAllBooks()]);
    const a = authors.find((x) => x.slug === slug);
    return a ? { ...a, books: books.filter((b) => b.author.slug === slug) } : null;
  },

  listCollections: () => fetchCollections(),
  async getCollection(slug) {
    return (await fetchCollections()).find((c) => c.slug === slug) ?? null;
  },
  async getFacets(): Promise<Facets> {
    return buildFacets(await fetchAllBooks());
  },
};
