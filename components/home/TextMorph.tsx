"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const PAIRS = [
  {
    original: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
    modern: "Everyone knows that a rich, single guy is basically shopping for a wife.",
    source: "Pride and Prejudice",
  },
  {
    original: "Whether I shall turn out to be the hero of my own life, these pages must show.",
    modern: "Am I the main character of my own story? Read on and find out.",
    source: "David Copperfield",
  },
  {
    original: "I am no bird; and no net ensnares me: I am a free human being with an independent will.",
    modern: "I'm not a trapped bird. I'm a free person, and I make my own choices.",
    source: "Jane Eyre",
  },
];

/** A small, honest teaser of the product: the original line dissolving into a modern one. */
export function TextMorph() {
  const [i, setI] = useState(0);
  const [modern, setModern] = useState(false);

  useEffect(() => {
    const t = setTimeout(
      () => {
        if (!modern) setModern(true);
        else {
          setModern(false);
          setI((n) => (n + 1) % PAIRS.length);
        }
      },
      modern ? 3800 : 3400,
    );
    return () => clearTimeout(t);
  }, [modern, i]);

  const pair = PAIRS[i];
  return (
    <figure className="glass relative mx-auto w-full max-w-2xl overflow-hidden rounded-3xl p-7 sm:p-9">
      <div className="mb-5 flex items-center justify-between">
        <span className="eyebrow">{modern ? "Modern" : "Original"}</span>
        <span className="flex gap-1.5" aria-hidden>
          <span className={`h-1.5 w-8 rounded-full transition-colors duration-500 ${!modern ? "bg-ember" : "bg-line-strong"}`} />
          <span className={`h-1.5 w-8 rounded-full transition-colors duration-500 ${modern ? "bg-circuit" : "bg-line-strong"}`} />
        </span>
      </div>
      <div className="min-h-[7.5rem]" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={`${i}-${modern}`}
            initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={
              modern
                ? "font-sans text-lg leading-relaxed sm:text-xl"
                : "font-reading text-lg leading-relaxed italic sm:text-xl"
            }
          >
            {modern ? pair.modern : pair.original}
          </motion.blockquote>
        </AnimatePresence>
      </div>
      <figcaption className="text-faint mt-5 text-sm">{pair.source}</figcaption>
    </figure>
  );
}
