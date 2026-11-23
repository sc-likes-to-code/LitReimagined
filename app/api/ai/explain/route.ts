import type { NextRequest } from "next/server";
import { z } from "zod";
import { MAX_PASSAGE_CHARS } from "@/config/ai";
import { runAi } from "@/lib/ai/gateway";
import { handleAi } from "@/lib/ai/http";
import { EXPLAIN_SYSTEM, buildExplainPrompt } from "@/lib/ai/prompts";

const schema = z.object({
  text: z.string().trim().min(2).max(MAX_PASSAGE_CHARS),
  context: z
    .string()
    .trim()
    .max(MAX_PASSAGE_CHARS * 2)
    .optional(),
  book: z.string().trim().max(120).optional(),
});

type Explanation = { meaning: string; note: string };

function parseExplanation(raw: string): Explanation {
  try {
    const j = JSON.parse(raw) as Partial<Explanation>;
    if (typeof j.meaning === "string" && j.meaning.trim()) {
      return {
        meaning: j.meaning.trim(),
        note: typeof j.note === "string" ? j.note.trim() : "",
      };
    }
  } catch {
    /* fall through to plain-text handling */
  }
  return { meaning: raw.trim(), note: "" };
}

export async function POST(request: NextRequest) {
  return handleAi(request, schema, (body, subject) => {
    const text = body.text.replace(/\s+/g, " ");
    return runAi<Explanation>({
      feature: "explain",
      subject,
      cacheInput: {
        text,
        ctx: (body.context ?? "").slice(0, 200),
        book: body.book ?? "",
      },
      system: EXPLAIN_SYSTEM,
      prompt: buildExplainPrompt(text, body.context ?? "", body.book),
      json: true,
      parse: parseExplanation,
    });
  });
}
