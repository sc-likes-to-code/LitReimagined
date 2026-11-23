"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";

export type AuthState = { user: User | null; loading: boolean; configured: boolean };

/** Current Supabase user. In demo mode there is never a user and nothing is loading. */
export function useUser(): AuthState {
  const supabase = getBrowserClient();
  const [state, setState] = useState<{ user: User | null; loading: boolean }>({
    user: null,
    loading: Boolean(supabase),
  });

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setState({ user: data.user, loading: false });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, loading: false });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  return { ...state, configured: Boolean(supabase) };
}
