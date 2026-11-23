import Link from "next/link";
import {
  CandleDoodle,
  FernDoodle,
  InkwellDoodle,
  KidReadingDoodle,
  MothDoodle,
  OpenBookDoodle,
  OrbitDoodle,
  QuillDoodle,
  SpectaclesDoodle,
  SprigDoodle,
  StarsDoodle,
  TypewriterDoodle,
} from "@/components/brand/Doodles";
import { HeroCovers } from "@/components/home/HeroCovers";
import { Shelf } from "@/components/home/Shelf";
import { SliderDemo } from "@/components/home/SliderDemo";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink, buttonClasses } from "@/components/ui/Button";
import { HashLink } from "@/components/ui/HashLink";
import { demoContent } from "@/data/demo/content";
import { repo } from "@/lib/data";

const STEPS = [
  {
    n: "01",
    title: "Pick a classic",
    body: "Browse hand-chosen books by mood, era and difficulty, from a weekend read to a long winter project.",
  },
  {
    n: "02",
    title: "Set the voice",
    body: "Slide from the author's own words to a light polish, a modern retelling or a fully contemporary voice. You decide how far.",
  },
  {
    n: "03",
    title: "Read, ask, keep",
    body: "Read the modern text beside the original, tap any old word, ask the quill to explain a line, and keep your highlights.",
  },
];

const FEATURES = [
  {
    title: "Side by side",
    body: "The original is never hidden. Read both, paragraph for paragraph.",
  },
  {
    title: "Tap any old word",
    body: "Archaic terms are underlined. Tap one for its meaning in plain English.",
  },
  {
    title: "Ask the quill",
    body: "Rewrite a passage in your own style or get a line explained, in seconds.",
  },
  {
    title: "Yours to keep",
    body: "Highlights, notes, bookmarks and your place, saved to your shelf.",
  },
];

export default async function Home() {
  const [featured, all, collections] = await Promise.all([
    repo.listBooks({ sort: "featured" }),
    repo.listBooks({ sort: "title" }),
    repo.listCollections(),
  ]);
  // The homepage showcase is a hand-written three-level passage, so it never depends on the database.
  const sample = demoContent["pride-and-prejudice"];

  const heroBooks = featured.slice(0, 5);
  const shorts = collections.find((c) => c.slug === "short-and-brilliant");
  const gothic = collections.find((c) => c.slug === "dark-and-gothic");
  const canDemo = Boolean(sample);

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden pt-[calc(var(--nav-h)+5rem)] pb-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[38rem] w-[60rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgb(255 90 54 / 0.35), rgb(76 201 240 / 0.12) 55%, transparent)",
          }}
        />
        <QuillDoodle
          className="absolute top-40 left-[4%] hidden w-28 -rotate-12 xl:block"
          delay={0.3}
        />
        <KidReadingDoodle
          className="absolute top-[17.5rem] left-[8%] hidden w-64 xl:block"
          delay={0.5}
        />
        <OrbitDoodle
          className="absolute top-52 right-[5%] hidden w-32 xl:block"
          delay={0.5}
        />
        <StarsDoodle
          className="absolute top-28 right-[19%] hidden w-36 2xl:block"
          delay={0.7}
        />
        <div className="container-page text-center">
          <p className="eyebrow mb-8">Classic literature · Modern voice</p>
          <h1 className="font-display mx-auto max-w-5xl text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.95] tracking-tight">
            Classics,
            <br />
            <em className="text-gradient-ember font-normal">reimagined.</em>
          </h1>
          <p className="text-muted mx-auto mt-8 max-w-xl text-lg leading-relaxed">
            Read the great books in language that speaks to you today, side by side with
            the original. Slide from the author&apos;s own words to a fresh, modern voice.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/explore" size="lg">
              Start reading
            </ButtonLink>
            <HashLink
              href="#try-it"
              className={buttonClasses({ variant: "secondary", size: "lg" })}
            >
              Try the slider
            </HashLink>
          </div>
        </div>
        <div className="mt-16 sm:mt-20">
          <HeroCovers books={heroBooks} />
        </div>
      </section>

      {/* SLIDER DEMO */}
      {canDemo && sample && (
        <section id="try-it" className="container-page relative scroll-mt-28 py-24">
          <TypewriterDoodle className="absolute -bottom-2 left-[2%] hidden w-44 xl:block" />
          <OpenBookDoodle className="absolute -top-10 right-[2%] hidden w-44 xl:block" />
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <Reveal>
              <p className="eyebrow mb-4">The signature feature</p>
              <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
                One book, <em className="font-normal italic">four voices.</em>
              </h2>
              <p className="text-muted mt-5 max-w-md leading-relaxed">
                Drag the slider and watch a famous opening line travel from 1813 to today.
                Every chapter in every book works this way, and the original is always one
                tap away.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <SliderDemo
                source="Pride and Prejudice · Jane Austen"
                original={sample.original}
                levels={sample.levels}
              />
            </Reveal>
          </div>
        </section>
      )}

      {/* FEATURED */}
      <div className="py-16">
        <SprigDoodle className="mx-auto mb-6 w-56" />
        <Shelf
          eyebrow="Start here"
          title="Today's reimaginings"
          description="Our most-loved classics, ready to read in your voice."
          books={featured.filter((b) => b.featured).slice(0, 5)}
          href="/explore"
          linkLabel="Explore the library"
        />
      </div>

      {/* HOW IT WORKS */}
      <section className="border-line relative overflow-hidden border-y py-24">
        <FernDoodle className="absolute top-8 right-[4%] hidden h-72 xl:block" />
        <CandleDoodle className="absolute bottom-6 left-[3%] hidden h-48 xl:block" />
        <div className="container-page">
          <Reveal className="mb-14 max-w-xl">
            <p className="eyebrow mb-4">How it works</p>
            <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
              Three steps to a <em className="font-normal italic">better</em> classic.
            </h2>
          </Reveal>
          <ol className="grid gap-10 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 0.1}>
                <span className="font-display text-gradient-ember text-6xl italic">
                  {s.n}
                </span>
                <h3 className="font-display mt-4 text-2xl">{s.title}</h3>
                <p className="text-muted mt-3 leading-relaxed">{s.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* SHORT & BRILLIANT */}
      {shorts && (
        <div className="py-24">
          <Shelf
            eyebrow="Collection"
            title={shorts.title}
            description={shorts.description}
            books={shorts.books}
            href={`/collections/${shorts.slug}`}
            linkLabel="Open collection"
          />
        </div>
      )}

      {/* FEATURES */}
      <section className="container-page pb-24">
        <SpectaclesDoodle className="mx-auto mb-10 w-40" />
        <ul className="grid gap-px overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <li key={f.title} className="bg-bg-elev p-8">
              <h3 className="font-display text-xl">{f.title}</h3>
              <p className="text-muted mt-3 text-sm leading-relaxed">{f.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* DARK & GOTHIC */}
      {gothic && (
        <div className="pb-24">
          <Shelf
            eyebrow="Collection"
            title={gothic.title}
            description={gothic.description}
            books={gothic.books}
            href={`/collections/${gothic.slug}`}
            linkLabel="Open collection"
          />
        </div>
      )}

      {/* CTA */}
      <section className="container-page">
        <Reveal className="relative isolate overflow-hidden rounded-[2.5rem] border border-[var(--line)] px-6 py-20 text-center sm:px-16">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-60"
            style={{
              background:
                "radial-gradient(60% 80% at 50% 0%, rgb(255 90 54 / 0.28), transparent), radial-gradient(40% 60% at 90% 100%, rgb(76 201 240 / 0.16), transparent)",
            }}
          />
          <MothDoodle className="absolute top-8 right-10 hidden w-24 lg:block" />
          <InkwellDoodle className="absolute bottom-6 left-10 hidden w-24 lg:block" />
          <h2 className="font-display mx-auto max-w-2xl text-4xl tracking-tight sm:text-6xl">
            {all.length} classics are waiting.{" "}
            <em className="text-gradient-ember font-normal">Begin one tonight.</em>
          </h2>
          <p className="text-muted mx-auto mt-5 max-w-md">
            Free to read. Create an account to keep your place, highlights and notes.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/explore" size="lg">
              Browse the library
            </ButtonLink>
            <ButtonLink href="/signup" variant="secondary" size="lg">
              Create an account
            </ButtonLink>
          </div>
          <p className="text-faint mt-6 text-xs">
            Already a reader?{" "}
            <Link href="/login" className="hover:text-ink underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </Reveal>
      </section>
    </>
  );
}
