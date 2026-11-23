import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "ember" | "circuit";

const tones: Record<Tone, string> = {
  neutral: "text-muted border-line",
  ember: "text-ember border-ember/40 bg-ember/10",
  circuit: "text-circuit border-circuit/40 bg-circuit/10",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: { tone?: Tone } & ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.7rem] font-medium tracking-wide uppercase",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
