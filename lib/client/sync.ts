"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  bookmarkStore,
  highlightStore,
  progressStore,
  shelfStore,
  type Bookmark,
  type Highlight,
  type HighlightColor,
  type ProgressEntry,
  type ShelfEntry,
  type ShelfStatus,
} from "./library";
import type { Level } from "@/lib/data/types";

/**
 * Two-way sync between the guest stores in localStorage and the signed-in user's
 * rows in Supabase. Last write wins per record; bookmarks and highlights merge as
 * unions. Books that are not in the database yet stay local-only.
 */

type UserBookRow = {
  book_id: string;
  status: ShelfStatus;
  last_chapter: number;
  last_paragraph: number;
  level: number;
  updated_at: string;
};
type BookmarkRow = {
  id: string;
  book_id: string;
  chapter_idx: number;
  paragraph_idx: number;
  created_at: string;
};
type HighlightRow = {
  id: string;
  book_id: string;
  chapter_idx: number;
  paragraph_idx: number;
  quote: string;
  color: string;
  note: string | null;
  created_at: string;
};

const PUSH_DELAY = 1500;

export function startSync(sb: SupabaseClient, userId: string): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const slugToId = new Map<string, string>();
  const idToSlug = new Map<string, string>();
  const remote = {
    books: new Set<string>(),
    bookmarks: new Set<string>(),
    highlights: new Set<string>(),
  };
  let ready = false;
  let pushing = false;
  let dirty = false;

  const unsubs: Array<() => void> = [];

  async function pull() {
    const { data: books } = await sb.from("books").select("id,slug");
    for (const b of books ?? []) {
      slugToId.set(b.slug, b.id);
      idToSlug.set(b.id, b.slug);
    }

    const [ub, bm, hl] = await Promise.all([
      sb
        .from("user_books")
        .select("book_id,status,last_chapter,last_paragraph,level,updated_at")
        .eq("user_id", userId),
      sb
        .from("bookmarks")
        .select("id,book_id,chapter_idx,paragraph_idx,created_at")
        .eq("user_id", userId),
      sb
        .from("highlights")
        .select("id,book_id,chapter_idx,paragraph_idx,quote,color,note,created_at")
        .eq("user_id", userId),
    ]);
    if (stopped) return;

    // shelf + progress: newest record wins
    const shelf = { ...shelfStore.get() };
    const progress = { ...progressStore.get() };
    for (const r of (ub.data ?? []) as UserBookRow[]) {
      const slug = idToSlug.get(r.book_id);
      if (!slug) continue;
      remote.books.add(slug);
      const at = Date.parse(r.updated_at);
      if (!shelf[slug] || shelf[slug].updatedAt < at)
        shelf[slug] = { status: r.status, updatedAt: at };
      if (r.last_chapter > 0 && (!progress[slug] || progress[slug].updatedAt < at)) {
        progress[slug] = {
          chapter: r.last_chapter,
          paragraph: r.last_paragraph,
          level: r.level as Level,
          updatedAt: at,
        };
      }
    }
    shelfStore.set(shelf);
    progressStore.set(progress);

    // bookmarks: union
    const marks = [...bookmarkStore.get()];
    const markKey = (b: { book: string; chapter: number; paragraph: number }) =>
      `${b.book}:${b.chapter}:${b.paragraph}`;
    const have = new Set(marks.map(markKey));
    for (const r of (bm.data ?? []) as BookmarkRow[]) {
      const slug = idToSlug.get(r.book_id);
      if (!slug) continue;
      remote.bookmarks.add(r.id);
      const b: Bookmark = {
        id: r.id,
        book: slug,
        chapter: r.chapter_idx,
        paragraph: r.paragraph_idx,
        createdAt: Date.parse(r.created_at),
      };
      if (!have.has(markKey(b))) {
        marks.push(b);
        have.add(markKey(b));
      }
    }
    bookmarkStore.set(marks);

    // highlights: union by id
    const hls = [...highlightStore.get()];
    const ids = new Set(hls.map((h) => h.id));
    for (const r of (hl.data ?? []) as HighlightRow[]) {
      const slug = idToSlug.get(r.book_id);
      if (!slug) continue;
      remote.highlights.add(r.id);
      if (ids.has(r.id)) continue;
      hls.push({
        id: r.id,
        book: slug,
        chapter: r.chapter_idx,
        paragraph: r.paragraph_idx,
        text: r.quote,
        color: r.color as HighlightColor,
        note: r.note ?? undefined,
        createdAt: Date.parse(r.created_at),
      } satisfies Highlight);
    }
    highlightStore.set(hls);
  }

  async function push() {
    if (stopped || !ready) return;
    if (pushing) {
      dirty = true;
      return;
    }
    pushing = true;
    try {
      const shelf = shelfStore.get();
      const progress = progressStore.get();
      const bookmarks = bookmarkStore.get().filter((b) => slugToId.has(b.book));
      const highlights = highlightStore.get().filter((h) => slugToId.has(h.book));

      // user_books
      const slugs = new Set(
        [...Object.keys(shelf), ...Object.keys(progress)].filter((s) => slugToId.has(s)),
      );
      const rows = [...slugs].map((slug) => {
        const s: ShelfEntry | undefined = shelf[slug];
        const p: ProgressEntry | undefined = progress[slug];
        return {
          user_id: userId,
          book_id: slugToId.get(slug)!,
          status: s?.status ?? "reading",
          last_chapter: p?.chapter ?? 0,
          last_paragraph: p?.paragraph ?? 0,
          level: p?.level ?? 2,
          updated_at: new Date(
            Math.max(s?.updatedAt ?? 0, p?.updatedAt ?? 0) || Date.now(),
          ).toISOString(),
        };
      });
      if (rows.length)
        await sb.from("user_books").upsert(rows, { onConflict: "user_id,book_id" });
      const removedBooks = [...remote.books].filter((s) => !slugs.has(s));
      if (removedBooks.length) {
        await sb
          .from("user_books")
          .delete()
          .eq("user_id", userId)
          .in(
            "book_id",
            removedBooks.map((s) => slugToId.get(s)!),
          );
      }
      remote.books = slugs;

      // bookmarks
      if (bookmarks.length) {
        await sb.from("bookmarks").upsert(
          bookmarks.map((b) => ({
            id: b.id,
            user_id: userId,
            book_id: slugToId.get(b.book)!,
            chapter_idx: b.chapter,
            paragraph_idx: b.paragraph,
            created_at: new Date(b.createdAt).toISOString(),
          })),
          { onConflict: "id" },
        );
      }
      const localMarkIds = new Set(bookmarks.map((b) => b.id));
      const goneMarks = [...remote.bookmarks].filter((id) => !localMarkIds.has(id));
      if (goneMarks.length)
        await sb.from("bookmarks").delete().eq("user_id", userId).in("id", goneMarks);
      remote.bookmarks = localMarkIds;

      // highlights
      if (highlights.length) {
        await sb.from("highlights").upsert(
          highlights.map((h) => ({
            id: h.id,
            user_id: userId,
            book_id: slugToId.get(h.book)!,
            chapter_idx: h.chapter,
            paragraph_idx: h.paragraph,
            quote: h.text,
            color: h.color,
            note: h.note ?? null,
            created_at: new Date(h.createdAt).toISOString(),
          })),
          { onConflict: "id" },
        );
      }
      const localHlIds = new Set(highlights.map((h) => h.id));
      const goneHl = [...remote.highlights].filter((id) => !localHlIds.has(id));
      if (goneHl.length)
        await sb.from("highlights").delete().eq("user_id", userId).in("id", goneHl);
      remote.highlights = localHlIds;
    } catch (err) {
      console.error("[sync] push failed", err);
    } finally {
      pushing = false;
      if (dirty) {
        dirty = false;
        schedule();
      }
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(push, PUSH_DELAY);
  }

  (async () => {
    try {
      await pull();
      if (stopped) return;
      ready = true;
      await push();
      for (const store of [shelfStore, progressStore, bookmarkStore, highlightStore]) {
        unsubs.push(
          (store as { subscribe: (cb: () => void) => () => void }).subscribe(schedule),
        );
      }
    } catch (err) {
      console.error("[sync] initial sync failed", err);
    }
  })();

  return () => {
    stopped = true;
    clearTimeout(timer);
    unsubs.forEach((u) => u());
  };
}
