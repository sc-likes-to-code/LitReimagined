"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { InkMeter } from "@/components/ai/InkMeter";
import { Button } from "@/components/ui/Button";
import { postAi } from "@/lib/client/ai";

type Pick = { slug: string; title: string; author: string; reason: string };
type Reply = { picks: Pick[]; aiReasons: boolean };

const IDEAS = [
  "something dark and romantic",
  "a short, funny classic",
  "an epic sea adventure",
  "a book that will make me think",
];

/** "Find my next book": describe a mood in plain words. Matching is free; only the blurbs use AI. */
export function RecommendBox() {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<Reply | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ask(q: string) {
    if (q.trim().length < 3) return;
    setBusy(true);
    setError(null);
    const res = await postAi<never>("/api/ai/recommend", { query: q });
    // The recommend endpoint has its own response shape, so read it directly.
    setBusy(false);
    const raw = res as unknown as { ok: boolean; message?: string } & Partial<Reply>;
    if (raw.ok && raw.picks)
      setReply({ picks: raw.picks, aiReasons: Boolean(raw.aiReasons) });
    else setError(raw.message ?? "Could not find a match just now.");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(query);
  }

  return (
    <section
      aria-labelledby="mood-title"
      className="border-line mb-14 rounded-[2rem] border p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="mood-title" className="font-display text-2xl">
          Not sure what to read?{" "}
          <em className="text-gradient-ember font-normal">Tell the quill.</em>
        </h2>
        <InkMeter />
      </div>
      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={200}
          placeholder="Describe your mood, e.g. “moody and gothic with a love story”"
          aria-label="Describe what you feel like reading"
          className="bg-surface border-line placeholder:text-faint focus:border-circuit h-12 flex-1 rounded-full border px-5 transition-colors outline-none"
        />
        <Button
          type="submit"
          disabled={busy || query.trim().length < 3}
          className="sm:w-40"
        >
          {busy ? "Thinking…" : "Find my book"}
        </Button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {IDEAS.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setQuery(i);
              void ask(i);
            }}
            className="border-line text-muted hover:text-ink rounded-full border px-3 py-1 text-xs transition-colors"
          >
            {i}
          </button>
        ))}
      </div>

      <div aria-live="polite">
        {error && <p className="text-ember mt-5 text-sm">{error}</p>}
        {reply && (
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {reply.picks.map((p, i) => (
              <li
                key={p.slug}
                className="morph-in"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <Link
                  href={`/books/${p.slug}`}
                  className="hairline hover:bg-surface block h-full rounded-2xl p-5 transition-colors"
                >
                  <p className="font-display text-lg leading-snug">{p.title}</p>
                  <p className="text-faint text-xs">{p.author}</p>
                  <p className="text-muted mt-3 text-sm leading-relaxed">{p.reason}</p>
                </Link>
              </li>
            ))}
          </ol>
        )}
        {reply && !reply.aiReasons && (
          <p className="text-faint mt-3 text-xs">
            Matched on mood and genre. Descriptions come from the book&apos;s own blurb.
          </p>
        )}
      </div>
    </section>
  );
}
