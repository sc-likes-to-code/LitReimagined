import Link from "next/link";
import { BookCard } from "@/components/book/BookCard";
import { Reveal } from "@/components/motion/Reveal";
import type { BookSummary } from "@/lib/data/types";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  books: BookSummary[];
  href?: string;
  linkLabel?: string;
};

export function Shelf({
  eyebrow,
  title,
  description,
  books,
  href,
  linkLabel = "See all",
}: Props) {
  if (books.length === 0) return null;
  return (
    <section className="container-page">
      <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
          <h2 className="font-display text-4xl tracking-tight sm:text-5xl">{title}</h2>
          {description && <p className="text-muted mt-3">{description}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="text-muted hover:text-ink text-sm underline decoration-[var(--line-strong)] underline-offset-[6px] transition-colors"
          >
            {linkLabel} →
          </Link>
        )}
      </Reveal>
      <ul className="-mx-5 flex snap-x gap-6 overflow-x-auto px-5 pb-6 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-8 sm:overflow-visible sm:px-0 lg:grid-cols-5">
        {books.map((b, i) => (
          <Reveal
            as="li"
            key={b.slug}
            delay={i * 0.06}
            className="w-40 shrink-0 snap-start sm:w-auto"
          >
            <BookCard book={b} />
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
