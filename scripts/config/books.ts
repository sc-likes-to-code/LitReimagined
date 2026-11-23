/**
 * Source and chapter-detection settings for each launch book.
 * Catalogue metadata (titles, synopses, covers) lives in data/demo and is seeded by
 * `npm run content:seed`; this file only describes how to split the raw Gutenberg text.
 *
 * Gutenberg IDs and edition choices should be re-checked in the dry run output.
 */
import { romanToInt } from "../lib/gutenberg";

export type BookSource = {
  slug: string;
  gutenbergId: number;
  /** Matches a chapter heading line. If it captures group 1, that is used as the title. */
  heading: RegExp;
  /** Where the chapter title comes from when the heading line has none. */
  title?: "same-line" | "next-line" | "none";
  /** Prefix used when generating a title like "Chapter 4". */
  label?: string;
  /** Optional: a line that starts a new part (chapter headings then restart). */
  part?: RegExp;
  /** Start at the first (or last, see startAtLast) line matching this. Skips prefaces and tables of contents. */
  startAfter?: RegExp;
  /** Use the last match of startAfter, for books whose contents list repeats the first heading. */
  startAtLast?: boolean;
  /** Stop at the first line matching this (appendices). */
  stopAt?: RegExp;
  /** Label for parts, e.g. "Act". Defaults to "Part". */
  partLabel?: string;
  /** Extra single-line sections such as an epilogue. */
  extra?: { pattern: RegExp; title: string }[];
  /** Fully custom title for books with unusual headings. */
  makeTitle?: (ctx: { part: number | string; match: RegExpExecArray }) => string;
  /** Drop a leading all-caps summary paragraph under each chapter heading. */
  dropCapsLead?: boolean;
  /** Drop chapters shorter than this many words (tables of contents, stray headings). */
  minWords?: number;
};

export const BOOK_SOURCES: BookSource[] = [
  {
    slug: "pride-and-prejudice",
    gutenbergId: 1342,
    heading: /^\s*Chapter\s+([IVXLC]+)\.?\]?\s*$/i,
    label: "Chapter",
    minWords: 80,
  },
  {
    slug: "frankenstein",
    gutenbergId: 84,
    heading: /^\s*(Letter\s+\d+|Chapter\s+\d+)\s*$/i,
    minWords: 80,
  },
  {
    slug: "dracula",
    gutenbergId: 345,
    heading: /^\s*CHAPTER\s+([IVXLC]+)\.?\s*$/,
    label: "Chapter",
    title: "next-line",
    minWords: 120,
  },
  {
    slug: "jane-eyre",
    gutenbergId: 1260,
    heading: /^\s*CHAPTER\s+([IVXLC]+)\.?(?:\s*[—-].*)?\s*$/,
    label: "Chapter",
    minWords: 120,
  },
  {
    slug: "wuthering-heights",
    gutenbergId: 768,
    heading: /^\s*CHAPTER\s+([IVXLC]+)\.?\s*$/,
    label: "Chapter",
    minWords: 120,
  },
  {
    slug: "great-expectations",
    gutenbergId: 1400,
    heading: /^\s*Chapter\s+([IVXLC]+)\.?\s*$/i,
    label: "Chapter",
    minWords: 120,
  },
  {
    slug: "the-picture-of-dorian-gray",
    gutenbergId: 174,
    heading: /^\s*CHAPTER\s+([IVXLC]+)\.?\s*$/,
    startAfter: /^\s*CHAPTER I\.?\s*$/,
    startAtLast: true,
    label: "Chapter",
    minWords: 120,
  },
  {
    slug: "crime-and-punishment",
    gutenbergId: 2554,
    part: /^\s*PART\s+([IVXLC]+)\s*$/,
    extra: [{ pattern: /^\s*EPILOGUE\s*$/, title: "Epilogue" }],
    heading: /^\s*CHAPTER\s+([IVXLC]+)\s*$/,
    label: "Chapter",
    minWords: 120,
    startAfter: /^\s*PART I\s*$/,
    startAtLast: true,
  },
  {
    slug: "moby-dick",
    gutenbergId: 2701,
    heading: /^\s*CHAPTER\s+(\d+)\.\s*(.*)$/,
    title: "same-line",
    label: "Chapter",
    startAfter: /^\s*CHAPTER\s+1\.\s+Loomings/,
    startAtLast: true,
    extra: [{ pattern: /^\s*Epilogue\s*$/, title: "Epilogue" }],
    minWords: 30,
  },
  {
    slug: "alices-adventures-in-wonderland",
    gutenbergId: 11,
    heading: /^\s*CHAPTER\s+([IVXLC]+)\.\s*$/,
    title: "next-line",
    label: "Chapter",
    minWords: 120,
  },
  {
    slug: "romeo-and-juliet",
    gutenbergId: 1513,
    heading: /^\s*SCENE\s+([IVXLC]+)\.\s*(.*)$/,
    part: /^\s*ACT\s+([IVXLC]+)\s*$/,
    partLabel: "Act",
    makeTitle: ({ part, match }) =>
      `Act ${part}, Scene ${romanToInt(match[1])}${match[2] ? `: ${match[2].replace(/\.$/, "")}` : ""}`,
    minWords: 60,
  },
  {
    slug: "the-odyssey",
    gutenbergId: 1727,
    heading: /^\s*BOOK\s+([IVXLC]+)\s*$/,
    label: "Book",
    dropCapsLead: true,
    minWords: 200,
  },
];
