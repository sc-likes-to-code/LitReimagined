"use client";

import { useEffect } from "react";
import { useUser } from "@/lib/client/auth";

/** Mounts once at the root: syncs guest data with the account whenever someone is signed in. */
export function SyncProvider() {
  const { user } = useUser();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let stop: (() => void) | undefined;
    let cancelled = false;

    // Loaded only for signed-in readers.
    void Promise.all([
      import("@/lib/client/sync"),
      import("@/lib/supabase/browser"),
    ]).then(([{ startSync }, { getBrowserClient }]) => {
      const sb = getBrowserClient();
      if (!sb || cancelled) return;
      stop = startSync(sb, userId);
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [userId]);

  return null;
}
