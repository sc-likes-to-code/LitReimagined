"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="eyebrow mb-6">Something went wrong</p>
        <h1 className="font-display text-5xl tracking-tight sm:text-7xl">
          A smudge on <em className="text-gradient-ember font-normal">the page.</em>
        </h1>
        <p className="text-muted mx-auto mt-6 max-w-md">
          That did not load properly. It is on our side, and trying again usually works.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <ButtonLink href="/" variant="secondary">
            Go home
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
