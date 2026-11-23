"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { InkMeter } from "@/components/ai/InkMeter";
import { Button } from "@/components/ui/Button";
import { REWRITE_STYLES, type RewriteStyle } from "@/config/ai";
import { postAi } from "@/lib/client/ai";
import { cn } from "@/lib/utils";

export type AiPanelRequest = {
  kind: "rewrite" | "explain";
  text: string;
  context: string;
  book: string;
};

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; text: string; note?: string; cached: boolean; demo: boolean }
  | { status: "error"; message: string; code: string };

type Props = {
  request: AiPanelRequest;
  onClose: () => void;
  /** Save the result as a note on a highlight of the selected text. */
  onSave: (text: string, note: string) => void;
};

export function AiPanel({ request, onClose, onSave }: Props) {
  const [kind, setKind] = useState(request.kind);
  const [style, setStyle] = useState<RewriteStyle>("plain");
  const [state, setState] = useState<State>({ status: "loading" });
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const seq = useRef(0);

  /** Calls the endpoint and maps the reply to a UI state. Pure: it never sets state itself. */
  const fetchState = useCallback(
    async (k: "rewrite" | "explain", s: RewriteStyle): Promise<State> => {
      const res =
        k === "rewrite"
          ? await postAi<string>("/api/ai/rewrite", {
              text: request.text,
              style: s,
              book: request.book,
            })
          : await postAi<{ meaning: string; note: string }>("/api/ai/explain", {
              text: request.text,
              context: request.context,
              book: request.book,
            });
      if (!res.ok) return { status: "error", message: res.message, code: res.code };
      if (k === "rewrite") {
        return {
          status: "done",
          text: res.output as string,
          cached: res.cached,
          demo: res.demo,
        };
      }
      const o = res.output as { meaning: string; note: string };
      return {
        status: "done",
        text: o.meaning,
        note: o.note,
        cached: res.cached,
        demo: res.demo,
      };
    },
    [request],
  );

  /** User-initiated request: show the loading state, then apply the newest reply only. */
  const run = useCallback(
    (k: "rewrite" | "explain", s: RewriteStyle) => {
      const mine = ++seq.current;
      setState({ status: "loading" });
      setSaved(false);
      void fetchState(k, s).then((next) => {
        if (mine === seq.current) setState(next);
      });
    },
    [fetchState],
  );

  // The first request: the panel already starts in the loading state.
  useEffect(() => {
    const mine = ++seq.current;
    void fetchState(request.kind, "plain").then((next) => {
      if (mine === seq.current) setState(next);
    });
  }, [request.kind, fetchState]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function copy() {
    if (state.status !== "done") return;
    try {
      await navigator.clipboard.writeText(state.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <aside
      role="dialog"
      aria-label="The quill"
      className="glass fixed inset-x-3 bottom-24 z-[65] max-h-[70dvh] overflow-auto rounded-3xl p-5 shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-[26rem]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-circuit">The quill</p>
          <div
            role="tablist"
            aria-label="Quill action"
            className="hairline mt-3 inline-flex rounded-full p-0.5"
          >
            {(["explain", "rewrite"] as const).map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={kind === k}
                onClick={() => {
                  setKind(k);
                  run(k, style);
                }}
                className={cn(
                  "rounded-full px-4 py-1 text-xs capitalize transition-colors",
                  kind === k ? "bg-ink text-bg" : "text-muted hover:text-ink",
                )}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-muted hover:text-ink grid size-8 place-items-center rounded-full"
        >
          ✕
        </button>
      </div>

      <blockquote className="font-reading text-muted border-line mt-5 line-clamp-3 border-l-2 pl-3 text-sm italic">
        {request.text}
      </blockquote>

      {kind === "rewrite" && (
        <div className="mt-4 flex flex-wrap gap-2">
          {(Object.keys(REWRITE_STYLES) as RewriteStyle[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStyle(s);
                run("rewrite", s);
              }}
              aria-pressed={style === s}
              title={REWRITE_STYLES[s].hint}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                style === s
                  ? "bg-circuit/15 border-circuit text-circuit"
                  : "border-line text-muted hover:text-ink",
              )}
            >
              {REWRITE_STYLES[s].label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 min-h-24" aria-live="polite">
        {state.status === "loading" && (
          <div className="space-y-2.5" aria-label="The quill is writing">
            <div className="bg-surface-2 h-3.5 w-full animate-pulse rounded" />
            <div className="bg-surface-2 h-3.5 w-11/12 animate-pulse rounded" />
            <div className="bg-surface-2 h-3.5 w-3/5 animate-pulse rounded" />
          </div>
        )}
        {state.status === "done" && (
          <div className="morph-in">
            <p className="text-[0.95rem] leading-relaxed">{state.text}</p>
            {state.note && (
              <p className="text-muted mt-3 text-sm leading-relaxed">{state.note}</p>
            )}
            <p className="text-faint mt-3 text-xs">
              {state.demo
                ? "Demo reply. Connect a Gemini key for real answers."
                : "AI-generated. Check the original if something feels off."}
              {state.cached && !state.demo ? " · Instant (cached)" : ""}
            </p>
          </div>
        )}
        {state.status === "error" && (
          <div role="alert">
            <p className="text-sm leading-relaxed">{state.message}</p>
            {(state.code === "unavailable" || state.code === "rate") && (
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => run(kind, style)}
              >
                Try again
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="border-line mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <InkMeter />
        {state.status === "done" && (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={copy}>
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={saved}
              onClick={() => {
                onSave(request.text, state.text);
                setSaved(true);
              }}
            >
              {saved ? "Saved to notes" : "Save as note"}
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
