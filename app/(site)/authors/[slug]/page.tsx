import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AuthorPortrait } from "@/components/author/AuthorPortrait";
import { BookCard } from "@/components/book/BookCard";
import { ButtonLink } from "@/components/ui/Button";
import { repo } from "@/lib/data";

export async function generateStaticParams() {
  const authors = await repo.listAuthors();
  return authors.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/authors/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = await repo.getAuthor(slug);
  return a ? { title: a.name, description: a.bio } : {};
}

async function AuthorView({
  params,
}: {
  params: PageProps<"/authors/[slug]">["params"];
}) {
  const { slug } = await params;
  const author = await repo.getAuthor(slug);
  if (!author) notFound();

  const start = author.books[0];
  const lifespan =
    author.bornYear !== null && author.diedYear !== null
      ? author.diedYear - author.bornYear
      : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    birthDate: author.bornYear ?? undefined,
    deathDate: author.diedYear ?? undefined,
    nationality: author.nationality ?? undefined,
    description: author.bio,
  };

  return (
    <div className="container-page pt-[calc(var(--nav-h)+3rem)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <nav aria-label="Breadcrumb" className="text-faint mb-10 text-sm">
        <Link href="/authors" className="hover:text-ink">
          Authors
        </Link>
        <span aria-hidden> / </span>
        <span className="text-muted">{author.name}</span>
      </nav>

      <header className="grid items-center gap-10 md:grid-cols-[auto_1fr]">
        <AuthorPortrait
          name={author.name}
          slug={author.slug}
          className="size-40 text-3xl sm:size-52"
        />
        <div>
          <p className="eyebrow mb-3">
            {author.nationality ?? "Author"}
            {author.bornYear !== null || author.diedYear !== null
              ? ` · ${author.bornYear ?? "?"} – ${author.diedYear ?? "?"}`
              : ""}
          </p>
          <h1 className="font-display text-5xl tracking-tight sm:text-7xl">
            {author.name}
          </h1>
          <p className="font-reading text-muted mt-6 max-w-2xl text-xl leading-relaxed">
            {author.bio}
          </p>
          {lifespan !== null && (
            <p className="text-faint mt-3 text-sm">Lived {lifespan} years.</p>
          )}
        </div>
      </header>

      {start && (
        <section className="border-line mt-16 flex flex-wrap items-center justify-between gap-6 rounded-3xl border p-8">
          <div>
            <p className="eyebrow mb-2">Start here</p>
            <p className="font-display text-2xl">{start.title}</p>
            <p className="text-muted mt-1 max-w-md text-sm">{start.whyRead}</p>
          </div>
          <ButtonLink href={`/books/${start.slug}`}>Open the book</ButtonLink>
        </section>
      )}

      <section className="mt-20">
        <h2 className="font-display mb-10 text-4xl tracking-tight">
          Books on LitReimagined
        </h2>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-5">
          {author.books.map((b) => (
            <li key={b.slug}>
              <BookCard book={b} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function AuthorPage({ params }: PageProps<"/authors/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="container-page pt-[calc(var(--nav-h)+6rem)]">
          <div className="bg-surface h-80 animate-pulse rounded-3xl" />
        </div>
      }
    >
      <AuthorView params={params} />
    </Suspense>
  );
}
