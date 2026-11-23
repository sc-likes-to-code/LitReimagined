"use client";

import { useState } from "react";
import { LevelSlider } from "@/components/reader/LevelSlider";
import { MorphText } from "@/components/reader/MorphText";
import { LEVEL_LABELS, type Level } from "@/lib/data/types";

type Props = {
  source: string;
  original: string[];
  levels: { 1: string[]; 2: string[]; 3: string[] };
};

/** A live, free taste of the product: drag to modernize a famous passage. */
export function SliderDemo({ source, original, levels }: Props) {
  const [level, setLevel] = useState<Level>(0);
  const paras = level === 0 ? original : levels[level];

  return (
    <div className="glass rounded-[2rem] p-6 sm:p-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <span className="eyebrow">{source}</span>
        <span
          className="text-circuit text-xs font-medium tracking-wide uppercase"
          aria-live="polite"
        >
          {LEVEL_LABELS[level]}
        </span>
      </div>
      <div className="min-h-[15rem] space-y-5 sm:min-h-[13rem]" aria-live="polite">
        {paras.map((p, i) => (
          <p
            key={i}
            className={
              level === 0
                ? "font-reading text-lg leading-[1.75] sm:text-xl"
                : "font-sans text-lg leading-[1.7] sm:text-xl"
            }
          >
            <MorphText text={p} version={`${level}-${i}`} words />
          </p>
        ))}
      </div>
      <LevelSlider value={level} onChange={setLevel} className="mt-8" />
    </div>
  );
}
