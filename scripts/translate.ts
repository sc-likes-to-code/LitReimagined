/**
 * Generates modern versions of every chapter, paragraph-aligned with the original.
 * Resumable: finished chapters are skipped, and progress is saved after each one.
 * Respects the free-tier throttle and daily budget in scripts/lib/budget.ts.
 *
 *   npm run content:translate -- --dry-run              # show the plan and estimated calls
 *   npm run content:translate -- --mock                 # exercise the pipeline with no API key
 *   npm run content:translate -- --levels 2             # only the "Modern" level
 *   npm run content:translate -- --book frankenstein --max-chapters 3
 *   npm run content:translate -- --force                # regenerate (e.g. after a prompt change)
 */
import { parseArgs } from "./lib/args";
import { BudgetExhausted, batchModel, generateJson } from "./lib/gemini";
import { getDb, loadEnv } from "./lib/db";
import { limits, remainingToday } from "./lib/budget";

export const TRANSLATION_PROMPT_VERSION = "t1";

const LEVEL_GUIDE: Record<1 | 2 | 3, string> = {
  1: "LIGHT POLISH. Keep the author's sentence structure, rhythm and voice. Replace only archaic words, obsolete idioms and confusing constructions. Make the smallest changes that help a modern reader.",
  2: "MODERN ENGLISH. Rewrite in clear, natural contemporary English. Reshape long sentences for readability, update vocabulary and idiom, keep the tone and register of the original (formal stays formal).",
  3: "CONTEMPORARY VOICE. Rewrite the way a witty, well-read friend would tell the story today: conversational, direct, with modern idiom. Stay faithful to events, characters and emotional tone. Never add jokes that change meaning.",
};

const SYSTEM = (
  level: 1 | 2 | 3,
) => `You modernize classic literature for today's readers.
${LEVEL_GUIDE[level]}

Rules:
- You receive a JSON array of paragraphs. Return a JSON array of strings with EXACTLY the same number of items, in the same order. Item i is the rewrite of paragraph i.
- Preserve meaning, plot, names, places, dialogue and the speaker of every line. Never merge, split, drop or add paragraphs.
- Keep paragraph breaks inside a paragraph (newlines) where the original has them.
- No commentary, headings, notes or explanations. Output only the JSON array.`;

type Task = {
  chapterId: string;
  bookSlug: string;
  idx: number;
  level: 1 | 2 | 3;
  paragraphs: string[];
};

const wordsOf = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** Group paragraphs into chunks small enough for one reliable response. */
function chunk(paragraphs: string[], maxWords = 900, maxItems = 40): string[][] {
  const out: string[][] = [];
  let cur: string[] = [];
  let w = 0;
  for (const p of paragraphs) {
    const pw = wordsOf(p);
    if (cur.length && (w + pw > maxWords || cur.length >= maxItems)) {
      out.push(cur);
      cur = [];
      w = 0;
    }
    cur.push(p);
    w += pw;
  }
  if (cur.length) out.push(cur);
  return out;
}

function mockRewrite(level: number, paras: string[]) {
  return paras.map((p) => `[demo level ${level}] ${p}`);
}

async function translateChunk(
  paras: string[],
  level: 1 | 2 | 3,
  mock: boolean,
  depth = 0,
): Promise<string[]> {
  if (mock) return mockRewrite(level, paras);

  const validate = (v: unknown) => {
    if (
      !Array.isArray(v) ||
      v.length !== paras.length ||
      v.some((x) => typeof x !== "string" || !x.trim())
    ) {
      throw new Error(
        `alignment mismatch (${Array.isArray(v) ? v.length : "not an array"} vs ${paras.length})`,
      );
    }
    return v as string[];
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await generateJson(SYSTEM(level), JSON.stringify(paras), validate);
    } catch (err) {
      if (err instanceof BudgetExhausted) throw err;
      console.warn(
        `   chunk attempt ${attempt + 1} failed: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
  // Split the chunk and try the halves; a single stubborn paragraph keeps its original text.
  if (paras.length === 1 || depth > 3) {
    console.warn("   falling back to the original text for one paragraph");
    return paras;
  }
  const mid = Math.ceil(paras.length / 2);
  return [
    ...(await translateChunk(paras.slice(0, mid), level, mock, depth + 1)),
    ...(await translateChunk(paras.slice(mid), level, mock, depth + 1)),
  ];
}

async function main() {
  loadEnv();
  const args = parseArgs();
  const dry = args.has("dry-run");
  const mock = args.has("mock");
  const force = args.has("force");
  const only = args.get("book");
  const maxChapters = args.num("max-chapters");
  const levels = (args.get("levels") ?? "2,1,3")
    .split(",")
    .map(Number)
    .filter((n): n is 1 | 2 | 3 => n === 1 || n === 2 || n === 3);

  const db = getDb();
  const { data: books } = await db.from("books").select("id,slug").order("slug");
  const bookList = (books ?? []).filter((b) => !only || b.slug === only);
  if (bookList.length === 0)
    throw new Error("No books found. Run content:seed and content:ingest first.");

  const tasks: Task[] = [];
  for (const b of bookList) {
    const { data: chapters } = await db
      .from("chapters")
      .select("id,idx,original_paragraphs")
      .eq("book_id", b.id)
      .order("idx")
      .limit(maxChapters ?? 10_000);
    const ids = (chapters ?? []).map((c) => c.id as string);
    const { data: done } = ids.length
      ? await db
          .from("translations")
          .select("chapter_id,level,prompt_version,status")
          .in("chapter_id", ids)
      : { data: [] };
    const have = new Set(
      (done ?? [])
        .filter(
          (t) =>
            t.status === "done" &&
            (force ? false : t.prompt_version === TRANSLATION_PROMPT_VERSION || mock),
        )
        .map((t) => `${t.chapter_id}:${t.level}`),
    );
    for (const c of chapters ?? []) {
      for (const level of levels) {
        if (!have.has(`${c.id}:${level}`)) {
          tasks.push({
            chapterId: c.id,
            bookSlug: b.slug,
            idx: c.idx,
            level,
            paragraphs: c.original_paragraphs as string[],
          });
        }
      }
    }
  }

  // Early chapters of every book first, so the whole library becomes readable quickly.
  const order = new Map(levels.map((l, i) => [l, i]));
  tasks.sort(
    (a, b) =>
      a.idx - b.idx ||
      order.get(a.level)! - order.get(b.level)! ||
      a.bookSlug.localeCompare(b.bookSlug),
  );

  const calls = tasks.reduce((n, t) => n + chunk(t.paragraphs).length, 0);
  console.log(`${tasks.length} chapter versions to generate (≈ ${calls} API calls).`);
  console.log(
    `Model: ${batchModel()} · throttle: ${limits.rpm}/min · daily budget: ${limits.rpd} (${await remainingToday()} left today).`,
  );
  if (!mock)
    console.log(
      `At this rate the full run needs about ${Math.ceil(calls / limits.rpd)} day(s). It is safe to stop and re-run.`,
    );
  if (dry) return;

  let finished = 0;
  for (const t of tasks) {
    const label = `${t.bookSlug} ch.${t.idx} level ${t.level}`;
    try {
      const out: string[] = [];
      for (const part of chunk(t.paragraphs))
        out.push(...(await translateChunk(part, t.level, mock)));
      if (out.length !== t.paragraphs.length) throw new Error("final alignment mismatch");

      const { error } = await db.from("translations").upsert(
        {
          chapter_id: t.chapterId,
          level: t.level,
          paragraphs: out,
          model: mock ? "mock" : batchModel(),
          prompt_version: mock ? "mock" : TRANSLATION_PROMPT_VERSION,
          status: "done",
        },
        { onConflict: "chapter_id,level" },
      );
      if (error) throw new Error(error.message);
      finished++;
      console.log(`✓ ${label}  (${finished}/${tasks.length})`);
    } catch (err) {
      if (err instanceof BudgetExhausted) {
        console.log(
          `\n${err.message}\nFinished ${finished} chapter versions this session.`,
        );
        return;
      }
      console.error(`✗ ${label}: ${err instanceof Error ? err.message : err}`);
    }
  }
  console.log(`\nDone. Generated ${finished} chapter versions.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
