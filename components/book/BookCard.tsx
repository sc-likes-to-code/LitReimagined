import Link from "next/link";
import { BookCover } from "@/components/book/BookCover";
import type { BookSummary } from "@/lib/data/types";
import { cn } from "@/lib/utils";

/** A cover that lifts and tilts on hover, with title and author beneath. */
export function BookCard({ book, className }: { book: BookSummary; className?: string }) {
  return (
    <Link
      href={`/books/${book.slug}`}
      className={cn("group block [perspective:900px]", className)}
      aria-label={`${book.title} by ${book.author.name}`}
    >
      <div className="transition-transform duration-500 ease-[var(--ease-signature)] [transform-style:preserve-3d] group-hover:[transform:rotateY(-10deg)_rotateX(3deg)_translateY(-6px)]">
        <BookCover
          book={book}
          className="shadow-[0_22px_40px_-20px_rgb(var(--shadow-color)/0.7)] transition-shadow duration-500 group-hover:shadow-[0_34px_50px_-18px_rgb(var(--shadow-color)/0.8)]"
        />
      </div>
      <div className="mt-4">
        <h3 className="font-display group-hover:text-gradient-ember text-lg leading-snug">
          {book.title}
        </h3>
        <p className="text-muted mt-0.5 text-sm">{book.author.name}</p>
        <p className="text-faint mt-1 text-xs">
          {book.readingMinutes >= 60
            ? `${Math.round(book.readingMinutes / 60)} hr read`
            : `${book.readingMinutes} min read`}
          {" · "}
          {book.genres[0]}
        </p>
      </div>
    </Link>
  );
}
