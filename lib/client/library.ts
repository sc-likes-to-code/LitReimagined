"use client";

import type { Level } from "@/lib/data/types";
import { createStore, useStore } from "./store";

export type ShelfStatus = "want" | "reading" | "finished";

export type ShelfEntry = { status: ShelfStatus; updatedAt: number };
export type ProgressEntry = {
  chapter: number;
  paragraph: number;
  level: Level;
  updatedAt: number;
};

export type Bookmark = {
  id: string;
  book: string;
  chapter: number;
  paragraph: number;
  createdAt: number;
};

export type HighlightColor = "ember" | "circuit" | "sage" | "blush";

export type Highlight = {
  id: string;
  book: string;
  chapter: number;
  paragraph: number;
  text: string;
  color: HighlightColor;
  note?: string;
  createdAt: number;
};

export type ReaderPrefs = {
  fontSize: number; // px, 15-26
  lineHeight: number; // 1.4-2.1
  measure: "narrow" | "medium" | "wide";
  family: "serif" | "sans";
  view: "single" | "split";
  level: Level;
  focus: boolean;
};

export const DEFAULT_PREFS: ReaderPrefs = {
  fontSize: 19,
  lineHeight: 1.75,
  measure: "medium",
  family: "serif",
  view: "single",
  level: 2,
  focus: false,
};

export const shelfStore = createStore<Record<string, ShelfEntry>>("shelf", {});
export const progressStore = createStore<Record<string, ProgressEntry>>("progress", {});
export const bookmarkStore = createStore<Bookmark[]>("bookmarks", []);
export const highlightStore = createStore<Highlight[]>("highlights", []);
export const prefsStore = createStore<ReaderPrefs>("prefs", DEFAULT_PREFS);

export const useShelf = () => useStore(shelfStore);
export const useProgress = () => useStore(progressStore);
export const useBookmarks = () => useStore(bookmarkStore);
export const useHighlights = () => useStore(highlightStore);
export const useReaderPrefs = () => useStore(prefsStore);

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function setShelfStatus(slug: string, status: ShelfStatus | null) {
  shelfStore.set((prev) => {
    const next = { ...prev };
    if (status) next[slug] = { status, updatedAt: Date.now() };
    else delete next[slug];
    return next;
  });
}

export function saveProgress(slug: string, entry: Omit<ProgressEntry, "updatedAt">) {
  progressStore.set((prev) => ({ ...prev, [slug]: { ...entry, updatedAt: Date.now() } }));
  // Opening a book moves it onto the "reading" shelf unless it is already finished.
  const current = shelfStore.get()[slug];
  if (!current || current.status === "want") setShelfStatus(slug, "reading");
}

export function toggleBookmark(book: string, chapter: number, paragraph: number) {
  bookmarkStore.set((prev) => {
    const exists = prev.find(
      (b) => b.book === book && b.chapter === chapter && b.paragraph === paragraph,
    );
    if (exists) return prev.filter((b) => b.id !== exists.id);
    return [...prev, { id: uid(), book, chapter, paragraph, createdAt: Date.now() }];
  });
}

export function addHighlight(h: Omit<Highlight, "id" | "createdAt">) {
  highlightStore.set((prev) => [...prev, { ...h, id: uid(), createdAt: Date.now() }]);
}

export function updateHighlightNote(id: string, note: string) {
  highlightStore.set((prev) => prev.map((h) => (h.id === id ? { ...h, note } : h)));
}

export function removeHighlight(id: string) {
  highlightStore.set((prev) => prev.filter((h) => h.id !== id));
}

export function updatePrefs(patch: Partial<ReaderPrefs>) {
  prefsStore.set((prev) => ({ ...prev, ...patch }));
}
