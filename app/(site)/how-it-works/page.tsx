import type { Metadata } from "next";
import Link from "next/link";
import { CandleDoodle } from "@/components/brand/Doodles";
import { SliderDemo } from "@/components/home/SliderDemo";
import { PageHeader } from "@/components/ui/PageHeader";
import { Prose } from "@/components/ui/Prose";
import { demoContent } from "@/data/demo/content";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How LitReimagined modernizes classic literature with AI, what we promise about quality, and how to see the original at any time.",
};

export default function HowItWorksPage() {
  const sample = demoContent["alices-adventures-in-wonderland"];
  const canDemo = Boolean(sample);

  return (
    <div className="container-page relative pt-[calc(var(--nav-h)+4rem)]">
      <CandleDoodle className="absolute top-[calc(var(--nav-h)+3rem)] right-10 hidden h-52 lg:block" />
      <PageHeader
        eyebrow="Transparency"
        title={
          <>
            How the <em className="text-gradient-ember font-normal">reimagining</em>{" "}
            works.
          </>
        }
      >
        We believe AI should make old books easier to love, not replace them. Here is
        exactly what we do, and what we don&apos;t.
      </PageHeader>

      <Prose>
        <h2>The original is always the original</h2>
        <p>
          Every text on LitReimagined is a public-domain edition from Project Gutenberg.
          We never edit it. The original sits one tap away on every page, and in split
          view it runs beside the modern version, paragraph for paragraph.
        </p>

        <h2>Three levels of modern</h2>
        <ul>
          <li>
            <strong>Light:</strong> the author&apos;s sentences, gently polished. Archaic
            words and clumsy constructions are replaced, but the rhythm survives.
          </li>
          <li>
            <strong>Modern:</strong> clear, natural English. Sentences are reshaped for
            today&apos;s reader, while names, plot and tone stay put.
          </li>
          <li>
            <strong>Contemporary:</strong> the book told the way a friend might tell it.
            Casual, direct and occasionally cheeky.
          </li>
        </ul>

        <h2>Made once, reviewed, then kept</h2>
        <p>
          Modern versions are generated ahead of time, chapter by chapter, with prompts
          that forbid adding or removing plot, inventing details or commenting on the
          text. Because they are stored, reading is instant and consistent for everyone.
        </p>

        <h2>Live tools, used sparingly</h2>
        <p>
          Select any passage to ask the quill to <strong>rewrite</strong> it in a style of
          your choice, or to <strong>explain</strong> it. These run live, so each reader
          has a small daily allowance.
        </p>

        <h2>What AI can get wrong</h2>
        <p>
          Translation is interpretation. A modern version can flatten a pun, miss a layer
          of irony or choose one meaning where the author left several. If something feels
          off, check the original, and tell us. Versions are labelled as AI-assisted
          everywhere they appear.
        </p>
      </Prose>

      {canDemo && sample && (
        <section className="mt-20 max-w-3xl">
          <p className="eyebrow mb-4">See it for yourself</p>
          <SliderDemo
            source="Alice's Adventures in Wonderland · Lewis Carroll"
            original={sample.original}
            levels={sample.levels}
          />
        </section>
      )}

      <p className="text-muted mt-16 text-sm">
        Ready?{" "}
        <Link href="/explore" className="text-ink underline underline-offset-4">
          Browse the library
        </Link>
        .
      </p>
    </div>
  );
}
