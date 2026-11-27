import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BookCover } from "@/components/book/BookCover";
import { DifficultyDots } from "@/components/book/DifficultyDots";
import { ReadButton } from "@/components/book/ReadButton";
import { ShelfButton } from "@/components/book/ShelfButton";
import { Shelf } from "@/components/home/Shelf";
import { SliderDemo } from "@/components/home/SliderDemo";
import { Badge } from "@/components/ui/Badge";
import { repo } from "@/lib/data";
import { publicEnv } from "@/lib/env";

export async function generateStaticParams() {
  const books = await repo.listBooks();
  return books.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/books/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const book = await repo.getBook(slug);
  if (!book) return {};
  return {
    title: `${book.title} by ${book.author.name}`,
    description: book.synopsis,
    openGraph: { title: `${book.title} · LitReimagined`, description: book.synopsis },
  };
}

function formatYear(y: number | null) {
  if (y === null) return "Antiquity";
  return String(y);
}

function readingTime(min: number) {
  return min >= 60
    ? `${Math.floor(min / 60)} hr ${min % 60 ? `${min % 60} min` : ""}`.trim()
    : `${min} min`;
}

async function BookView({ params }: { params: PageProps<"/books/[slug]">["params"] }) {
  const { slug } = await params;
  const book = await repo.getBook(slug);
  if (!book) notFound();

  const first = book.chapters[0];
  const [sample, related] = await Promise.all([
    first ? repo.getChapter(slug, first.idx) : Promise.resolve(null),
    repo.listBooks({ genre: book.genres[0], sort: "featured" }),
  ]);
  const similar = related.filter((b) => b.slug !== slug).slice(0, 5);
  const hasModern = Boolean(
    sample?.translations[1] || sample?.translations[2] || sample?.translations[3],
  );
  // Preview the first few real paragraphs, skipping headings, dates and one-line salutations.
  const previewIdx = sample
    ? sample.original.flatMap((p, i) => (p.length >= 60 ? [i] : [])).slice(0, 3)
    : [];
  const pick = (paras?: string[]) =>
    paras ? previewIdx.map((i) => paras[i]) : undefined;
  const canDemo = hasModern && previewIdx.length > 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: { "@type": "Person", name: book.author.name },
    datePublished: book.originalYear ?? undefined,
    genre: book.genres,
    description: book.synopsis,
    inLanguage: "en",
    url: `${publicEnv.siteUrl}/books/${book.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <section className="container-page pt-[calc(var(--nav-h)+3rem)]">
        <nav aria-label="Breadcrumb" className="text-faint mb-10 text-sm">
          <Link href="/explore" className="hover:text-ink">
            Library
          </Link>
          <span aria-hidden> / </span>
          <span className="text-muted">{book.title}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
          <div className="mx-auto w-full max-w-[18rem] lg:max-w-none">
            <div className="[perspective:1200px] lg:sticky lg:top-28">
              <div className="transition-transform duration-700 ease-[var(--ease-signature)] hover:[transform:rotateY(-8deg)_rotateX(2deg)]">
                <BookCover
                  book={book}
                  priority
                  className="shadow-[0_50px_80px_-30px_rgb(var(--shadow-color)/0.85)]"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              {book.genres.map((g) => (
                <Link key={g} href={`/explore?genre=${encodeURIComponent(g)}`}>
                  <Badge className="hover:text-ink transition-colors">{g}</Badge>
                </Link>
              ))}
            </div>
            <h1 className="font-display mt-6 text-5xl leading-[1.02] tracking-tight sm:text-7xl">
              {book.title}
            </h1>
            {book.subtitle && (
              <p className="font-display text-muted mt-3 text-xl italic">
                {book.subtitle}
              </p>
            )}
            <p className="mt-5 text-lg">
              by{" "}
              <Link
                href={`/authors/${book.author.slug}`}
                className="underline decoration-[var(--line-strong)] underline-offset-[6px] hover:decoration-[var(--ember)]"
              >
                {book.author.name}
              </Link>
            </p>

            <dl className="border-line mt-8 grid max-w-xl grid-cols-2 gap-6 border-y py-6 sm:grid-cols-4">
              {[
                ["Published", formatYear(book.originalYear)],
                ["Era", book.era ?? "Unknown"],
                ["Reading time", readingTime(book.readingMinutes)],
                ["Length", `${Math.round(book.wordCount / 1000)}k words`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="eyebrow">{k}</dt>
                  <dd className="mt-1.5 text-sm">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-muted mt-4 text-sm">
              <DifficultyDots value={book.difficulty} />
            </p>

            <p className="font-reading mt-8 max-w-2xl text-xl leading-relaxed">
              {book.synopsis}
            </p>
            <blockquote className="border-ember mt-6 max-w-2xl border-l-2 pl-5">
              <p className="eyebrow mb-1.5">Why read it</p>
              <p className="text-muted leading-relaxed">{book.whyRead}</p>
            </blockquote>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              {first ? (
                <ReadButton
                  slug={book.slug}
                  firstChapter={first.idx}
                  chapters={book.chapters.map((c) => c.idx)}
                />
              ) : (
                <span className="text-muted text-sm">Chapters are on their way.</span>
              )}
              <ShelfButton slug={book.slug} />
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {book.moods.map((m) => (
                <Link
                  key={m}
                  href={`/explore?mood=${encodeURIComponent(m)}`}
                  className="text-faint hover:text-ink text-sm transition-colors"
                >
                  #{m}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {canDemo && sample && (
        <section className="container-page mt-28">
          <div className="mb-8 max-w-xl">
            <p className="eyebrow mb-3">Preview</p>
            <h2 className="font-display text-4xl tracking-tight">
              Hear it <em className="font-normal italic">your</em> way.
            </h2>
          </div>
          <div className="max-w-3xl">
            <SliderDemo
              source={`${book.title} · ${sample.title}`}
              original={pick(sample.original)!}
              levels={{
                1: pick(sample.translations[1]),
                2: pick(sample.translations[2]),
                3: pick(sample.translations[3]),
              }}
            />
          </div>
        </section>
      )}

      {book.chapters.length > 0 && (
        <section className="container-page mt-28">
          <h2 className="font-display mb-8 text-4xl tracking-tight">Chapters</h2>
          <ol className="border-line max-w-3xl divide-y divide-[var(--line)] border-y">
            {book.chapters.map((c) => (
              <li key={c.idx}>
                <Link
                  href={`/read/${book.slug}/${c.idx}`}
                  className="hover:bg-surface group flex items-center justify-between gap-4 px-2 py-5 transition-colors"
                >
                  <span>
                    <span className="text-faint mr-4 text-sm tabular-nums">
                      {String(c.idx).padStart(2, "0")}
                    </span>
                    <span className="font-display text-xl">{c.title}</span>
                  </span>
                  <span className="text-faint text-sm transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {similar.length > 0 && (
        <div className="mt-28">
          <Shelf eyebrow="Keep going" title="If you like this" books={similar} />
        </div>
      )}
    </>
  );
}

export default function BookPage({ params }: PageProps<"/books/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="container-page pt-[calc(var(--nav-h)+6rem)]">
          <div className="bg-surface h-[32rem] animate-pulse rounded-3xl" />
        </div>
      }
    >
      <BookView params={params} />
    </Suspense>
  );
}
