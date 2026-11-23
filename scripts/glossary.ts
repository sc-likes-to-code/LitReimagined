/**
 * Builds a glossary of archaic or difficult terms for each book from its opening chapters.
 * Terms must appear verbatim in the text, so every glossary entry is clickable in the reader.
 *
 *   npm run content:glossary -- --mock
 */
import { parseArgs } from "./lib/args";
import { getDb, loadEnv } from "./lib/db";
import { generateJson } from "./lib/gemini";

const SYSTEM = `You are a literature teacher preparing a glossary for modern readers of a classic book.
From the provided text, choose up to 30 archaic, obsolete or hard-to-guess words or short phrases (1 to 3 words each).
Each "term" must appear EXACTLY as written in the text, in lowercase unless it is a proper noun.
Reply as JSON: [{"term": string, "definition": string (max 18 words, plain English), "modern": string (a short modern equivalent)}].
Skip common words and proper names.`;

type Entry = { term: string; definition: string; modern: string };

async function main() {
  loadEnv();
  const args = parseArgs();
  const mock = args.has("mock");
  const only = args.get("book");
  const db = getDb();

  const { data: books } = await db.from("books").select("id,slug").order("slug");
  for (const b of (books ?? []).filter((x) => !only || x.slug === only)) {
    const { data: chs } = await db
      .from("chapters")
      .select("original_paragraphs")
      .eq("book_id", b.id)
      .order("idx")
      .limit(3);
    const text = (chs ?? [])
      .flatMap((c) => c.original_paragraphs as string[])
      .join("\n\n")
      .slice(0, 14000);
    if (!text) {
      console.log(`- ${b.slug}: no chapters yet, skipping`);
      continue;
    }

    let entries: Entry[] = [];
    if (mock) {
      entries = [{ term: "whereupon", definition: "At which point.", modern: "then" }];
    } else {
      entries = await generateJson<Entry[]>(SYSTEM, text, (v) => {
        if (!Array.isArray(v)) throw new Error("not an array");
        return v.filter(
          (e): e is Entry =>
            e && typeof e.term === "string" && typeof e.definition === "string",
        );
      });
    }

    const lower = text.toLowerCase();
    const valid = entries
      .filter((e) => lower.includes(e.term.toLowerCase()))
      .map((e) => ({
        book_id: b.id,
        term: e.term.trim(),
        definition: e.definition.trim(),
        modern_equiv: e.modern?.trim() || null,
      }));

    if (valid.length) {
      const { error } = await db
        .from("glossary")
        .upsert(valid, { onConflict: "book_id,term" });
      if (error) throw new Error(`${b.slug}: ${error.message}`);
    }
    console.log(`✓ ${b.slug}: ${valid.length} terms`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
