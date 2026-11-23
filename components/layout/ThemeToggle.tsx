"use client";

import { useSyncExternalStore } from "react";

type Theme = "ink" | "paper";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

const getSnapshot = (): Theme =>
  document.documentElement.dataset.theme === "paper" ? "paper" : "ink";
const getServerSnapshot = (): Theme => "ink";

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const next: Theme = theme === "ink" ? "paper" : "ink";

  function toggle() {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("lr-theme", next);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next === "ink" ? "dark" : "light"} theme`}
      className="hairline text-muted hover:text-ink grid size-10 place-items-center rounded-full transition-colors"
    >
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        {theme === "ink" ? (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        )}
      </svg>
    </button>
  );
}
