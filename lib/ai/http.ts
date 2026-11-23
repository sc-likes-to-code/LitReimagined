import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type { ZodType } from "zod";
import { attachAnonCookie, resolveSubject } from "./identity";
import type { AiResult, Subject } from "./types";

/** Rejects cross-site browser requests to the AI endpoints. */
export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin GETs and non-browser clients carry no Origin
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function handleAi<B, O>(
  request: NextRequest,
  schema: ZodType<B>,
  run: (body: B, subject: Subject) => Promise<AiResult<O>>,
) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Forbidden" },
      { status: 403 },
    );

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Invalid request." },
      { status: 400 },
    );
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Please check your input." },
      { status: 400 },
    );
  }

  const { subject, newAnonId } = await resolveSubject(request);
  const result = await run(parsed.data, subject);
  const status = result.ok
    ? 200
    : result.code === "quota" || result.code === "rate" || result.code === "breaker"
      ? 429
      : 503;
  return attachAnonCookie(NextResponse.json(result, { status }), newAnonId);
}
