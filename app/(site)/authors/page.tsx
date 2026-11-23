import type { Metadata } from "next";
import Link from "next/link";
import { AuthorPortrait } from "@/components/author/AuthorPortrait";
import { PageHeader } from "@/components/ui/PageHeader";
import { repo } from "@/lib/data";

export const metadata: Metadata = {
  title: "Authors",
  description: "The writers behind the classics, and where to start with each.",
};

function years(b: number | null, d: number | null) {
  if (b === null && d === null) return "Ancient";
  return `${b ?? "?"} – ${d ?? "?"}`;
}

export default async function AuthorsPage() {
  const authors = await repo.listAuthors();
  return (
    <div className="container-page pt-[calc(var(--nav-h)+4rem)]">
      <PageHeader
        eyebrow="The writers"
        title={
          <>
            The minds behind{" "}
            <em className="text-gradient-ember font-normal">the books.</em>
          </>
        }
      >
        Meet the authors, and find the best place to begin with each of them.
      </PageHeader>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {authors.map((a) => (
          <li key={a.slug}>
            <Link
              href={`/authors/${a.slug}`}
              className="hairline hover:bg-surface group flex h-full gap-5 rounded-3xl p-6 transition-colors"
            >
              <AuthorPortrait
                name={a.name}
                slug={a.slug}
                className="size-20 shrink-0 text-xl transition-transform duration-500 group-hover:rotate-6"
              />
              <div className="min-w-0">
                <h2 className="font-display text-2xl leading-tight">{a.name}</h2>
                <p className="text-faint mt-1 text-sm">
                  {years(a.bornYear, a.diedYear)}
                  {a.nationality ? ` · ${a.nationality}` : ""}
                </p>
                <p className="text-muted mt-3 line-clamp-2 text-sm leading-relaxed">
                  {a.bio}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
