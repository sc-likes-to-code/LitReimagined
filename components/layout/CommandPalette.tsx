"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/config/site";
import { lockPageScroll } from "@/lib/client/smooth-scroll";

type Item = { label: string; href: string; hint: string };

const ITEMS: Item[] = [
  { label: "Home", href: "/", hint: "Start here" },
  ...siteConfig.nav.map((n) => ({ label: n.label, href: n.href, hint: "Page" })),
  { label: "My library", href: "/library", hint: "Your shelf" },
  { label: "Sign in", href: "/login", hint: "Account" },
];

/** ⌘K / Ctrl+K quick navigation. Book search results plug in here once the library exists. */
export function CommandPalette() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const unlock = useRef<(() => void) | null>(null);
  const release = () => {
    unlock.current?.();
    unlock.current = null;
  };

  const results = ITEMS.filter((i) =>
    i.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const open = useCallback(() => {
    if (!unlock.current) unlock.current = lockPageScroll();
    dialogRef.current?.showModal();
    inputRef.current?.focus();
  }, []);
  const close = useCallback(() => {
    dialogRef.current?.close();
    release();
    setQuery("");
    setActive(0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialogRef.current?.open) close();
        else open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  function go(item: Item | undefined) {
    if (!item) return;
    close();
    router.push(item.href);
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label="Search (Ctrl K)"
        className="hairline text-muted hover:text-ink hidden h-10 items-center gap-2 rounded-full pr-3 pl-4 text-sm transition-colors lg:flex"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4.5 4.5" />
        </svg>
        Search
        <kbd className="border-line text-faint rounded-md border px-1.5 py-0.5 text-[0.65rem]">
          Ctrl K
        </kbd>
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => {
          release();
          setQuery("");
          setActive(0);
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        aria-label="Search and navigate"
        className="bg-bg-elev text-ink border-line-strong m-auto mt-[12vh] w-[min(92vw,40rem)] rounded-3xl border p-0 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        <div className="border-line border-b p-4">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKey}
            placeholder="Search pages, books, authors…"
            aria-label="Search"
            className="placeholder:text-faint w-full bg-transparent px-2 py-2 text-lg outline-none"
          />
        </div>
        <ul role="listbox" className="max-h-[min(34rem,68vh)] overflow-auto p-2">
          {results.length === 0 && (
            <li className="text-muted px-4 py-6 text-center text-sm">Nothing found.</li>
          )}
          {results.map((item, i) => (
            <li key={item.href} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(item)}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-colors ${i === active ? "bg-surface" : ""}`}
              >
                <span>{item.label}</span>
                <span className="text-faint text-xs">{item.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </dialog>
    </>
  );
}
