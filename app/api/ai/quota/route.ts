import { NextResponse, type NextRequest } from "next/server";
import { peekQuota } from "@/lib/ai/gateway";
import { attachAnonCookie, resolveSubject } from "@/lib/ai/identity";

export async function GET(request: NextRequest) {
  const { subject, newAnonId } = await resolveSubject(request);
  const q = await peekQuota(subject);
  const res = NextResponse.json({ ok: true, ...q, signedIn: subject.kind === "user" });
  res.headers.set("Cache-Control", "no-store");
  return attachAnonCookie(res, newAnonId);
}
