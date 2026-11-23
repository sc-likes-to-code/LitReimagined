/** Shows how far the content pipeline has got. `npm run content:status` */
import { getDb, loadEnv } from "./lib/db";

async function main() {
  loadEnv();
  const db = getDb();
  const { data: books } = await db
    .from("books")
    .select("id,slug,embedding,published")
    .order("slug");
  console.log("book".padEnd(34), "chapters", "L1", "L2", "L3", "glossary", "embedded");
  for (const b of books ?? []) {
    const { data: chs } = await db.from("chapters").select("id").eq("book_id", b.id);
    const ids = (chs ?? []).map((c) => c.id as string);
    const { data: trs } = ids.length
      ? await db.from("translations").select("level,status").in("chapter_id", ids)
      : { data: [] };
    const done = (lvl: number) =>
      (trs ?? []).filter((t) => t.level === lvl && t.status === "done").length;
    const { count } = await db
      .from("glossary")
      .select("id", { count: "exact", head: true })
      .eq("book_id", b.id);
    console.log(
      b.slug.padEnd(34),
      String(ids.length).padStart(8),
      String(done(1)).padStart(2),
      String(done(2)).padStart(2),
      String(done(3)).padStart(2),
      String(count ?? 0).padStart(8),
      b.embedding ? "yes" : "no",
    );
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
