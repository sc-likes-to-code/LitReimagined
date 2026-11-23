import { isSupabaseConfigured } from "@/lib/env";
import { demoRepository } from "./demo";
import type { Repository } from "./repository";
import { supabaseRepository } from "./supabase";

export * from "./types";
export type { Repository } from "./repository";

/**
 * With Supabase configured we read live data, but fall back to the bundled demo
 * catalogue when the database has nothing yet (before ingestion) or is briefly
 * unreachable, so the site never renders empty or crashes.
 */
function withFallback(live: Repository, demo: Repository): Repository {
  const safe =
    <A extends unknown[], R>(
      pick: (r: Repository) => (...a: A) => Promise<R>,
      isEmpty: (r: R) => boolean,
    ) =>
    async (...args: A): Promise<R> => {
      try {
        const out = await pick(live)(...args);
        if (!isEmpty(out)) return out;
      } catch (err) {
        console.error("[data] Supabase read failed, using demo data:", err);
      }
      return pick(demo)(...args);
    };

  const emptyList = (r: unknown[]) => r.length === 0;
  const isNull = (r: unknown) => r === null;

  return {
    listBooks: async (f) => {
      // A filtered query returning nothing is a legitimate empty result.
      try {
        const all = await live.listBooks();
        if (all.length > 0) return live.listBooks(f);
      } catch (err) {
        console.error("[data] Supabase read failed, using demo data:", err);
      }
      return demo.listBooks(f);
    },
    getBook: safe((r) => r.getBook.bind(r), isNull),
    getChapter: safe((r) => r.getChapter.bind(r), isNull),
    listAuthors: safe((r) => r.listAuthors.bind(r), emptyList),
    getAuthor: safe((r) => r.getAuthor.bind(r), isNull),
    listCollections: safe((r) => r.listCollections.bind(r), emptyList),
    getCollection: safe((r) => r.getCollection.bind(r), isNull),
    getFacets: async () => {
      try {
        const f = await live.getFacets();
        if (f.genres.length > 0) return f;
      } catch (err) {
        console.error("[data] Supabase read failed, using demo data:", err);
      }
      return demo.getFacets();
    },
  };
}

export const repo: Repository = isSupabaseConfigured
  ? withFallback(supabaseRepository, demoRepository)
  : demoRepository;
