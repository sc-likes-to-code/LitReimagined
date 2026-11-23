"use client";

import { m, useReducedMotion } from "motion/react";
import { fernArt, quillArt } from "@/lib/brand/botanical";
import { cn } from "@/lib/utils";

type Props = { className?: string; delay?: number };

/** Hand-drawn line art that draws itself as it scrolls into view. Decorative only. */
function Draw({
  className,
  delay = 0,
  children,
  viewBox,
  stagger = 0.12,
}: Props & { children: React.ReactNode; viewBox: string; stagger?: number }) {
  const reduce = useReducedMotion();
  return (
    <m.svg
      aria-hidden
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("pointer-events-none text-[var(--text-faint)] opacity-60", className)}
      initial={reduce ? false : "hidden"}
      whileInView="shown"
      viewport={{ once: true, margin: "-15% 0px" }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
    >
      {children}
    </m.svg>
  );
}

const stroke = {
  hidden: { pathLength: 0, opacity: 0 },
  shown: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const fine = {
  hidden: { pathLength: 0, opacity: 0 },
  shown: {
    pathLength: 1,
    opacity: 0.6,
    transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const quill = quillArt();
const fern = fernArt();

/** A quill with a feathered vane, fine barbs and a flick of ink. */
export function QuillDoodle(props: Props) {
  return (
    <Draw viewBox="0 0 200 310" stagger={0.035} {...props}>
      <m.path variants={stroke} d={quill.vane} fill="currentColor" fillOpacity={0.05} />
      {quill.barbs.map((d, i) => (
        <m.path key={i} variants={fine} d={d} />
      ))}
      <m.path variants={stroke} d={quill.shaft} strokeWidth={1.7} />
      {quill.base.map((d, i) => (
        <m.path key={i} variants={fine} d={d} />
      ))}
      <m.path variants={stroke} d={quill.drop} fill="currentColor" />
    </Draw>
  );
}

/** A curving fern frond; leaflets shrink toward the tip. */
export function FernDoodle(props: Props) {
  return (
    <Draw viewBox="0 0 200 340" stagger={0.03} {...props}>
      <m.path variants={stroke} d={fern.spine} strokeWidth={1.7} />
      {fern.leaflets.map((d, i) => (
        <m.path key={i} variants={stroke} d={d} fill="currentColor" fillOpacity={0.05} />
      ))}
      {fern.veins.map((d, i) => (
        <m.path key={i} variants={fine} d={d} />
      ))}
    </Draw>
  );
}

export function OrbitDoodle(props: Props) {
  return (
    <Draw viewBox="0 0 200 200" {...props}>
      <m.circle variants={stroke} cx="100" cy="100" r="74" />
      <m.ellipse
        variants={stroke}
        cx="100"
        cy="100"
        rx="96"
        ry="30"
        transform="rotate(-24 100 100)"
      />
      <m.circle variants={stroke} cx="168" cy="60" r="6" />
      <m.path variants={stroke} d="M20 40v10M15 45h10M176 150v8M172 154h8" />
    </Draw>
  );
}

export function TypewriterDoodle(props: Props) {
  return (
    <Draw viewBox="0 0 220 160" {...props}>
      <m.path variants={stroke} d="M52 12h116v44H52Z" />
      <m.path variants={stroke} d="M64 28h92M64 40h60" />
      <m.path
        variants={stroke}
        d="M20 72h180a12 12 0 0 1 12 12v50a12 12 0 0 1-12 12H20a12 12 0 0 1-12-12V84a12 12 0 0 1 12-12Z"
      />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <m.circle key={i} variants={stroke} cx={34 + i * 25} cy={96} r="5" />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <m.circle key={i} variants={stroke} cx={46 + i * 25} cy={118} r="5" />
      ))}
    </Draw>
  );
}
