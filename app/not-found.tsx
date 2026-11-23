import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/layout/Nav";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main
        id="main"
        className="grid min-h-[80dvh] flex-1 place-items-center px-6 pt-24 text-center"
      >
        <div>
          <p className="eyebrow mb-6">Error 404</p>
          <h1 className="font-display text-6xl tracking-tight sm:text-8xl">
            This page has{" "}
            <em className="text-gradient-ember font-normal">wandered off.</em>
          </h1>
          <p className="text-muted mx-auto mt-6 max-w-md">
            Even the best libraries lose a book now and then. Let&apos;s find you another.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/explore">Browse the library</ButtonLink>
            <ButtonLink href="/" variant="secondary">
              Go home
            </ButtonLink>
          </div>
          <p className="text-faint mt-8 text-xs">
            Or press{" "}
            <kbd className="border-line rounded border px-1.5 py-0.5">Ctrl K</kbd> to
            search.{" "}
            <Link href="/how-it-works" className="underline underline-offset-4">
              How it works
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
