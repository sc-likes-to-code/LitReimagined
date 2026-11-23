import { cn } from "@/lib/utils";

type MarkProps = { className?: string; title?: string };

/**
 * The LitReimagined mark: an ember bookmark with a quill whose tip sparks
 * a circuit line (classic craft, modern intelligence).
 */
export function LogoMark({ className, title }: MarkProps) {
  return (
    <svg
      viewBox="0 0 48 64"
      className={cn("h-8 w-auto", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id="lr-ember" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF9A3C" />
          <stop offset="1" stopColor="#FF4B2E" />
        </linearGradient>
      </defs>
      <path
        d="M9 3h30a5 5 0 0 1 5 5v53.2a1 1 0 0 1-1.6.8L24 48.4 5.6 62a1 1 0 0 1-1.6-.8V8a5 5 0 0 1 5-5Z"
        fill="url(#lr-ember)"
      />
      {/* quill */}
      <path
        d="M34.5 12C23 13.5 16.5 22.5 15.5 36c8.5-1.6 16.8-8 19-24Z"
        fill="var(--bg)"
        opacity="0.92"
      />
      <path
        d="M15.5 40.5 30.5 18"
        stroke="url(#lr-ember)"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      {/* circuit spark */}
      <path
        d="M13 46h6l3-3.5h5"
        stroke="var(--bg)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="29.5" cy="42.5" r="1.8" fill="var(--bg)" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display text-[1.35rem] leading-none tracking-tight text-ink",
        className,
      )}
    >
      Lit<em className="font-normal text-gradient-ember italic">Reimagined</em>
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="h-7" />
      <Wordmark />
    </span>
  );
}
