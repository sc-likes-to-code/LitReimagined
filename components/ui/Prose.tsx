import type { ReactNode } from "react";

/** Long-form text styling for legal and editorial pages. */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="font-reading [&_h2]:font-display [&_li]:text-muted [&_p]:text-muted [&_strong]:text-ink max-w-2xl space-y-6 text-lg leading-[1.8] [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-14 [&_h2]:text-3xl [&_h2]:tracking-tight [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
      {children}
    </div>
  );
}
