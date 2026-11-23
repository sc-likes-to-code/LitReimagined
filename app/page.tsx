import Link from "next/link";
import { TextMorph } from "@/components/home/TextMorph";

export default function Home() {
  return (
    <section className="relative isolate overflow-hidden pt-[calc(var(--nav-h)+5rem)] pb-24">
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[38rem] w-[60rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgb(255 90 54 / 0.35), rgb(76 201 240 / 0.12) 55%, transparent)",
        }}
      />
      <div className="container-page text-center">
        <p className="eyebrow mb-8">Classic literature · Modern voice</p>
        <h1 className="font-display mx-auto max-w-5xl text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.95] tracking-tight">
          Classics,
          <br />
          <em className="text-gradient-ember font-normal">reimagined.</em>
        </h1>
        <p className="text-muted mx-auto mt-8 max-w-xl text-lg leading-relaxed">
          Read the great books in language that speaks to you today, side by side with the
          original. Slide from the author&apos;s own words to a fresh, modern voice.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/explore"
            className="from-ember to-ember-2 rounded-full bg-gradient-to-r px-7 py-3.5 font-medium text-white shadow-[0_12px_40px_-12px_var(--ember)] transition-transform hover:-translate-y-0.5"
          >
            Start reading
          </Link>
          <Link
            href="/how-it-works"
            className="hairline hover:bg-surface rounded-full px-7 py-3.5 font-medium transition-colors"
          >
            How it works
          </Link>
        </div>
        <div className="mt-20">
          <TextMorph />
        </div>
      </div>
    </section>
  );
}
