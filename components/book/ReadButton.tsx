"use client";

import { ButtonLink } from "@/components/ui/Button";
import { useProgress, useShelf } from "@/lib/client/library";

/**
 * The main call to action on a book page: "Start reading" for a new reader, and
 * "Continue reading" (at the saved chapter) for someone partway through, the same
 * rule the library uses for its Resume cards.
 */
export function ReadButton({
  slug,
  firstChapter,
  chapters,
}: {
  slug: string;
  firstChapter: number;
  /** Chapter numbers that exist, so stale progress never links to a missing chapter. */
  chapters: number[];
}) {
  const progress = useProgress()[slug];
  const finished = useShelf()[slug]?.status === "finished";
  const resumeAt =
    progress && !finished && chapters.includes(progress.chapter) ? progress.chapter : null;

  return (
    <ButtonLink href={`/read/${slug}/${resumeAt ?? firstChapter}`} size="lg">
      {resumeAt === null ? "Start reading" : `Continue reading · Chapter ${resumeAt}`}
    </ButtonLink>
  );
}
