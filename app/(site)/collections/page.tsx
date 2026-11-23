import type { Metadata } from "next";
import Link from "next/link";
import { BookCover } from "@/components/book/BookCover";
import { PageHeader } from "@/components/ui/PageHeader";
import { repo } from "@/lib/data";

export const metadata: Metadata = {
  title: "Collections",
  description: "Hand-picked reading lists for every mood.",
};

export default async function CollectionsPage() {
  const collections = await repo.listCollections();
  return (
    <div className="container-page pt-[calc(var(--nav-h)+4rem)]">
      <PageHeader
        eyebrow="Curated"
        title={
          <>
            Reading lists for{" "}
            <em className="text-gradient-ember font-normal">every mood.</em>
          </>
        }
      >
        Not sure where to begin? Start with a theme and let the shelf do the rest.
      </PageHeader>
      <ul className="grid gap-6 md:grid-cols-2">
        {collections.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/collections/${c.slug}`}
              className="hairline hover:bg-surface group block overflow-hidden rounded-[2rem] p-8 transition-colors"
            >
              <div className="mb-8 flex h-40 items-end -space-x-6">
                {c.books.slice(0, 4).map((b, i) => (
                  <div
                    key={b.slug}
                    className="w-24 shrink-0 transition-transform duration-500 ease-[var(--ease-signature)] group-hover:-translate-y-2"
                    style={{ transform: `rotate(${(i - 1.5) * 4}deg)`, zIndex: i }}
                  >
                    <BookCover book={b} className="shadow-xl" />
                  </div>
                ))}
              </div>
              <h2 className="font-display text-3xl">{c.title}</h2>
              <p className="text-muted mt-2 max-w-md text-sm leading-relaxed">
                {c.description}
              </p>
              <p className="text-faint mt-4 text-xs">{c.books.length} books</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
