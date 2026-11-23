import Image from "next/image";
import type { BookSummary, CoverStyle } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Simple line-art motifs, drawn in the cover's ink colour. */
const MOTIFS: Record<CoverStyle["motif"], React.ReactNode> = {
  rose: (
    <g {...stroke}>
      <circle cx="50" cy="50" r="30" />
      <path d="M50 20c14 6 22 20 14 34-8 12-24 8-26-4-2-11 10-16 16-8 5 7-3 13-8 9" />
      <path d="M50 80v14M50 88c-8-2-12-8-12-12M50 90c8-2 12-8 12-12" />
    </g>
  ),
  bolt: (
    <g {...stroke}>
      <path d="M58 8 28 54h20l-8 38 34-50H52Z" />
      <circle cx="50" cy="50" r="42" strokeDasharray="2 5" />
    </g>
  ),
  moon: (
    <g {...stroke}>
      <path d="M62 14a38 38 0 1 0 22 56A32 32 0 0 1 62 14Z" />
      <path d="M78 22v8M74 26h8M30 18v6M27 21h6M86 56v6M83 59h6" />
    </g>
  ),
  heath: (
    <g {...stroke}>
      <path d="M6 66c14-14 26-14 40 0s26 14 48 0" />
      <path d="M6 80c14-14 26-14 40 0s26 14 48 0" />
      <path d="M6 52c14-14 26-14 40 0s26 14 48 0" />
      <circle cx="70" cy="24" r="9" />
    </g>
  ),
  star: (
    <g {...stroke}>
      <path d="m50 8 8 30 30 8-30 8-8 30-8-30-30-8 30-8Z" />
      <circle cx="50" cy="46" r="40" strokeDasharray="1 4" />
    </g>
  ),
  feather: (
    <g {...stroke}>
      <path d="M80 12C48 14 28 36 24 66c24-4 50-22 56-54Z" />
      <path d="M24 90 62 38M30 70h14M36 60h14" />
    </g>
  ),
  sea: (
    <g {...stroke}>
      <path d="M6 62c8-8 14-8 22 0s14 8 22 0 14-8 22 0 14 8 22 0" />
      <path d="M6 76c8-8 14-8 22 0s14 8 22 0 14-8 22 0 14 8 22 0" />
      <path d="M50 52c-4-16-18-24-26-20 10 2 14 10 12 20M50 52c4-16 18-24 26-20-10 2-14 10-12 20" />
    </g>
  ),
  mask: (
    <g {...stroke}>
      <path d="M14 22h72c0 34-12 54-36 56C26 76 14 56 14 22Z" />
      <path d="M28 40c6-4 12-4 16 2M72 40c-6-4-12-4-16 2" />
      <path d="M38 62c8 6 16 6 24 0" />
    </g>
  ),
  rabbit: (
    <g {...stroke}>
      <circle cx="50" cy="54" r="32" />
      <circle cx="50" cy="54" r="26" strokeDasharray="1 4" />
      <path d="M50 54V34M50 54l14 8" />
      <path d="M44 14h12M50 14v8" />
    </g>
  ),
  laurel: (
    <g {...stroke}>
      <circle cx="50" cy="50" r="12" />
      <path d="M30 78C14 64 12 40 24 22M36 80c-12-8-18-22-16-36M70 78c16-14 18-38 6-56M64 80c12-8 18-22 16-36" />
    </g>
  ),
  snow: (
    <g {...stroke}>
      <path d="M50 10v80M16 30l68 40M16 70l68-40" />
      <path d="M44 18l6 6 6-6M44 82l6-6 6 6" />
    </g>
  ),
  key: (
    <g {...stroke}>
      <circle cx="36" cy="36" r="18" />
      <circle cx="36" cy="36" r="6" />
      <path d="M50 50 86 86M70 70l8-8M78 78l8-8" />
    </g>
  ),
};

type Props = {
  book: Pick<BookSummary, "title" | "subtitle" | "author" | "coverUrl" | "coverStyle">;
  className?: string;
  priority?: boolean;
};

/**
 * Book cover. Uses the real cover image when there is one and otherwise draws a
 * consistent, typographic cover from the book's `coverStyle`. Sized by its
 * container; type scales with the cover's own width.
 */
export function BookCover({ book, className, priority }: Props) {
  const { from, to, ink, motif } = book.coverStyle;

  if (book.coverUrl) {
    return (
      <div
        className={cn(
          "relative aspect-[2/3] overflow-hidden rounded-[4px_8px_8px_4px]",
          className,
        )}
      >
        <Image
          src={book.coverUrl}
          alt={`Cover of ${book.title}`}
          fill
          sizes="(min-width: 1024px) 20vw, 50vw"
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`Cover of ${book.title} by ${book.author.name}`}
      className={cn(
        "[container-type:inline-size] relative aspect-[2/3] overflow-hidden rounded-[3px_8px_8px_3px]",
        className,
      )}
      style={{ background: `linear-gradient(155deg, ${from}, ${to})`, color: ink }}
    >
      {/* spine shading + page edge highlight */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-[7%]"
        style={{
          background:
            "linear-gradient(90deg, rgb(0 0 0 / .45), rgb(255 255 255 / .12) 55%, transparent)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-[5%] rounded-[2px] border border-current opacity-30"
      />
      <div
        aria-hidden
        className="absolute inset-[7%] rounded-[2px] border border-current opacity-15"
      />

      <div className="absolute inset-0 flex flex-col items-center px-[14%] py-[12%] text-center">
        <svg viewBox="0 0 100 100" className="mt-[2%] w-[46%] opacity-90" aria-hidden>
          {MOTIFS[motif]}
        </svg>
        <p
          className="font-display mt-auto leading-[1.02] font-medium tracking-tight text-balance"
          style={{ fontSize: "12.5cqw" }}
        >
          {book.title}
        </p>
        {book.subtitle && (
          <p
            className="mt-[3%] italic opacity-75"
            style={{ fontSize: "5.2cqw", lineHeight: 1.25 }}
          >
            {book.subtitle}
          </p>
        )}
        <span aria-hidden className="my-[7%] h-px w-[22%] bg-current opacity-50" />
        <p
          className="uppercase opacity-80"
          style={{ fontSize: "4.6cqw", letterSpacing: "0.22em" }}
        >
          {book.author.name}
        </p>
      </div>
    </div>
  );
}
