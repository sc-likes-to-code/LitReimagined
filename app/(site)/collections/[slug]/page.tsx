import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BookCard } from "@/components/book/BookCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { repo } from "@/lib/data";

export async function generateStaticParams() {
  const cs = await repo.listCollections();
  return cs.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = await repo.getCollection(slug);
  return c ? { title: c.title, description: c.description } : {};
}

async function CollectionView({
  params,
}: {
  params: PageProps<"/collections/[slug]">["params"];
}) {
  const { slug } = await params;
  const c = await repo.getCollection(slug);
  if (!c) notFound();
  return (
    <div className="container-page pt-[calc(var(--nav-h)+4rem)]">
      <nav aria-label="Breadcrumb" className="text-faint mb-8 text-sm">
        <Link href="/collections" className="hover:text-ink">
          Collections
        </Link>
        <span aria-hidden> / </span>
        <span className="text-muted">{c.title}</span>
      </nav>
      <PageHeader eyebrow="Collection" title={c.title}>
        {c.description}
      </PageHeader>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-5">
        {c.books.map((b) => (
          <li key={b.slug}>
            <BookCard book={b} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="container-page pt-[calc(var(--nav-h)+6rem)]">
          <div className="bg-surface h-80 animate-pulse rounded-3xl" />
        </div>
      }
    >
      <CollectionView params={params} />
    </Suspense>
  );
}
