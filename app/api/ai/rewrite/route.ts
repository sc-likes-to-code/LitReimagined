import type { NextRequest } from "next/server";
import { z } from "zod";
import { MAX_PASSAGE_CHARS, REWRITE_STYLES, type RewriteStyle } from "@/config/ai";
import { runAi } from "@/lib/ai/gateway";
import { handleAi } from "@/lib/ai/http";
import { REWRITE_SYSTEM, buildRewritePrompt } from "@/lib/ai/prompts";

const styles = Object.keys(REWRITE_STYLES) as [RewriteStyle, ...RewriteStyle[]];
const schema = z.object({
  text: z.string().trim().min(2).max(MAX_PASSAGE_CHARS),
  style: z.enum(styles),
  book: z.string().trim().max(120).optional(),
});

export async function POST(request: NextRequest) {
  return handleAi(request, schema, (body, subject) => {
    const text = body.text.replace(/\s+/g, " ");
    return runAi<string>({
      feature: "rewrite",
      subject,
      // The book title only flavours the prompt; it must not fragment the cache.
      cacheInput: { text, style: body.style },
      system: REWRITE_SYSTEM,
      prompt: buildRewritePrompt(text, body.style, body.book),
      parse: (raw) => raw.replace(/^["“]|["”]$/g, "").trim(),
    });
  });
}
