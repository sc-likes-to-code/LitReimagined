/**
 * Creates a search embedding for each book so "find my next book" can match by meaning.
 *
 *   npm run content:embed
 */
import { parseArgs } from "./lib/args";
import { getDb, loadEnv } from "./lib/db";
import { BudgetExhausted, embedText } from "./lib/gemini";

async function main() {
  loadEnv();
  const args = parseArgs();
  const force = args.has("force");
  const db = getDb();

  const { data: books } = await db
    .from("books")
    .select("id,slug,title,genres,moods,synopsis,why_read,embedding,authors(name)");
  for (const b of books ?? []) {
    if (b.embedding && !force) continue;
    const author = Array.isArray(b.authors)
      ? b.authors[0]?.name
      : (b.authors as { name?: string } | null)?.name;
    const text = [
      `${b.title} by ${author ?? "unknown"}`,
      `Genres: ${(b.genres as string[]).join(", ")}`,
      `Moods: ${(b.moods as string[]).join(", ")}`,
      b.synopsis,
      b.why_read,
    ].join("\n");
    try {
      const vec = await embedText(text);
      const { error } = await db
        .from("books")
        .update({ embedding: JSON.stringify(vec) })
        .eq("id", b.id);
      if (error) throw new Error(error.message);
      console.log(`✓ ${b.slug}`);
    } catch (err) {
      if (err instanceof BudgetExhausted) return console.log(err.message);
      console.error(`✗ ${b.slug}: ${err instanceof Error ? err.message : err}`);
    }
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
