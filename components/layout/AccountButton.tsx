"use client";

import Link from "next/link";
import { useUser } from "@/lib/client/auth";

export function AccountButton() {
  const { user, loading } = useUser();

  if (user) {
    const label =
      (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Account";
    return (
      <Link
        href="/library"
        aria-label="Your library"
        title={label}
        className="from-ember to-ember-2 grid size-10 place-items-center rounded-full bg-gradient-to-br text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
      >
        {label.trim().charAt(0).toUpperCase()}
      </Link>
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
