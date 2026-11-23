/**
 * Small geometry helpers for drawing leaves, ferns and feathers as SVG paths.
 * Everything is computed from a curved "spine" so the shapes flow naturally.
 */

export type Pt = { x: number; y: number };
type Bezier = [Pt, Pt, Pt, Pt];

const n = (v: number) => v.toFixed(1);
const P = (x: number, y: number): Pt => ({ x, y });

export function bezierPoint([a, b, c, d]: Bezier, t: number): Pt {
  const u = 1 - t;
  return P(
    u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  );
}

/** Unit direction of travel along the curve at `t`. */
export function bezierTangent([a, b, c, d]: Bezier, t: number): Pt {
  const u = 1 - t;
  const x = 3 * u * u * (b.x - a.x) + 6 * u * t * (c.x - b.x) + 3 * t * t * (d.x - c.x);
  const y = 3 * u * u * (b.y - a.y) + 6 * u * t * (c.y - b.y) + 3 * t * t * (d.y - c.y);
  const len = Math.hypot(x, y) || 1;
  return P(x / len, y / len);
}

export const bezierPath = ([a, b, c, d]: Bezier) =>
  `M${n(a.x)} ${n(a.y)}C${n(b.x)} ${n(b.y)} ${n(c.x)} ${n(c.y)} ${n(d.x)} ${n(d.y)}`;

/** Smooth curve through the points (Catmull-Rom converted to cubic Béziers). */
export function smoothThrough(pts: Pt[]): string {
  if (pts.length < 2) return "";
  let d = `M${n(pts[0].x)} ${n(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = P(p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6);
    const c2 = P(p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6);
    d += `C${n(c1.x)} ${n(c1.y)} ${n(c2.x)} ${n(c2.y)} ${n(p2.x)} ${n(p2.y)}`;
  }
  return d;
}

/** A pointed leaf outline from `from` to `to`, bulging by `width` on each side. */
export function leafOutline(from: Pt, to: Pt, width: number, skew = 0.5): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const mid = P(from.x + dx * skew, from.y + dy * skew);
  const a = P(mid.x + nx * width, mid.y + ny * width);
  const b = P(mid.x - nx * width, mid.y - ny * width);
  return (
    `M${n(from.x)} ${n(from.y)}Q${n(a.x)} ${n(a.y)} ${n(to.x)} ${n(to.y)}` +
    `Q${n(b.x)} ${n(b.y)} ${n(from.x)} ${n(from.y)}Z`
  );
}

/** A gently curved stroke from `from` to `to`; `bow` bends it sideways. */
export function arc(from: Pt, to: Pt, bow: number): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const c = P(from.x + dx / 2 - (dy / len) * bow, from.y + dy / 2 + (dx / len) * bow);
  return `M${n(from.x)} ${n(from.y)}Q${n(c.x)} ${n(c.y)} ${n(to.x)} ${n(to.y)}`;
}

/* ------------------------------------------------------------------ fern */

const FERN_SPINE: Bezier = [P(88, 336), P(80, 250), P(104, 120), P(166, 12)];

export type FernArt = {
  spine: string;
  /** Leaflets, each a closed leaf outline. */
  leaflets: string[];
  /** A fine vein down the middle of each leaflet. */
  veins: string[];
};

export function fernArt(): FernArt {
  const leaflets: string[] = [];
  const veins: string[] = [];
  const pairs = 13;
  for (let i = 0; i < pairs; i++) {
    const t = 0.1 + (i / (pairs - 1)) * 0.84;
    const p = bezierPoint(FERN_SPINE, t);
    const tan = bezierTangent(FERN_SPINE, t);
    // Leaflets are longest low on the frond and shrink to nothing at the tip.
    const taper = Math.pow(1 - (t - 0.1) / 0.9, 0.85);
    const len = 14 + 62 * taper;
    for (const side of [-1, 1] as const) {
      // Each leaflet leaves the spine at an angle, then sweeps toward the tip.
      const angle = (62 - 12 * (1 - taper)) * (Math.PI / 180);
      const nx = -tan.y * side;
      const ny = tan.x * side;
      const dir = P(
        nx * Math.sin(angle) + tan.x * Math.cos(angle),
        ny * Math.sin(angle) + tan.y * Math.cos(angle),
      );
      // Stagger the two sides slightly so the frond looks grown, not stamped.
      const offset = side === 1 ? 0 : 5 * taper + 2;
      const start = P(p.x + tan.x * offset, p.y + tan.y * offset);
      const end = P(start.x + dir.x * len, start.y + dir.y * len);
      leaflets.push(leafOutline(start, end, len * 0.17, 0.42));
      veins.push(arc(start, end, side * len * 0.05));
    }
  }
  // A small curled bud at the tip.
  const tip = bezierPoint(FERN_SPINE, 1);
  leaflets.push(leafOutline(P(tip.x - 6, tip.y + 20), tip, 3.2, 0.5));
  return { spine: bezierPath(FERN_SPINE), leaflets, veins };
}

/* ----------------------------------------------------------------- quill */

const QUILL_SPINE: Bezier = [P(40, 292), P(66, 214), P(112, 112), P(176, 16)];

export type QuillArt = {
  shaft: string;
  vane: string;
  /** Barbs on the feathered part, from the shaft out to the edge. */
  barbs: string[];
  /** Short barbs low on the bare shaft and the nib flick below. */
  base: string[];
  drop: string;
};

export function quillArt(): QuillArt {
  const t0 = 0.3;
  const half = (u: number, side: 1 | -1) => {
    // Width profile: swells past the middle, closes to a point at the tip.
    const swell = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.78)), 0.9);
    return swell * (side === 1 ? 31 : 25);
  };
  const edge = (t: number, side: 1 | -1) => {
    const p = bezierPoint(QUILL_SPINE, t);
    const tan = bezierTangent(QUILL_SPINE, t);
    const u = (t - t0) / (1 - t0);
    return P(p.x - tan.y * side * half(u, side), p.y + tan.x * side * half(u, side));
  };

  const steps = 22;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = t0 + (i / steps) * (1 - t0);
    left.push(edge(t, 1));
    right.push(edge(t, -1));
  }
  const vane =
    smoothThrough(left) +
    smoothThrough([...right].reverse()).replace(/^M[^C]*/, "") +
    "Z";

  const barbs: string[] = [];
  const count = 15;
  for (let i = 0; i < count; i++) {
    const t = t0 + 0.02 + (i / count) * (0.94 - t0);
    const from = bezierPoint(QUILL_SPINE, t);
    for (const side of [1, -1] as const) {
      // Barbs sweep forward, reaching the edge a little further up the feather.
      const reach = Math.min(0.985, t + 0.075);
      const to = edge(reach, side);
      barbs.push(arc(from, to, side * 3.2));
    }
  }

  const base: string[] = [];
  for (const [t, side, l] of [
    [0.13, 1, 17],
    [0.19, -1, 14],
    [0.245, 1, 12],
  ] as const) {
    const p = bezierPoint(QUILL_SPINE, t);
    const tan = bezierTangent(QUILL_SPINE, t);
    const to = P(
      p.x - tan.y * side * l + tan.x * l * 0.9,
      p.y + tan.x * side * l + tan.y * l * 0.9,
    );
    base.push(arc(p, to, side * 2.4));
  }
  // The nib, with a flick of ink.
  const start = bezierPoint(QUILL_SPINE, 0);
  base.push(`M${n(start.x)} ${n(start.y)}c-4 6 -5 11 -3 17`);

  return {
    shaft: bezierPath(QUILL_SPINE),
    vane,
    barbs,
    base,
    drop: `M${n(start.x - 5)} ${n(start.y + 25)}a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0 -3.6 0Z`,
  };
}

/* ----------------------------------------------------------------- sprig */

const SPRIG_SPINE: Bezier = [P(6, 66), P(70, 82), P(160, 64), P(254, 16)];

/** A laurel-like branch lying sideways: paired leaves that shrink toward the tip. */
export function sprigArt() {
  const leaves: string[] = [];
  const veins: string[] = [];
  const pairs = 9;
  for (let i = 0; i < pairs; i++) {
    const t = 0.1 + (i / (pairs - 1)) * 0.82;
    const p = bezierPoint(SPRIG_SPINE, t);
    const tan = bezierTangent(SPRIG_SPINE, t);
    const len = 12 + 26 * Math.pow(1 - t, 0.7) + 6;
    for (const side of [-1, 1] as const) {
      const a = (48 * Math.PI) / 180;
      const nx = -tan.y * side;
      const ny = tan.x * side;
      const to = P(
        p.x + (nx * Math.sin(a) + tan.x * Math.cos(a)) * len,
        p.y + (ny * Math.sin(a) + tan.y * Math.cos(a)) * len,
      );
      leaves.push(leafOutline(p, to, len * 0.2, 0.45));
      veins.push(arc(p, to, side * len * 0.04));
    }
  }
  const tip = bezierPoint(SPRIG_SPINE, 1);
  leaves.push(leafOutline(P(tip.x - 16, tip.y + 8), P(tip.x + 4, tip.y - 6), 3.4, 0.5));
  return { spine: bezierPath(SPRIG_SPINE), leaves, veins };
}
