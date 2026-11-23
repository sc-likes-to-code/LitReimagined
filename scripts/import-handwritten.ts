/**
 * Imports hand-written modern versions from data/handwritten into Supabase.
 * Files are named <book-slug>/<chapter>.<level>.json and hold {"paragraphs": [...]}.
 * Every file is checked paragraph-for-paragraph against the stored original.
 *
 *   npm run content:import-handwritten
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { getDb, loadEnv } from "./lib/db";

const ROOT = join(process.cwd(), "data", "handwritten");

async function main() {
  loadEnv();
  const db = getDb();
  let ok = 0;
  let bad = 0;

  for (const slug of readdirSync(ROOT).filter((d) =>
    statSync(join(ROOT, d)).isDirectory(),
  )) {
    const { data: book } = await db
      .from("books")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!book) {
      console.warn(`- ${slug}: not in the catalogue, skipping`);
      continue;
    }
    for (const file of readdirSync(join(ROOT, slug)).filter((f) =>
      /^\d+\.[123]\.json$/.test(f),
    )) {
      const [chapter, level] = file.split(".");
      const data = JSON.parse(readFileSync(join(ROOT, slug, file), "utf8")) as {
        paragraphs: string[];
      };
      const { data: ch } = await db
        .from("chapters")
        .select("id,original_paragraphs")
        .eq("book_id", book.id)
        .eq("idx", Number(chapter))
        .maybeSingle();
      const label = `${slug} ch.${chapter} level ${level}`;
      if (!ch) {
        console.error(`✗ ${label}: chapter not found`);
        bad++;
        continue;
      }
      const original = ch.original_paragraphs as string[];
      if (
        data.paragraphs.length !== original.length ||
        data.paragraphs.some((p) => !p?.trim())
      ) {
        console.error(
          `✗ ${label}: ${data.paragraphs.length} paragraphs, original has ${original.length}`,
        );
        bad++;
        continue;
      }
      const { error } = await db.from("translations").upsert(
        {
          chapter_id: ch.id,
          level: Number(level),
          paragraphs: data.paragraphs,
          model: "handwritten",
          prompt_version: "hand-1",
          status: "done",
        },
        { onConflict: "chapter_id,level" },
      );
      if (error) {
        console.error(`✗ ${label}: ${error.message}`);
        bad++;
      } else {
        console.log(`✓ ${label}`);
        ok++;
      }
    }
  }
  console.log(`\nImported ${ok} chapter versions${bad ? `, ${bad} failed` : ""}.`);
  if (bad) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
