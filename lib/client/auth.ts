"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/env";

export type AuthState = { user: User | null; loading: boolean; configured: boolean };

/**
 * Current Supabase user. In demo mode there is never a user and nothing is loaded.
 * The Supabase client is imported on demand, so visitors without accounts never download it.
 */
export function useUser(): AuthState {
  const [state, setState] = useState<{ user: User | null; loading: boolean }>({
    user: null,
    loading: isSupabaseConfigured,
  });

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    let unsubscribe: (() => void) | undefined;

    void import("@/lib/supabase/browser").then(({ getBrowserClient }) => {
      const supabase = getBrowserClient();
      if (!supabase || !active) return;
      supabase.auth.getUser().then(({ data }) => {
        if (active) setState({ user: data.user, loading: false });
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setState({ user: session?.user ?? null, loading: false });
      });
      unsubscribe = () => sub.subscription.unsubscribe();
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  return { ...state, configured: isSupabaseConfigured };
}

/**
 * Signs out and removes this person's reading data from the browser, so the next visitor on a
 * shared computer never sees it (it stays safely in their account).
 */
export async function signOutAndClear() {
  const [{ getBrowserClient }, { pauseSync }, { clearLibraryStores }] = await Promise.all(
    [
      import("@/lib/supabase/browser"),
      import("@/lib/client/sync"),
      import("@/lib/client/library"),
    ],
  );
  pauseSync();
  await getBrowserClient()?.auth.signOut();
  clearLibraryStores();
}
