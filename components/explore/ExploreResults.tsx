import Link from "next/link";
import { BookCard } from "@/components/book/BookCard";
import { repo, type BookFilters } from "@/lib/data";

const SORTS = new Set(["featured", "title", "difficulty", "length", "year"]);

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function parseFilters(
  sp: Record<string, string | string[] | undefined>,
): BookFilters {
  const sort = first(sp.sort);
  const diff = Number(first(sp.difficulty));
  return {
    q: first(sp.q)?.slice(0, 80),
    genre: first(sp.genre),
    era: first(sp.era),
    mood: first(sp.mood),
    author: first(sp.author),
    maxDifficulty: Number.isFinite(diff) && diff >= 1 && diff <= 5 ? diff : undefined,
    sort: sort && SORTS.has(sort) ? (sort as BookFilters["sort"]) : "featured",
  };
}

export async function ExploreResults({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseFilters(await searchParams);
  const books = await repo.listBooks(filters);

  if (books.length === 0) {
    return (
      <div className="border-line grid place-items-center rounded-[2rem] border border-dashed px-6 py-24 text-center">
        <p className="font-display text-3xl">No books match.</p>
        <p className="text-muted mt-3 max-w-sm">
          Try a different mood or genre, or clear the filters to see the whole library.
        </p>
        <Link href="/explore" className="mt-6 underline underline-offset-4">
          Clear filters
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="text-muted mb-8 text-sm" aria-live="polite">
        {books.length} {books.length === 1 ? "book" : "books"}
      </p>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 xl:grid-cols-4">
        {books.map((b) => (
          <li key={b.slug}>
            <BookCard book={b} />
          </li>
        ))}
      </ul>
    </>
  );
}

export function ResultsSkeleton() {
  return (
    <ul
      className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 xl:grid-cols-4"
      aria-hidden
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i}>
          <div className="bg-surface aspect-[2/3] animate-pulse rounded-lg" />
          <div className="bg-surface mt-4 h-4 w-3/4 animate-pulse rounded" />
          <div className="bg-surface mt-2 h-3 w-1/2 animate-pulse rounded" />
        </li>
      ))}
    </ul>
  );
}
