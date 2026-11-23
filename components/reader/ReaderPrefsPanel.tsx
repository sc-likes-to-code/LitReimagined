"use client";

import { updatePrefs, DEFAULT_PREFS, type ReaderPrefs } from "@/lib/client/library";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-muted text-sm">{label}</span>
      {children}
    </div>
  );
}

function Seg<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="hairline inline-flex rounded-full p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full px-3 py-1 text-xs transition-colors",
            value === o.value ? "bg-ink text-bg" : "text-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ReaderPrefsPanel({
  prefs,
  onClose,
}: {
  prefs: ReaderPrefs;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="Reading settings"
      className="glass fixed top-[calc(var(--nav-h)+0.5rem)] right-3 z-50 w-[min(92vw,22rem)] rounded-3xl p-5 shadow-2xl sm:right-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">Reading settings</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings"
          className="text-muted hover:text-ink grid size-8 place-items-center rounded-full"
        >
          ✕
        </button>
      </div>
      <div className="divide-y divide-[var(--line)]">
        <Row label="Reading view">
          <Seg
            value={prefs.mode}
            onChange={(mode) => updatePrefs({ mode })}
            options={[
              { value: "book", label: "Book" },
              { value: "scroll", label: "Scroll" },
            ]}
          />
        </Row>
        <Row label="Text size">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={15}
              max={26}
              value={prefs.fontSize}
              onChange={(e) => updatePrefs({ fontSize: Number(e.target.value) })}
              aria-label="Text size"
              className="w-28 accent-[var(--ember)]"
            />
            <span className="text-faint w-8 text-xs tabular-nums">
              {prefs.fontSize}px
            </span>
          </div>
        </Row>
        <Row label="Line spacing">
          <input
            type="range"
            min={1.4}
            max={2.1}
            step={0.05}
            value={prefs.lineHeight}
            onChange={(e) => updatePrefs({ lineHeight: Number(e.target.value) })}
            aria-label="Line spacing"
            className="w-28 accent-[var(--ember)]"
          />
        </Row>
        {prefs.mode === "scroll" && (
          <Row label="Width">
            <Seg
              value={prefs.measure}
              onChange={(measure) => updatePrefs({ measure })}
              options={[
                { value: "narrow", label: "Narrow" },
                { value: "medium", label: "Medium" },
                { value: "wide", label: "Wide" },
              ]}
            />
          </Row>
        )}
        <Row label="Typeface">
          <Seg
            value={prefs.family}
            onChange={(family) => updatePrefs({ family })}
            options={[
              { value: "serif", label: "Serif" },
              { value: "sans", label: "Sans" },
            ]}
          />
        </Row>
        {prefs.mode === "scroll" && (
          <Row label="Focus mode">
            <Seg
              value={prefs.focus ? "on" : "off"}
              onChange={(v) => updatePrefs({ focus: v === "on" })}
              options={[
                { value: "off", label: "Off" },
                { value: "on", label: "On" },
              ]}
            />
          </Row>
        )}
        <Row label="Theme">
          <ThemeToggle />
        </Row>
      </div>
      <button
        type="button"
        onClick={() =>
          updatePrefs({
            ...DEFAULT_PREFS,
            level: prefs.level,
            view: prefs.view,
            mode: prefs.mode,
          })
        }
        className="text-muted hover:text-ink mt-3 text-xs underline underline-offset-4"
      >
        Reset to defaults
      </button>
    </div>
  );
}
