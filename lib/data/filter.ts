import type { BookFilters, BookSummary } from "./types";
import type { Facets } from "./repository";

const norm = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** In-memory filter and sort. The catalogue is small enough that this beats a round trip. */
export function filterBooks(books: BookSummary[], f: BookFilters = {}): BookSummary[] {
  const q = f.q ? norm(f.q.trim()) : "";
  let out = books.filter((b) => {
    if (q) {
      const hay = norm(
        [
          b.title,
          b.subtitle ?? "",
          b.author.name,
          b.genres.join(" "),
          b.moods.join(" "),
        ].join(" "),
      );
      if (!q.split(/\s+/).every((t) => hay.includes(t))) return false;
    }
    if (f.genre && !b.genres.some((g) => norm(g) === norm(f.genre!))) return false;
    if (f.era && norm(b.era ?? "") !== norm(f.era)) return false;
    if (f.mood && !b.moods.some((m) => norm(m) === norm(f.mood!))) return false;
    if (f.author && b.author.slug !== f.author) return false;
    if (f.maxDifficulty && b.difficulty > f.maxDifficulty) return false;
    return true;
  });

  switch (f.sort) {
    case "title":
      out = out.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "difficulty":
      out = out.sort(
        (a, b) => a.difficulty - b.difficulty || a.title.localeCompare(b.title),
      );
      break;
    case "length":
      out = out.sort((a, b) => a.wordCount - b.wordCount);
      break;
    case "year":
      out = out.sort((a, b) => (a.originalYear ?? -9999) - (b.originalYear ?? -9999));
      break;
    default:
      out = out.sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title),
      );
  }
  return out;
}

export function buildFacets(books: BookSummary[]): Facets {
  const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b));
  return {
    genres: uniq(books.flatMap((b) => b.genres)),
    eras: uniq(books.flatMap((b) => (b.era ? [b.era] : []))),
    moods: uniq(books.flatMap((b) => b.moods)),
  };
}
