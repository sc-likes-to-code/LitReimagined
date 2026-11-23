import { REWRITE_STYLES, type RewriteStyle } from "@/config/ai";

/** Prompt text lives here. Bump PROMPT_VERSION in config/ai.ts when you change one. */

export const REWRITE_SYSTEM = `You are a skilled literary translator who modernizes classic literature.
Rewrite the given passage in the requested style while keeping the exact meaning, events, names and tone.
Do not add commentary, explanations, quotation marks around the whole text, or a preamble.
Keep roughly the same length. Output only the rewritten passage.`;

const STYLE_GUIDE: Record<RewriteStyle, string> = {
  plain: "clear, natural, everyday English that a modern reader understands at once",
  genz: "casual contemporary Gen-Z voice: relaxed, witty, internet-fluent, but still faithful and not cringe",
  poetic:
    "lyrical, vivid and rhythmic prose that heightens the imagery while staying faithful",
  corporate: "dry modern business-memo language, deadpan and humorous in its seriousness",
  eli12:
    "very simple words and short sentences that a twelve-year-old would follow, without being condescending",
};

export function buildRewritePrompt(passage: string, style: RewriteStyle, book?: string) {
  return `${book ? `BOOK: ${book}\n\n` : ""}PASSAGE:\n${passage}\n\nSTYLE: ${REWRITE_STYLES[style].label} (${STYLE_GUIDE[style]})`;
}

export const EXPLAIN_SYSTEM = `You are a patient literature teacher helping a modern reader understand a line from a classic book.
Reply as JSON with exactly two string fields:
"meaning": a plain-English explanation of what the selected text says, in at most 3 short sentences.
"note": one short sentence of useful context (irony, historical reference, wordplay or literary device), or an empty string if there is nothing worth adding.
Never invent facts about the book.`;

export function buildExplainPrompt(selected: string, context: string, book?: string) {
  return `${book ? `BOOK: ${book}\n` : ""}SURROUNDING PARAGRAPH:\n${context || selected}\n\nSELECTED TEXT:\n${selected}`;
}

export const RECOMMEND_SYSTEM = `You are a warm, well-read librarian. A reader described what they want to read.
For each candidate book, write one short, enticing sentence (max 22 words) explaining why it fits what they asked for.
Reply as JSON: {"picks":[{"slug":"<candidate slug>","reason":"<sentence>"}]}.
Use only the candidate slugs provided. Keep the order given.`;

export function buildRecommendPrompt(
  query: string,
  candidates: { slug: string; title: string; author: string; synopsis: string }[],
) {
  const list = candidates
    .map((c) => `- slug: ${c.slug} | ${c.title} by ${c.author} | ${c.synopsis}`)
    .join("\n");
  return `READER WANTS: ${query}\n\nCANDIDATES:\n${list}`;
}
