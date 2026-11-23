"use client";

import { m, useReducedMotion } from "motion/react";
import { fernArt, quillArt, sprigArt } from "@/lib/brand/botanical";
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
      viewport={{ once: true, margin: "0px 0px -3% 0px" }}
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

/* ------------------------------------------------------------------
   More doodles, each a small scene from a reader's desk
------------------------------------------------------------------- */

const sprig = sprigArt();

/** A laurel sprig; good as a quiet divider. */
export function SprigDoodle(props: Props) {
  return (
    <Draw viewBox="0 0 260 100" stagger={0.04} {...props}>
      <m.path variants={stroke} d={sprig.spine} strokeWidth={1.6} />
      {sprig.leaves.map((d, i) => (
        <m.path key={i} variants={stroke} d={d} fill="currentColor" fillOpacity={0.05} />
      ))}
      {sprig.veins.map((d, i) => (
        <m.path key={i} variants={fine} d={d} />
      ))}
    </Draw>
  );
}

/** An inkwell with a quill resting in it. */
export function InkwellDoodle(props: Props) {
  return (
    <Draw viewBox="0 0 200 230" stagger={0.1} {...props}>
      <m.path
        variants={stroke}
        d="M52 124h96c10 0 16 8 14 18l-6 44c-1 8-8 14-16 14H60c-8 0-15-6-16-14l-6-44c-2-10 4-18 14-18Z"
      />
      <m.path variants={stroke} d="M76 124v-16h48v16M70 108h60" />
      <m.path variants={fine} d="M44 152c26 9 86 9 112 0" />
      <m.path variants={fine} d="M56 148c-2 10-1 22 3 32" />
      <m.path variants={stroke} d="M112 106 172 12" strokeWidth={1.6} />
      <m.path
        variants={stroke}
        d="M172 12c-26 4-46 28-52 62 26-6 48-26 52-62Z"
        fill="currentColor"
        fillOpacity={0.05}
      />
      <m.path
        variants={fine}
        d="M150 38c-8 6-14 14-20 24M158 28c-4 10-6 20-4 30M140 52c-6 4-10 10-12 16"
      />
      <m.path variants={fine} d="M30 214c20 6 120 6 140 0" />
      <m.path
        variants={stroke}
        d="M178 190c-3 4-5 6-5 9a5 5 0 0 0 10 0c0-3-2-5-5-9Z"
        fill="currentColor"
        fillOpacity={0.12}
      />
    </Draw>
  );
}

/** An open book with a few sparks drifting up. */
export function OpenBookDoodle(props: Props) {
  return (
    <Draw viewBox="0 0 240 190" stagger={0.1} {...props}>
      <m.path variants={stroke} d="M120 56C96 42 58 40 22 48v112c36-8 74-6 98 8Z" />
      <m.path variants={stroke} d="M120 56c24-14 62-16 98-8v112c-36-8-74-6-98 8Z" />
      <m.path variants={stroke} d="M120 56v112" />
      <m.path
        variants={fine}
        d="M40 72c22-4 46-2 66 6M40 92c22-4 46-2 66 6M40 112c22-4 46-2 66 6M40 132c14-3 30-2 44 2"
      />
      <m.path
        variants={fine}
        d="M134 78c20-8 44-10 66-6M134 98c20-8 44-10 66-6M134 118c20-8 44-10 66-6"
      />
      <m.path variants={stroke} d="M30 166c30-4 60 0 90 10 30-10 60-14 90-10" />
      <m.path
        variants={stroke}
        d="M120 14c1 6 3 8 9 9-6 1-8 3-9 9-1-6-3-8-9-9 6-1 8-3 9-9ZM170 30c1 4 2 5 6 6-4 1-5 2-6 6-1-4-2-5-6-6 4-1 5-2 6-6ZM76 26c1 4 2 5 6 6-4 1-5 2-6 6-1-4-2-5-6-6 4-1 5-2 6-6Z"
      />
      <m.circle variants={fine} cx="148" cy="12" r="1.6" />
      <m.circle variants={fine} cx="98" cy="10" r="1.6" />
    </Draw>
  );
}

/** A candle burning low, for late-night reading. */
export function CandleDoodle(props: Props) {
  return (
    <Draw viewBox="0 0 120 250" stagger={0.09} {...props}>
      <m.path variants={stroke} d="M12 226c10 10 86 10 96 0M26 216h68" />
      <m.path variants={stroke} d="M42 216V116c0-7 36-7 36 0v100" />
      <m.path variants={fine} d="M42 116c0 7 36 7 36 0" />
      <m.path variants={fine} d="M52 124c-2 14 3 24 0 36M70 122c2 10-2 16 0 24" />
      <m.path variants={stroke} d="M60 114v-12" />
      <m.path
        variants={stroke}
        d="M60 102c-15-15-13-38 0-62 13 24 15 47 0 62Z"
        fill="currentColor"
        fillOpacity={0.06}
      />
      <m.path variants={fine} d="M60 94c-7-8-6-20 0-32 6 12 7 24 0 32Z" />
      <m.path variants={fine} d="M24 70l-12-4M96 70l12-4M30 42l-9-8M90 42l9-8M60 24V10" />
    </Draw>
  );
}

/** A constellation with a few four-point stars. */
export function StarsDoodle(props: Props) {
  const star = (x: number, y: number, r: number) =>
    `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;
  const pts = [
    [24, 120],
    [70, 84],
    [118, 98],
    [160, 52],
    [214, 70],
  ];
  return (
    <Draw viewBox="0 0 240 170" stagger={0.08} {...props}>
      <m.path
        variants={fine}
        strokeDasharray="2 5"
        d={`M${pts.map((p) => p.join(" ")).join("L")}`}
      />
      {pts.map(([x, y], i) => (
        <m.path key={i} variants={stroke} d={star(x, y, i % 2 ? 9 : 12)} />
      ))}
      <m.path variants={stroke} d={star(190, 138, 6)} />
      <m.path variants={stroke} d={star(46, 36, 5)} />
      <m.circle variants={fine} cx="132" cy="24" r="1.8" />
      <m.circle variants={fine} cx="96" cy="150" r="1.8" />
      <m.circle variants={fine} cx="228" cy="116" r="1.8" />
    </Draw>
  );
}

/** Round reading glasses. */
export function SpectaclesDoodle(props: Props) {
  return (
    <Draw viewBox="0 0 250 110" stagger={0.1} {...props}>
      <m.circle variants={stroke} cx="64" cy="62" r="42" />
      <m.circle variants={stroke} cx="186" cy="62" r="42" />
      <m.path variants={stroke} d="M106 54c10-12 28-12 38 0" />
      <m.path variants={stroke} d="M22 52 6 34M228 52l16-18" />
      <m.path variants={fine} d="M40 50a26 26 0 0 1 16-14M162 50a26 26 0 0 1 16-14" />
      <m.path variants={fine} d="M44 66a22 22 0 0 0 6 14M166 66a22 22 0 0 0 6 14" />
    </Draw>
  );
}

/** An old key, for the doors old books open. */
export function KeyDoodle(props: Props) {
  return (
    <Draw viewBox="0 0 230 100" stagger={0.1} {...props}>
      <m.circle variants={stroke} cx="40" cy="50" r="28" />
      <m.circle variants={stroke} cx="40" cy="50" r="12" />
      <m.path variants={fine} d="M40 22v-8M40 78v8M12 50H4M68 50" />
      <m.path variants={stroke} d="M68 50h150" />
      <m.path variants={stroke} d="M176 50v22h12V50M200 50v16h12V50" />
      <m.path variants={fine} d="M96 44h54M96 56h54" />
    </Draw>
  );
}

/** A moth drawn to the lamp, wings patterned like old endpapers. */
export function MothDoodle(props: Props) {
  const wing = (
    <>
      <m.path
        variants={stroke}
        d="M100 72C76 30 30 24 14 54c-8 20 20 44 86 36Z"
        fill="currentColor"
        fillOpacity={0.05}
      />
      <m.path
        variants={stroke}
        d="M100 98C80 98 52 110 48 138c-2 16 20 22 38 8 8-8 12-26 14-48Z"
        fill="currentColor"
        fillOpacity={0.05}
      />
      <m.circle variants={fine} cx="52" cy="58" r="10" />
      <m.circle variants={fine} cx="52" cy="58" r="4" />
      <m.path variants={fine} d="M96 78C72 60 46 76 36 84M92 112c-14 4-30 14-36 26" />
    </>
  );
  return (
    <Draw viewBox="0 0 200 170" stagger={0.12} {...props}>
      {wing}
      <m.g transform="translate(200 0) scale(-1 1)">{wing}</m.g>
      <m.path
        variants={stroke}
        d="M100 52c-3 0-5 3-5 8v70c0 6 3 12 5 14 2-2 5-8 5-14V60c0-5-2-8-5-8Z"
      />
      <m.path variants={fine} d="M100 52C92 36 80 28 68 24M100 52c8-16 20-24 32-28" />
    </Draw>
  );
}

/** A stack of books topped with a steaming cup. */
export function TeaStackDoodle(props: Props) {
  return (
    <Draw viewBox="0 0 220 200" stagger={0.1} {...props}>
      <m.path variants={stroke} d="M24 176h172v20H24Z" />
      <m.path variants={fine} d="M44 176v20M52 176v20M176 176v20" />
      <m.path variants={stroke} d="M40 152h150v24H40Z" />
      <m.path variants={fine} d="M58 152v24M66 152v24M170 152v24" />
      <m.path variants={stroke} d="M32 130h160v22H32Z" />
      <m.path variants={fine} d="M50 130v22M58 130v22M168 130v22" />
      <m.path variants={stroke} d="M78 78h64v18a32 32 0 0 1-64 0Z" />
      <m.path variants={stroke} d="M142 84c22 0 22 28-2 28" />
      <m.path variants={stroke} d="M64 130c20 4 72 4 92 0" />
      <m.path
        variants={fine}
        d="M94 62c-8-10 8-16 0-28M112 62c-8-10 8-16 0-28M130 62c-8-10 8-16 0-28"
      />
    </Draw>
  );
}

/** A child lying on their stomach, feet in the air, lost in a book. */
export function KidReadingDoodle(props: Props) {
  const soft = { fill: "currentColor", fillOpacity: 0.06 } as const;
  return (
    <Draw viewBox="0 78 320 130" stagger={0.09} {...props}>
      {/* the floor and a few blades of grass */}
      <m.path variants={fine} d="M8 192c70 4 170 4 304-2" />
      <m.path
        variants={fine}
        d="M268 193l-3-8M274 193l2-9M280 193l5-7M20 193l-2-6M26 193l3-7"
      />

      {/* far leg, bent up at the knee */}
      <m.path
        variants={fine}
        d="M76 178C74 156 86 140 98 128M90 182C90 162 100 148 110 136"
      />
      <m.path variants={fine} d="M98 128c-5-6 0-14 8-12 8 2 10 10 6 18-3 4-8 4-12 2" />

      {/* near leg: thigh along the floor, shin up, shoe in the air */}
      <m.path variants={stroke} d="M114 164 68 170M114 188 68 188" />
      <m.path variants={stroke} d="M68 170c-9 2-11 16-2 18" />
      <m.path variants={stroke} d="M60 174C46 156 44 132 54 112" />
      <m.path variants={stroke} d="M71 178C64 160 66 140 74 124" />
      <m.path
        variants={stroke}
        d="M54 112c-6-6 0-15 9-12 8 3 10 12 7 20-2 4-7 5-12 4"
        {...soft}
      />
      <m.path variants={fine} d="M50 122l18 4" />

      {/* body: shorts, then a striped shirt */}
      <m.path variants={stroke} d="M114 164c-7 6-7 18 0 24" />
      <m.path variants={stroke} d="M114 164C132 150 170 148 196 160" />
      <m.path variants={stroke} d="M114 188C140 192 170 192 200 188" />
      <m.path variants={fine} d="M142 154c4 12 4 24 0 36" />
      <m.path
        variants={fine}
        d="M158 152c3 12 3 26 0 38M174 154c3 12 3 24 0 34M188 158c2 10 2 20 0 28"
      />

      {/* arm propped on the elbow, hand at the book */}
      <m.path variants={stroke} d="M192 160c4 10 10 20 16 28" />
      <m.path variants={stroke} d="M208 188c12 2 26 0 38-6" />
      <m.path variants={stroke} d="M200 168c2 8 6 14 10 18" />
      <m.circle variants={stroke} cx="248" cy="181" r="5" {...soft} />

      {/* head bent over the page */}
      <m.circle variants={stroke} cx="222" cy="142" r="22" {...soft} />
      <m.path variants={stroke} d="M200 138C198 116 224 108 242 120c8 6 7 14 5 18" />
      <m.path
        variants={fine}
        d="M214 114c-3-8 3-13 10-11 -3 4-2 8 2 10M206 126c4-6 10-9 18-9"
      />
      <m.circle variants={fine} cx="206" cy="148" r="4" />
      <m.path variants={fine} d="M231 134q5-3 9 0" />
      <m.path variants={stroke} d="M233 144q4 3 8 0" />
      <m.path variants={fine} d="M244 144l3 3-3 1M236 154q4 2 8-1" />

      {/* the book */}
      <m.path
        variants={stroke}
        d="M240 174Q258 166 276 170Q294 166 312 174V190Q294 184 276 188Q258 184 240 190Z"
        {...soft}
      />
      <m.path variants={stroke} d="M276 170v18" />
      <m.path
        variants={fine}
        d="M250 178q12-3 22 0M250 183q12-3 22 0M282 178q12-3 22 0M282 183q12-3 22 0"
      />

      {/* sparks rising from the story */}
      <m.path
        variants={stroke}
        d="M290 130c1 5 3 7 8 8-5 1-7 3-8 8-1-5-3-7-8-8 5-1 7-3 8-8ZM256 104c1 3 2 4 5 5-3 1-4 2-5 5-1-3-2-4-5-5 3-1 4-2 5-5Z"
      />
      <m.circle variants={fine} cx="306" cy="108" r="1.8" />
      <m.circle variants={fine} cx="272" cy="88" r="1.8" />
      <m.path variants={fine} d="M302 154c4-6 10-8 14-6" />
    </Draw>
  );
}

/** One lantern hanging by a short cord from y = 0, drawn around x = 0. */
function Lantern({ x, cord, scale }: { x: number; cord: number; scale: number }) {
  const soft = { fill: "currentColor", fillOpacity: 0.06 } as const;
  return (
    <m.g transform={`translate(${x} ${cord}) scale(${scale})`}>
      <m.path variants={fine} d={`M0 ${-cord / scale}V2`} />
      <m.path variants={stroke} d="M-4 8a4 4 0 1 1 8 0" />
      <m.path variants={stroke} d="M-6 12h12l9 10h-30Z" {...soft} />
      <m.path variants={stroke} d="M-13 22c-3 12-3 24-1 36h28c2-12 2-24-1-36" {...soft} />
      <m.path variants={fine} d="M0 22v36M-13.5 31h27M-14 49h28" />
      <m.path variants={stroke} d="M-15 58h30l-3 6h-24Z" />
      <m.path
        variants={stroke}
        d="M0 52c-5-6-4-14 0-21 4 7 5 15 0 21Z"
        fill="currentColor"
        fillOpacity={0.12}
      />
      <m.path variants={fine} d="M-22 38h-6M22 38h6M-19 26l-5-4M19 26l5-4" />
    </m.g>
  );
}

/** A small cluster of lanterns hanging together from a line above them. */
export function LanternsDoodle(props: Props) {
  return (
    <Draw viewBox="0 0 200 112" stagger={0.1} {...props}>
      <Lantern x={44} cord={6} scale={1} />
      <Lantern x={102} cord={28} scale={0.84} />
      <Lantern x={156} cord={12} scale={0.92} />
    </Draw>
  );
}
