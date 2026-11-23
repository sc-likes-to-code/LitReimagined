"use client";

import { useCallback, useMemo, useState } from "react";
import { AiPanel, type AiPanelRequest } from "@/components/ai/AiPanel";
import { BookReader } from "@/components/reader/BookReader";
import { Reader, type AiRequest } from "@/components/reader/Reader";
import { addHighlight, useReaderPrefs } from "@/lib/client/library";
import type { Chapter, ChapterSummary } from "@/lib/data/types";
import { tidyOriginal } from "@/lib/reader/tidy";

type Props = {
  book: { slug: string; title: string; authorName: string };
  chapter: Chapter;
  chapters: ChapterSummary[];
};

/** Hosts the reader and the live AI panel (rewrite / explain) opened from the selection toolbar. */
export function ReaderWithAi({ chapter: rawChapter, ...rest }: Props) {
  const chapter = useMemo(
    () => ({ ...rawChapter, original: rawChapter.original.map(tidyOriginal) }),
    [rawChapter],
  );
  const props = { ...rest, chapter };
  const [request, setRequest] = useState<AiPanelRequest | null>(null);
  const mode = useReaderPrefs().mode;

  const open = useCallback(
    (r: AiRequest) =>
      setRequest({ ...r, book: `${props.book.title} by ${props.book.authorName}` }),
    [props.book.title, props.book.authorName],
  );

  return (
    <>
      {mode === "book" ? (
        <BookReader {...props} onAi={open} />
      ) : (
        <Reader {...props} onAi={open} />
      )}
      {request && (
        <AiPanel
          key={`${request.kind}:${request.text}`}
          request={request}
          onClose={() => setRequest(null)}
          onSave={(text, note) =>
            addHighlight({
              book: props.book.slug,
              chapter: props.chapter.idx,
              paragraph: Math.max(
                0,
                props.chapter.original.findIndex((p) => p.includes(text)),
              ),
              text,
              color: "circuit",
              note,
            })
          }
        />
      )}
    </>
  );
}
