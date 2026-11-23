"use client";

import { paginate, toViews, type BookView } from "./paginate";

export type BookType = {
  fontSize: number;
  lineHeight: number;
  family: "serif" | "sans";
};

export type BookGeometry = {
  /** One page at a time (small screens). */
  phone: boolean;
  pageW: number;
  pageH: number;
  padX: number;
  padTop: number;
  padBottom: number;
  textW: number;
  textH: number;
  /** Height kept free at the top of a chapter's first page for its heading. */
  titleReserve: number;
};

export type BookLayout = {
  key: string;
  views: BookView[];
  geometry: BookGeometry;
  /** Two aligned versions (original + modern) rather than one text flowing across pages. */
  aligned: boolean;
  /** Pages in the whole chapter, counting each side of an aligned spread. */
  totalPages: number;
};

const PHONE_BELOW = 720;
const PAGE_RATIO = 0.8; // widest a page may be, relative to its height

export function computeGeometry(
  stageW: number,
  stageH: number,
  type: BookType,
): BookGeometry {
  const phone = stageW < PHONE_BELOW;
  let pageW: number;
  let pageH: number;
  if (phone) {
    pageW = Math.min(stageW, 560);
    pageH = Math.min(stageH, 900);
  } else {
    pageH = Math.min(stageH, 940);
    pageW = Math.min(stageW / 2, 640);
    if (pageW > pageH * PAGE_RATIO) pageW = pageH * PAGE_RATIO;
  }
  pageW = Math.floor(pageW);
  pageH = Math.floor(pageH);

  const padX = Math.round(Math.min(52, Math.max(22, pageW * 0.09)));
  const padTop = 46;
  const padBottom = 46;
  return {
    phone,
    pageW,
    pageH,
    padX,
    padTop,
    padBottom,
    textW: pageW - padX * 2,
    textH: pageH - padTop - padBottom,
    titleReserve: Math.round(type.fontSize * 8),
  };
}

/** A hidden page-wide paragraph, styled like the real pages, used to measure text. */
function createMeasurer(g: BookGeometry, type: BookType) {
  const root = document.createElement("div");
  root.setAttribute("aria-hidden", "true");
  root.lang = "en";
  root.className = `book-text ${type.family === "serif" ? "font-reading" : "font-sans"}`;
  root.style.cssText = [
    "position:fixed",
    "left:-99999px",
    "top:0",
    "visibility:hidden",
    "pointer-events:none",
    `width:${g.textW}px`,
    `font-size:${type.fontSize}px`,
    `line-height:${type.lineHeight}`,
  ].join(";");
  const p = document.createElement("p");
  root.appendChild(p);
  document.body.appendChild(root);
  return {
    measure(text: string, indent: boolean) {
      p.textContent = text;
      p.style.textIndent = indent ? "1.4em" : "0";
      return p.getBoundingClientRect().height;
    },
    dispose: () => root.remove(),
  };
}

export function buildBook(args: {
  stage: { w: number; h: number };
  type: BookType;
  original: string[];
  /** The modern version, or null when this chapter only has the original. */
  modern: string[] | null;
}): BookLayout {
  const { stage, type, original, modern } = args;
  const geometry = computeGeometry(stage.w, stage.h, type);
  const columns = modern
    ? [original, original.map((o, i) => modern[i] ?? o)]
    : [original];

  const m = createMeasurer(geometry, type);
  let chunks;
  try {
    chunks = paginate({
      columns,
      // A pixel of slack keeps rounding from clipping the last line.
      capacity: (n) => geometry.textH - 1 - (n === 0 ? geometry.titleReserve : 0),
      lineHeight: type.fontSize * type.lineHeight,
      measure: m.measure,
    });
  } finally {
    m.dispose();
  }

  const views = toViews(chunks, columns.length, geometry.phone ? 1 : 2);
  const aligned = columns.length > 1;
  return {
    key: [
      stage.w,
      stage.h,
      type.fontSize,
      type.lineHeight,
      type.family,
      aligned ? "a" : "f",
      columns[columns.length - 1].length,
      chunks.length,
    ].join("|"),
    views,
    geometry,
    aligned,
    totalPages: aligned ? chunks.length * 2 : chunks.length,
  };
}
