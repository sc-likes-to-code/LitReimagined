"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { signOutAndClear, useUser } from "@/lib/client/auth";
import { siteConfig } from "@/config/site";

/** Full-screen menu for small screens. Closes itself whenever the route changes. */
export function MobileMenu() {
  const pathname = usePathname();
  const router = useRouter();
  // Remember which page the menu was opened on; navigating elsewhere closes it with no effect needed.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const { user } = useUser();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenedOn(null);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const links = [
    { href: "/", label: "Home" },
    ...siteConfig.nav,
    { href: "/library", label: "My library" },
  ];

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpenedOn(open ? null : pathname)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="hairline text-ink grid size-10 place-items-center rounded-full"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        >
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 8h16M4 16h16" />}
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="bg-bg/95 fixed inset-0 z-[80] flex flex-col justify-between px-8 pt-28 pb-10 backdrop-blur-xl md:hidden"
          >
            <button
              type="button"
              onClick={() => setOpenedOn(null)}
              aria-label="Close menu"
              className="hairline text-ink absolute top-[1.1rem] right-6 grid size-10 place-items-center rounded-full"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
            <ul className="space-y-1">
              {links.map((l, i) => (
                <li
                  key={l.href}
                  className="morph-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <Link
                    href={l.href}
                    className="font-display hover:text-gradient-ember block py-2 text-4xl tracking-tight"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between gap-4">
              {user && (
                <button
                  type="button"
                  onClick={async () => {
                    await signOutAndClear();
                    setOpenedOn(null);
                    router.push("/");
                    router.refresh();
                  }}
                  className="bg-ink text-bg rounded-full px-7 py-3.5 font-medium whitespace-nowrap"
                >
                  Sign out
                </button>
              )}
              {!user && (
                <Link
                  href="/login"
                  className="bg-ink text-bg rounded-full px-7 py-3.5 font-medium whitespace-nowrap"
                >
                  Sign in
                </Link>
              )}
              <p className="text-faint text-right text-xs">{siteConfig.tagline}</p>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
