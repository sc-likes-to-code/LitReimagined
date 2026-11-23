import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";

/**
 * Cookie-aware server client for reading the signed-in user. Reads request cookies,
 * so call it only from dynamic (Suspense-wrapped) code, never inside `use cache`.
 */
export async function getServerClient() {
  if (!isSupabaseConfigured) return null;
  const store = await cookies();
  return createServerClient(publicEnv.supabaseUrl!, publicEnv.supabaseAnonKey!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* called from a Server Component: the proxy refreshes sessions instead */
        }
      },
    },
  });
}
