"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookCover } from "@/components/book/BookCover";
import { ReadingRhythm } from "@/components/library/ReadingRhythm";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useUser } from "@/lib/client/auth";
import {
  removeHighlight,
  setShelfStatus,
  toggleBookmark,
  useBookmarks,
  useHighlights,
  useProgress,
  useShelf,
  type ShelfStatus,
} from "@/lib/client/library";
import type { BookSummary } from "@/lib/data/types";
import { cn } from "@/lib/utils";

type Tab = "all" | ShelfStatus;
const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "reading", label: "Reading" },
  { id: "want", label: "Want to read" },
  { id: "finished", label: "Finished" },
];

export function LibraryView({ books }: { books: BookSummary[] }) {
  const bySlug = useMemo(() => new Map(books.map((b) => [b.slug, b])), [books]);
  const shelf = useShelf();
  const progress = useProgress();
  const highlights = useHighlights();
  const bookmarks = useBookmarks();
  const { user, configured, loading } = useUser();
  const [tab, setTab] = useState<Tab>("all");
  const [copied, setCopied] = useState(false);

  const shelved = Object.entries(shelf)
    .filter(([slug, e]) => bySlug.has(slug) && (tab === "all" || e.status === tab))
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt);

  const continueReading = Object.entries(progress)
    .filter(([slug]) => bySlug.has(slug) && shelf[slug]?.status !== "finished")
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
    .slice(0, 3);

  const notes = highlights
    .filter((h) => bySlug.has(h.book))
    .sort((a, b) => b.createdAt - a.createdAt);
  const marks = bookmarks
    .filter((b) => bySlug.has(b.book))
    .sort((a, b) => b.createdAt - a.createdAt);
  const isEmpty =
    shelved.length === 0 &&
    continueReading.length === 0 &&
    notes.length === 0 &&
    marks.length === 0;

  async function exportNotes() {
    const md = notes
      .map((h) => {
        const b = bySlug.get(h.book)!;
        return `> ${h.text}\n\n— ${b.author.name}, *${b.title}*${h.note ? `\n\nNote: ${h.note}` : ""}`;
      })
      .join("\n\n---\n\n");
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="container-page pt-[calc(var(--nav-h)+4rem)]">
      <header className="mb-12 max-w-2xl">
        <p className="eyebrow mb-4">Your shelf</p>
        <h1 className="font-display text-5xl tracking-tight sm:text-6xl">
          Your <em className="text-gradient-ember font-normal">library.</em>
        </h1>
        {!loading && !user && (
          <p className="text-muted mt-5 max-w-lg text-sm leading-relaxed">
            {configured ? (
              <>
                You are reading as a guest, so everything is saved in this browser.{" "}
                <Link
                  href="/login?next=/library"
                  className="text-ink underline underline-offset-4"
                >
                  Sign in
                </Link>{" "}
                to keep it on every device.
              </>
            ) : (
              "Everything here is saved in this browser. Accounts for syncing across devices are coming soon."
            )}
          </p>
        )}
      </header>

      {isEmpty && (
        <div className="border-line grid place-items-center rounded-[2rem] border border-dashed px-6 py-24 text-center">
          <p className="font-display text-3xl">Your shelf is empty, for now.</p>
          <p className="text-muted mt-3 max-w-sm">
            Start a book, or mark one as &ldquo;want to read&rdquo;, and it will appear
            here along with your place, highlights and notes.
          </p>
          <ButtonLink href="/explore" className="mt-8">
            Browse the library
          </ButtonLink>
        </div>
      )}

      {!isEmpty && <ReadingRhythm />}

      {continueReading.length > 0 && (
        <section className="mb-20">
          <h2 className="font-display mb-6 text-3xl">Continue reading</h2>
          <ul className="grid gap-5 md:grid-cols-3">
            {continueReading.map(([slug, p]) => {
              const b = bySlug.get(slug)!;
              return (
                <li key={slug}>
                  <Link
                    href={`/read/${slug}/${p.chapter}`}
                    className="hairline hover:bg-surface group flex gap-5 rounded-3xl p-5 transition-colors"
                  >
                    <BookCover book={b} className="w-20 shrink-0 shadow-lg" />
                    <div className="min-w-0 self-center">
                      <p className="font-display text-xl leading-snug">{b.title}</p>
                      <p className="text-muted mt-1 text-sm">Chapter {p.chapter}</p>
                      <p className="text-ember mt-3 text-sm group-hover:underline">
                        Resume →
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {Object.keys(shelf).some((s) => bySlug.has(s)) && (
        <section className="mb-20">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-3xl">Shelves</h2>
            <div
              role="tablist"
              aria-label="Shelf"
              className="hairline inline-flex rounded-full p-1"
            >
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm transition-colors",
                    tab === t.id ? "bg-ink text-bg" : "text-muted hover:text-ink",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {shelved.length === 0 ? (
            <p className="text-muted text-sm">Nothing here yet.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
              {shelved.map(([slug, e]) => {
                const b = bySlug.get(slug)!;
                return (
                  <li key={slug}>
                    <Link href={`/books/${slug}`} aria-label={b.title}>
                      <BookCover book={b} className="shadow-xl" />
                    </Link>
                    <p className="font-display mt-3 leading-snug">{b.title}</p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-faint text-xs capitalize">
                        {e.status === "want" ? "Want to read" : e.status}
                      </span>
                      <button
                        onClick={() => setShelfStatus(slug, null)}
                        className="text-faint hover:text-ember text-xs underline underline-offset-4"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {notes.length > 0 && (
        <section className="mb-20">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-3xl">Highlights &amp; notes</h2>
            <Button variant="secondary" size="sm" onClick={exportNotes}>
              {copied ? "Copied" : "Copy all as Markdown"}
            </Button>
          </div>
          <ul className="grid gap-5 md:grid-cols-2">
            {notes.map((h) => {
              const b = bySlug.get(h.book)!;
              return (
                <li key={h.id} className="hairline rounded-3xl p-6">
                  <blockquote className="font-reading border-ember border-l-2 pl-4 text-lg leading-relaxed">
                    {h.text}
                  </blockquote>
                  {h.note && (
                    <p className="text-muted mt-4 text-sm leading-relaxed">{h.note}</p>
                  )}
                  <div className="mt-5 flex items-center justify-between gap-3 text-xs">
                    <Link
                      href={`/read/${h.book}/${h.chapter}`}
                      className="text-faint hover:text-ink"
                    >
                      {b.title} · {b.author.name}
                    </Link>
                    <button
                      onClick={() => removeHighlight(h.id)}
                      className="text-faint hover:text-ember underline underline-offset-4"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {marks.length > 0 && (
        <section>
          <h2 className="font-display mb-6 text-3xl">Bookmarks</h2>
          <ul className="border-line divide-y divide-[var(--line)] border-y">
            {marks.map((m) => {
              const b = bySlug.get(m.book)!;
              return (
                <li key={m.id} className="flex items-center justify-between gap-4 py-4">
                  <Link
                    href={`/read/${m.book}/${m.chapter}`}
                    className="hover:text-ember"
                  >
                    <span className="font-display text-lg">{b.title}</span>
                    <span className="text-faint ml-3 text-sm">
                      Chapter {m.chapter} · paragraph {m.paragraph + 1}
                    </span>
                  </Link>
                  <button
                    onClick={() => toggleBookmark(m.book, m.chapter, m.paragraph)}
                    className="text-faint hover:text-ember text-xs underline underline-offset-4"
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
