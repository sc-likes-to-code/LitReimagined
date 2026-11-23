"use client";

import { useEffect } from "react";
import { useUser } from "@/lib/client/auth";
import { startSync } from "@/lib/client/sync";
import { getBrowserClient } from "@/lib/supabase/browser";

/** Mounts once at the root: syncs guest data with the account whenever someone is signed in. */
export function SyncProvider() {
  const { user } = useUser();
  const userId = user?.id;

  useEffect(() => {
    const sb = getBrowserClient();
    if (!sb || !userId) return;
    return startSync(sb, userId);
  }, [userId]);

  return null;
}
