"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { BookCover } from "@/components/book/BookCover";
import type { BookSummary } from "@/lib/data/types";

const FAN = [
  { rot: -16, x: -46, y: 26, depth: 0.5, z: 1 },
  { rot: -8, x: -23, y: 8, depth: 0.8, z: 2 },
  { rot: 0, x: 0, y: 0, depth: 1.1, z: 5 },
  { rot: 8, x: 23, y: 8, depth: 0.8, z: 2 },
  { rot: 16, x: 46, y: 26, depth: 0.5, z: 1 },
];

/** A fan of covers that drifts gently and follows the pointer. */
export function HeroCovers({ books }: { books: BookSummary[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const mx = ((e.clientX - (r.left + r.width / 2)) / window.innerWidth) * 2;
        const my = ((e.clientY - (r.top + r.height / 2)) / window.innerHeight) * 2;
        el.style.setProperty("--mx", mx.toFixed(3));
        el.style.setProperty("--my", my.toFixed(3));
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const shown = books.slice(0, 5);
  return (
    <div
      ref={ref}
      className="relative mx-auto h-[clamp(15rem,34vw,26rem)] w-full max-w-4xl"
      style={{ "--mx": 0, "--my": 0 } as React.CSSProperties}
    >
      {shown.map((book, i) => {
        const f = FAN[i] ?? FAN[2];
        return (
          <div
            key={book.slug}
            className="absolute top-0 left-1/2 w-[clamp(7rem,17vw,12.5rem)]"
            style={{
              zIndex: f.z,
              transform: `translate(calc(-50% + ${f.x}% * 3.1 + var(--mx) * ${f.depth * 26}px), calc(${f.y}px + var(--my) * ${f.depth * 14}px)) rotate(${f.rot}deg)`,
              transition: "transform 0.5s var(--ease-signature)",
            }}
          >
            <Link
              href={`/books/${book.slug}`}
              className="float-y block transition-transform duration-500 hover:-translate-y-3"
              style={{ animationDelay: `${i * -1.3}s` }}
              aria-label={`${book.title} by ${book.author.name}`}
            >
              <BookCover
                book={book}
                priority={i === 2}
                className="shadow-[0_30px_60px_-24px_rgb(0_0_0/0.75)]"
              />
            </Link>
          </div>
        );
      })}
    </div>
  );
}
