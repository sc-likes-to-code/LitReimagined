import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { MAX_QUERY_CHARS } from "@/config/ai";
import { runAi } from "@/lib/ai/gateway";
import { attachAnonCookie, resolveSubject } from "@/lib/ai/identity";
import { sameOrigin } from "@/lib/ai/http";
import { RECOMMEND_SYSTEM, buildRecommendPrompt } from "@/lib/ai/prompts";
import { getProvider } from "@/lib/ai/providers";
import { pickBooks } from "@/lib/ai/recommend";

const schema = z.object({ query: z.string().trim().min(3).max(MAX_QUERY_CHARS) });

type Picks = { picks: { slug: string; reason: string }[] };

function parsePicks(raw: string): Picks {
  const j = JSON.parse(raw) as Picks;
  if (!Array.isArray(j.picks)) throw new Error("bad shape");
  return {
    picks: j.picks.filter(
      (p) => typeof p.slug === "string" && typeof p.reason === "string",
    ),
  };
}

/**
 * Finding books is free (embeddings or keyword scoring). The one-line reasons are the
 * only part that spends AI quota, and the answer degrades to the book's own blurb without it.
 */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json({ ok: false, code: "invalid" }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Tell us a little more." },
      { status: 400 },
    );

  const { subject, newAnonId } = await resolveSubject(request);
  const books = await pickBooks(parsed.data.query, 3);

  const reasons = new Map<string, string>();
  // Placeholder replies add nothing here, so demo mode skips the AI step entirely.
  const ai = getProvider().demo
    ? null
    : await runAi<Picks>({
        feature: "recommend",
        subject,
        cacheInput: {
          q: parsed.data.query.toLowerCase(),
          slugs: books.map((b) => b.slug),
        },
        system: RECOMMEND_SYSTEM,
        prompt: buildRecommendPrompt(
          parsed.data.query,
          books.map((b) => ({
            slug: b.slug,
            title: b.title,
            author: b.author.name,
            synopsis: b.synopsis,
          })),
        ),
        json: true,
        parse: parsePicks,
      });
  if (ai?.ok) for (const p of ai.output.picks) reasons.set(p.slug, p.reason);

  const res = NextResponse.json({
    ok: true,
    aiReasons: Boolean(ai?.ok),
    ...(ai ? { remaining: ai.remaining, limit: ai.limit } : {}),
    picks: books.map((b) => ({
      slug: b.slug,
      title: b.title,
      author: b.author.name,
      reason: reasons.get(b.slug) ?? b.whyRead,
    })),
  });
  return attachAnonCookie(res, newAnonId);
}
