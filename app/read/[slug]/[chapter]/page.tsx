import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ReaderWithAi } from "@/components/reader/ReaderWithAi";
import { repo } from "@/lib/data";

export async function generateStaticParams() {
  const books = await repo.listBooks();
  const out: { slug: string; chapter: string }[] = [];
  for (const b of books) {
    const detail = await repo.getBook(b.slug);
    for (const c of detail?.chapters ?? [])
      out.push({ slug: b.slug, chapter: String(c.idx) });
  }
  return out;
}

export async function generateMetadata({
  params,
}: PageProps<"/read/[slug]/[chapter]">): Promise<Metadata> {
  const { slug, chapter } = await params;
  const book = await repo.getBook(slug);
  const ch = book?.chapters.find((c) => c.idx === Number(chapter));
  if (!book || !ch) return {};
  return { title: `${ch.title} · ${book.title}`, robots: { index: false } };
}

async function ReaderView({
  params,
}: {
  params: PageProps<"/read/[slug]/[chapter]">["params"];
}) {
  const { slug, chapter } = await params;
  const idx = Number(chapter);
  if (!Number.isInteger(idx) || idx < 0) notFound();

  const [book, ch] = await Promise.all([repo.getBook(slug), repo.getChapter(slug, idx)]);
  if (!book || !ch) notFound();

  return (
    <ReaderWithAi
      book={{ slug: book.slug, title: book.title, authorName: book.author.name }}
      chapter={ch}
      chapters={book.chapters}
    />
  );
}

export default function ReadPage({ params }: PageProps<"/read/[slug]/[chapter]">) {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-dvh place-items-center">
          <p className="font-display text-muted animate-pulse text-2xl italic">
            Opening the book…
          </p>
        </div>
      }
    >
      <ReaderView params={params} />
    </Suspense>
  );
}
