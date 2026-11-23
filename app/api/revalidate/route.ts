import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env";

const TAGS = ["books", "authors", "collections"] as const;

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Refreshes cached catalogue data right after the content pipeline runs.
 * POST with header `x-revalidate-secret: <REVALIDATE_SECRET>`. Disabled until the secret is set.
 */
export async function POST(request: NextRequest) {
  const secret = getServerEnv().revalidateSecret;
  const given = request.headers.get("x-revalidate-secret") ?? "";
  if (!secret || !safeEqual(given, secret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  for (const tag of TAGS) revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ ok: true, revalidated: TAGS });
}
