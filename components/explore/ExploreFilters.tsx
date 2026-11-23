"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Facets = { genres: string[]; eras: string[]; moods: string[] };

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "title", label: "Title A–Z" },
  { value: "difficulty", label: "Easiest first" },
  { value: "length", label: "Shortest first" },
  { value: "year", label: "Oldest first" },
];

const DIFFICULTY = [
  { value: "", label: "Any" },
  { value: "2", label: "Easy" },
  { value: "3", label: "Medium" },
  { value: "5", label: "Challenging" },
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors",
        active
          ? "bg-ink text-bg border-transparent"
          : "border-line text-muted hover:text-ink hover:border-line-strong",
      )}
    >
      {children}
    </button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="eyebrow mb-3">{title}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

/** URL-driven filters: every change updates the query string, so views are shareable. */
export function ExploreFilters({ facets, total }: { facets: Facets; total?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const lastPushed = useRef(params.get("q") ?? "");

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => {
      router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
    });
  }

  // Debounce search typing into the URL.
  useEffect(() => {
    if (q === lastPushed.current) return;
    const t = setTimeout(() => {
      lastPushed.current = q;
      const next = new URLSearchParams(window.location.search);
      if (q.trim()) next.set("q", q.trim());
      else next.delete("q");
      startTransition(() => {
        router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
      });
    }, 280);
    return () => clearTimeout(t);
  }, [q, pathname, router]);

  const genre = params.get("genre");
  const era = params.get("era");
  const mood = params.get("mood");
  const diff = params.get("difficulty") ?? "";
  const sort = params.get("sort") ?? "featured";
  const hasFilters = Boolean(genre || era || mood || diff || params.get("q"));

  function reset() {
    setQ("");
    lastPushed.current = "";
    startTransition(() => router.replace(pathname, { scroll: false }));
  }

  return (
    <div className={cn("space-y-8 transition-opacity", pending && "opacity-70")}>
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          className="text-faint pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4.5 4.5" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Title, author or mood"
          aria-label="Search the library"
          className="bg-surface border-line placeholder:text-faint focus:border-circuit h-12 w-full rounded-full border pr-4 pl-11 transition-colors outline-none"
        />
      </div>

      <Group title="Genre">
        {facets.genres.map((g) => (
          <Chip
            key={g}
            active={genre === g}
            onClick={() => setParam("genre", genre === g ? null : g)}
          >
            {g}
          </Chip>
        ))}
      </Group>

      <Group title="Era">
        {facets.eras.map((e) => (
          <Chip
            key={e}
            active={era === e}
            onClick={() => setParam("era", era === e ? null : e)}
          >
            {e}
          </Chip>
        ))}
      </Group>

      <Group title="Mood">
        {facets.moods.map((m) => (
          <Chip
            key={m}
            active={mood === m}
            onClick={() => setParam("mood", mood === m ? null : m)}
          >
            {m}
          </Chip>
        ))}
      </Group>

      <Group title="Difficulty">
        {DIFFICULTY.map((d) => (
          <Chip
            key={d.label}
            active={diff === d.value}
            onClick={() => setParam("difficulty", d.value || null)}
          >
            {d.label}
          </Chip>
        ))}
      </Group>

      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Sort</span>
          <select
            value={sort}
            onChange={(e) =>
              setParam("sort", e.target.value === "featured" ? null : e.target.value)
            }
            className="bg-surface border-line rounded-full border px-3 py-1.5 text-sm outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        {hasFilters && (
          <button
            type="button"
            onClick={reset}
            className="text-muted hover:text-ink text-sm underline underline-offset-4"
          >
            Clear all{typeof total === "number" ? ` · ${total} shown` : ""}
          </button>
        )}
      </div>
    </div>
  );
}
