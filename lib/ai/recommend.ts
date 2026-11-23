import "server-only";
import { getModels, MAX_QUERY_CHARS } from "@/config/ai";
import { repo, type BookSummary } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { getPublicClient } from "@/lib/supabase/public";
import { cacheKey } from "./gateway";
import { getProvider } from "./providers";
import { getUsageStore } from "./store";

const SYNONYMS: Record<string, string[]> = {
  scary: ["gothic", "horror", "dark", "haunting", "suspenseful"],
  creepy: ["gothic", "horror", "dark", "haunting"],
  love: ["romance", "romantic", "passionate", "tragic romance"],
  romantic: ["romance", "romantic", "passionate"],
  funny: ["comedy", "witty", "playful", "whimsical"],
  short: ["short", "quick", "fast"],
  quick: ["fast"],
  adventure: ["adventure", "epic", "adventurous"],
  sea: ["adventure", "epic"],
  magic: ["fantasy", "whimsical", "surreal"],
  weird: ["surreal", "whimsical", "unsettling"],
  sad: ["tragic", "bittersweet", "bleak"],
  deep: ["philosophical", "meditative", "reflective"],
  crime: ["crime", "psychological fiction", "intense"],
  mystery: ["suspenseful", "atmospheric", "crime"],
};

function tokens(s: string) {
  return s
    .toLowerCase()
    .split(/[^a-z']+/)
    .filter((t) => t.length > 2);
}

/** Keyword and mood scoring: the fallback when embeddings are not available. */
export function lexicalPicks(
  query: string,
  books: BookSummary[],
  n: number,
): BookSummary[] {
  const words = new Set<string>();
  for (const t of tokens(query)) {
    words.add(t);
    for (const s of SYNONYMS[t] ?? []) words.add(s);
  }
  const scored = books.map((b) => {
    const hay = [
      b.title,
      b.author.name,
      b.genres.join(" "),
      b.moods.join(" "),
      b.synopsis,
      b.whyRead,
    ]
      .join(" ")
      .toLowerCase();
    let score = 0;
    for (const w of words) {
      if (hay.includes(w))
        score +=
          b.moods.some((m) => m === w) || b.genres.some((g) => g.toLowerCase() === w)
            ? 3
            : 1;
    }
    if (/short|quick|fast|easy/.test(query.toLowerCase()))
      score += (6 - b.difficulty) * 0.3 + (b.wordCount < 60000 ? 1.5 : 0);
    return { b, score: score + (b.featured ? 0.2 : 0) };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((s) => s.b);
}

async function embedQuery(query: string): Promise<number[] | null> {
  const provider = getProvider();
  if (provider.demo) return null;
  const store = getUsageStore();
  const key = cacheKey("recommend", { embed: query.toLowerCase(), m: getModels().embed });
  const hit = await store.getCache(key);
  if (Array.isArray(hit)) return hit as number[];
  try {
    const vec = await provider.embed(query);
    if (vec) await store.setCache(key, "recommend", vec);
    return vec;
  } catch (err) {
    console.error("[ai] embed failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function pickBooks(rawQuery: string, n = 3): Promise<BookSummary[]> {
  const query = rawQuery.trim().slice(0, MAX_QUERY_CHARS);
  const all = await repo.listBooks();

  if (isSupabaseConfigured) {
    const vec = await embedQuery(query);
    if (vec) {
      try {
        const { data, error } = await getPublicClient().rpc("match_books", {
          query_embedding: JSON.stringify(vec),
          match_count: n,
        });
        if (!error && data?.length) {
          const bySlug = new Map(all.map((b) => [b.slug, b]));
          const picks = (data as { slug: string }[]).flatMap((r) =>
            bySlug.has(r.slug) ? [bySlug.get(r.slug)!] : [],
          );
          if (picks.length) return picks;
        }
      } catch (err) {
        console.error(
          "[ai] match_books failed:",
          err instanceof Error ? err.message : err,
        );
      }
    }
  }
  return lexicalPicks(query, all, n);
}
