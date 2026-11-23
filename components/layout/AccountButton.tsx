"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOutAndClear, useUser } from "@/lib/client/auth";

export function AccountButton() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (user) {
    const label =
      (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Account";

    async function out() {
      setBusy(true);
      await signOutAndClear();
      setOpen(false);
      setBusy(false);
      router.push("/");
      router.refresh();
    }

    return (
      <div ref={box} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Account menu"
          title={label}
          className="from-ember to-ember-2 grid size-10 place-items-center rounded-full bg-gradient-to-br text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          {label.trim().charAt(0).toUpperCase()}
        </button>
        {open && (
          <div
            role="menu"
            className="glass absolute top-12 right-0 z-50 w-56 rounded-2xl p-2 shadow-2xl"
          >
            <p className="text-faint truncate px-3 py-2 text-xs">{user.email ?? label}</p>
            <Link
              href="/library"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="hover:bg-surface block rounded-xl px-3 py-2 text-sm"
            >
              Your library
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={out}
              disabled={busy}
              className="hover:bg-surface text-ember block w-full rounded-xl px-3 py-2 text-left text-sm disabled:opacity-50"
            >
              {busy ? "Signing out…" : "Sign out"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href="/login"
      aria-busy={loading}
      className="bg-ink text-bg hidden rounded-full px-5 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5 sm:inline-block"
    >
      Sign in
    </Link>
  );
}
