/**
 * Downloads books from Project Gutenberg, splits them into chapters and paragraphs,
 * and stores them in Supabase.
 *
 *   npm run content:ingest -- --dry-run            # offline-safe preview, no database needed
 *   npm run content:ingest -- --book moby-dick     # one book
 *   npm run content:ingest                         # all launch books (needs Supabase keys)
 */
import { BOOK_SOURCES } from "./config/books";
import { parseArgs } from "./lib/args";
import { getDb, loadEnv } from "./lib/db";
import { downloadBook, parseChapters } from "./lib/gutenberg";

async function main() {
  loadEnv();
  const args = parseArgs();
  const dry = args.has("dry-run");
  const only = args.get("book");
  const db = dry ? null : getDb();

  const sources = BOOK_SOURCES.filter((b) => !only || b.slug === only);
  if (sources.length === 0) throw new Error(`Unknown book: ${only}`);

  for (const src of sources) {
    process.stdout.write(`\n${src.slug} (#${src.gutenbergId}) … `);
    const raw = await downloadBook(src.gutenbergId);
    const chapters = parseChapters(raw, src);
    const total = chapters.reduce((n, c) => n + c.wordCount, 0);
    console.log(`${chapters.length} chapters, ${total.toLocaleString()} words`);

    if (dry) {
      const show = [...chapters.slice(0, 3), ...chapters.slice(-1)];
      for (const c of show) {
        console.log(
          `   ${String(c.idx).padStart(3)}  ${c.title}  (${c.wordCount}w, ${c.paragraphs.length}¶)`,
        );
        console.log(`        “${c.paragraphs[0]?.slice(0, 90)}…”`);
      }
      continue;
    }

    const { data: book, error } = await db!
      .from("books")
      .select("id")
      .eq("slug", src.slug)
      .maybeSingle();
    if (error || !book) {
      console.warn(
        `   ! ${src.slug} is not in the catalogue yet. Run \`npm run content:seed\` first.`,
      );
      continue;
    }
    await db!
      .from("books")
      .update({ gutenberg_id: src.gutenbergId, word_count: total })
      .eq("id", book.id);

    const rows = chapters.map((c) => ({
      book_id: book.id,
      idx: c.idx,
      title: c.title,
      original_paragraphs: c.paragraphs,
      word_count: c.wordCount,
    }));
    for (let i = 0; i < rows.length; i += 25) {
      const { error: upErr } = await db!
        .from("chapters")
        .upsert(rows.slice(i, i + 25), { onConflict: "book_id,idx" });
      if (upErr) throw new Error(`${src.slug}: ${upErr.message}`);
    }
    console.log(`   stored ${rows.length} chapters`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
