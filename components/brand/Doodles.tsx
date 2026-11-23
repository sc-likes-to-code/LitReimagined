"use client";

import { m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Props = { className?: string; delay?: number };

/** Hand-drawn line art that draws itself as it scrolls into view. Decorative only. */
function Draw({
  className,
  delay = 0,
  children,
  viewBox,
}: Props & { children: React.ReactNode; viewBox: string }) {
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
      transition={{ staggerChildren: 0.12, delayChildren: delay }}
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

export function QuillDoodle(props: Props) {
  return (
    <Draw viewBox="0 0 160 220" {...props}>
      <m.path variants={stroke} d="M140 14C86 22 44 66 36 132c46-8 92-44 104-118Z" />
      <m.path variants={stroke} d="M36 190 106 72" />
      <m.path
        variants={stroke}
        d="M62 150c10-2 20-6 28-14M78 124c10-2 18-6 26-14M94 98c8-2 14-6 20-12"
      />
      <m.path variants={stroke} d="M30 196c-6 4-8 10-6 18" />
    </Draw>
  );
}

export function FernDoodle(props: Props) {
  return (
    <Draw viewBox="0 0 140 260" {...props}>
      <m.path variants={stroke} d="M70 252C66 190 70 120 100 18" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <m.path
          key={i}
          variants={stroke}
          d={`M${72 - i * 1.4} ${236 - i * 32}c-${26 - i * 2} -${6} -${40 - i * 3} -${22} -${44 - i * 3} -${34}M${74 - i * 1.4} ${222 - i * 32}c${22 - i} -${4} ${36 - i * 2} -${18} ${40 - i * 2} -${30}`}
        />
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
