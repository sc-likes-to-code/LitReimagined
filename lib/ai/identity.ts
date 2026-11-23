import "server-only";
import { randomUUID } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { createServerClient } from "@supabase/ssr";
import type { Subject } from "./types";

const COOKIE = "lr_aid";

/** Resolves who is calling: the signed-in user, or an anonymous visitor tracked by cookie. */
export async function resolveSubject(
  request: NextRequest,
): Promise<{ subject: Subject; newAnonId?: string }> {
  if (isSupabaseConfigured) {
    const sb = createServerClient(publicEnv.supabaseUrl!, publicEnv.supabaseAnonKey!, {
      cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} },
    });
    const { data } = await sb.auth.getUser();
    if (data.user) return { subject: { kind: "user", id: data.user.id } };
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;
  const existing = request.cookies.get(COOKIE)?.value;
  const valid = existing && /^[0-9a-f-]{36}$/.test(existing);
  const id = valid ? existing : randomUUID();
  return { subject: { kind: "anon", id, ip }, newAnonId: valid ? undefined : id };
}

export function attachAnonCookie(res: NextResponse, id: string | undefined) {
  if (!id) return res;
  res.cookies.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return res;
}
