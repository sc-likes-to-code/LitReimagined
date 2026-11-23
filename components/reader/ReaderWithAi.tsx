"use client";

import { Reader } from "@/components/reader/Reader";
import type { Chapter, ChapterSummary } from "@/lib/data/types";

type Props = {
  book: { slug: string; title: string; authorName: string };
  chapter: Chapter;
  chapters: ChapterSummary[];
};

/** Hosts the reader and (once enabled) the live AI panel. */
export function ReaderWithAi(props: Props) {
  return <Reader {...props} />;
}
