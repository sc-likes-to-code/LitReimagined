/** Draws shareable quote cards onto a canvas. Pure drawing code, no React. */

export type CardFormat = "portrait" | "square" | "story";
export type CardTheme = "ink" | "paper" | "ember" | "dusk";

export const CARD_FORMATS: Record<CardFormat, { w: number; h: number; label: string }> = {
  portrait: { w: 1080, h: 1350, label: "Portrait" },
  square: { w: 1080, h: 1080, label: "Square" },
  story: { w: 1080, h: 1920, label: "Story" },
};

type Palette = {
  label: string;
  bg: [string, string];
  glow: string;
  ink: string;
  muted: string;
  accent: string;
};

export const CARD_THEMES: Record<CardTheme, Palette> = {
  ink: {
    label: "Ink",
    bg: ["#17141f", "#0e0c14"],
    glow: "rgba(255, 90, 54, 0.22)",
    ink: "#f3ebdd",
    muted: "rgba(243, 235, 221, 0.62)",
    accent: "#ff7a45",
  },
  paper: {
    label: "Paper",
    bg: ["#fbf6eb", "#f1e6d0"],
    glow: "rgba(255, 154, 60, 0.28)",
    ink: "#1b1722",
    muted: "rgba(27, 23, 34, 0.62)",
    accent: "#e24a26",
  },
  ember: {
    label: "Ember",
    bg: ["#ff7a45", "#d6371a"],
    glow: "rgba(255, 220, 160, 0.35)",
    ink: "#fff8ec",
    muted: "rgba(255, 248, 236, 0.78)",
    accent: "#fff1d6",
  },
  dusk: {
    label: "Dusk",
    bg: ["#2a2150", "#0f1a33"],
    glow: "rgba(76, 201, 240, 0.25)",
    ink: "#eef3ff",
    muted: "rgba(238, 243, 255, 0.64)",
    accent: "#7fd8f5",
  },
};

export const MAX_QUOTE_CHARS = 520;

export type CardInput = {
  quote: string;
  author: string;
  book: string;
  format: CardFormat;
  theme: CardTheme;
  fonts: { display: string; reading: string; sans: string };
};

/** Collapses whitespace and trims overlong quotes at a word boundary. */
export function prepareQuote(raw: string, max = MAX_QUOTE_CHARS): string {
  const text = raw.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\s]+$/, "")}…`;
}

/** Breaks text into lines no wider than `width`, using the context's current font. */
export function wrapLines(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > width) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export function drawQuoteCard(canvas: HTMLCanvasElement, input: CardInput) {
  const { w, h } = CARD_FORMATS[input.format];
  const p = CARD_THEMES[input.theme];
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background wash and a soft glow in the upper corner.
  const bg = ctx.createLinearGradient(0, 0, w * 0.4, h);
  bg.addColorStop(0, p.bg[0]);
  bg.addColorStop(1, p.bg[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w * 0.85, h * 0.08, 0, w * 0.85, h * 0.08, w * 0.9);
  glow.addColorStop(0, p.glow);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const pad = 96;
  const textWidth = w - pad * 2;
  const quote = prepareQuote(input.quote);

  // Decorative opening mark.
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = p.accent;
  ctx.globalAlpha = 0.9;
  ctx.font = `italic 400 260px ${input.fonts.display}`;
  ctx.fillText("“", pad - 12, pad + 190);
  ctx.globalAlpha = 1;

  // Largest type size where the quote fits the space between the mark and the credit.
  const top = pad + 230;
  const bottomReserve = 250;
  const room = h - top - bottomReserve;
  let size = 68;
  let lines: string[] = [];
  for (; size >= 30; size -= 2) {
    ctx.font = `italic 400 ${size}px ${input.fonts.reading}`;
    lines = wrapLines(ctx, quote, textWidth);
    if (lines.length * size * 1.34 <= room) break;
  }
  ctx.fillStyle = p.ink;
  const lineHeight = size * 1.34;
  // Centre the block vertically inside the available room.
  const blockTop = top + Math.max(0, (room - lines.length * lineHeight) / 2);
  lines.forEach((l, i) => ctx.fillText(l, pad, blockTop + size + i * lineHeight));

  // Credit.
  const creditY = h - pad - 96;
  ctx.fillStyle = p.accent;
  ctx.fillRect(pad, creditY - 56, 72, 4);
  ctx.fillStyle = p.ink;
  ctx.font = `500 40px ${input.fonts.display}`;
  ctx.fillText(input.author, pad, creditY + 4);
  ctx.fillStyle = p.muted;
  ctx.font = `italic 400 32px ${input.fonts.reading}`;
  ctx.fillText(input.book, pad, creditY + 52);

  // Wordmark.
  ctx.textAlign = "right";
  ctx.fillStyle = p.muted;
  ctx.font = `500 26px ${input.fonts.sans}`;
  ctx.fillText("LitReimagined", w - pad, creditY + 52);
  ctx.textAlign = "left";
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
