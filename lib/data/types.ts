/** Domain types shared by the demo and Supabase data sources. */

/** 0 = original text, 1 = light polish, 2 = modern, 3 = contemporary. */
export type Level = 0 | 1 | 2 | 3;

export const LEVEL_LABELS: Record<Level, string> = {
  0: "Original",
  1: "Light",
  2: "Modern",
  3: "Contemporary",
};

export type Author = {
  slug: string;
  name: string;
  bornYear: number | null;
  diedYear: number | null;
  nationality: string | null;
  bio: string;
  portraitUrl: string | null;
};

export type CoverStyle = {
  /** Background gradient stops. */
  from: string;
  to: string;
  /** Title / ornament colour. */
  ink: string;
  /** Decorative motif drawn on the generated cover. */
  motif:
    | "rose"
    | "bolt"
    | "moon"
    | "heath"
    | "star"
    | "feather"
    | "sea"
    | "mask"
    | "rabbit"
    | "laurel"
    | "snow"
    | "key";
};

export type Era =
  "Ancient" | "Renaissance" | "Romantic" | "Victorian" | "Gothic" | "Modern";

export type BookSummary = {
  slug: string;
  title: string;
  subtitle: string | null;
  author: Pick<Author, "slug" | "name">;
  originalYear: number | null;
  era: string | null;
  genres: string[];
  moods: string[];
  /** 1 (easy) to 5 (demanding). */
  difficulty: number;
  wordCount: number;
  readingMinutes: number;
  synopsis: string;
  whyRead: string;
  coverUrl: string | null;
  coverStyle: CoverStyle;
  featured: boolean;
};

export type ChapterSummary = {
  idx: number;
  title: string;
  wordCount: number;
};

export type BookDetail = BookSummary & {
  chapters: ChapterSummary[];
};

export type GlossaryEntry = {
  term: string;
  definition: string;
  modernEquiv: string | null;
};

export type Chapter = {
  bookSlug: string;
  idx: number;
  title: string;
  /** Original paragraphs, aligned 1:1 with every translation level. */
  original: string[];
  /** Levels that have a finished translation for this chapter. Always aligned with `original`. */
  translations: Partial<Record<1 | 2 | 3, string[]>>;
  glossary: GlossaryEntry[];
  prev: number | null;
  next: number | null;
  totalChapters: number;
};

export type Collection = {
  slug: string;
  title: string;
  description: string;
  books: BookSummary[];
};

export type BookFilters = {
  q?: string;
  genre?: string;
  era?: string;
  mood?: string;
  author?: string;
  maxDifficulty?: number;
  sort?: "featured" | "title" | "difficulty" | "length" | "year";
};
