import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";

/**
 * Keeps the Supabase session fresh on account routes only, so every public page
 * stays fully static and cacheable. Does nothing until Supabase is configured.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(
    publicEnv.supabaseUrl!,
    publicEnv.supabaseAnonKey!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Validates and refreshes the session cookie.
  const { data } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  if (data.user && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/library", request.url));
  }
  return response;
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/library",
    "/auth/:path*",
  ],
};
