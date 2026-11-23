/** Prints a chapter's original paragraphs, numbered. npm run content:dump -- alices-adventures-in-wonderland 1 */
import { getDb, loadEnv } from "./lib/db";

async function main() {
  loadEnv();
  const [slug, chapter] = process.argv.slice(2);
  const db = getDb();
  const { data: book } = await db.from("books").select("id").eq("slug", slug).single();
  const { data: ch } = await db
    .from("chapters")
    .select("title,original_paragraphs")
    .eq("book_id", book!.id)
    .eq("idx", Number(chapter))
    .single();
  const paras = ch!.original_paragraphs as string[];
  console.log(`# ${slug} · ${ch!.title} · ${paras.length} paragraphs\n`);
  paras.forEach((p, i) => console.log(`[${i}] ${p}\n`));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
