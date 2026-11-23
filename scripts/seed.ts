/**
 * Loads the catalogue (authors, books, collections) into Supabase from the bundled
 * demo metadata, and publishes it. Safe to re-run.
 *
 *   npm run content:seed
 */
import { demoAuthors } from "../data/demo/authors";
import { demoBookRows } from "../data/demo/books";
import { demoCollectionDefs } from "../lib/data/demo";
import { getDb, loadEnv } from "./lib/db";

const eras = (e: string | null) => e;

async function main() {
  loadEnv();
  const db = getDb();

  const { error: aErr } = await db.from("authors").upsert(
    demoAuthors.map((a) => ({
      slug: a.slug,
      name: a.name,
      born_year: a.bornYear,
      died_year: a.diedYear,
      nationality: a.nationality,
      bio: a.bio,
    })),
    { onConflict: "slug" },
  );
  if (aErr) throw new Error(`authors: ${aErr.message}`);

  const { data: authors } = await db.from("authors").select("id,slug");
  const authorId = new Map(
    (authors ?? []).map((a) => [a.slug as string, a.id as string]),
  );

  const books = demoBookRows.map(({ authorSlug, book }) => ({
    slug: book.slug,
    title: book.title,
    subtitle: book.subtitle,
    author_id: authorId.get(authorSlug),
    original_year: book.originalYear,
    era: eras(book.era),
    genres: book.genres,
    moods: book.moods,
    difficulty: book.difficulty,
    word_count: book.wordCount,
    reading_minutes: book.readingMinutes,
    synopsis: book.synopsis,
    why_read: book.whyRead,
    cover_style: book.coverStyle,
    featured: book.featured,
    // Books go live once their chapters are ingested; publish is explicit.
    published: true,
  }));
  const { error: bErr } = await db.from("books").upsert(books, { onConflict: "slug" });
  if (bErr) throw new Error(`books: ${bErr.message}`);

  const { data: bookRows } = await db.from("books").select("id,slug");
  const bookId = new Map((bookRows ?? []).map((b) => [b.slug as string, b.id as string]));

  for (const [i, c] of demoCollectionDefs.entries()) {
    const { data: col, error } = await db
      .from("collections")
      .upsert(
        { slug: c.slug, title: c.title, description: c.description, sort: i },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (error || !col) throw new Error(`collection ${c.slug}: ${error?.message}`);
    await db.from("collection_books").delete().eq("collection_id", col.id);
    await db
      .from("collection_books")
      .insert(
        c.slugs.flatMap((slug, sort) =>
          bookId.has(slug)
            ? [{ collection_id: col.id, book_id: bookId.get(slug), sort }]
            : [],
        ),
      );
  }

  console.log(
    `Seeded ${demoAuthors.length} authors, ${books.length} books and ${demoCollectionDefs.length} collections.`,
  );
  console.log("Next: npm run content:ingest");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
