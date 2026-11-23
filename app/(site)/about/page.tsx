import type { Metadata } from "next";
import Link from "next/link";
import { InkwellDoodle } from "@/components/brand/Doodles";
import { PageHeader } from "@/components/ui/PageHeader";
import { Prose } from "@/components/ui/Prose";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
  description: "Why LitReimagined exists.",
};

export default function AboutPage() {
  return (
    <div className="container-page relative pt-[calc(var(--nav-h)+4rem)] pb-8">
      <InkwellDoodle className="absolute top-[calc(var(--nav-h)+3rem)] right-6 hidden w-36 lg:block" />
      <PageHeader
        eyebrow="About"
        title={
          <>
            Old books, <em className="text-gradient-ember font-normal">new doors.</em>
          </>
        }
      >
        {siteConfig.tagline}
      </PageHeader>
      <Prose>
        <p>
          The classics are classics for a reason. They are funny, strange, furious and
          tender. But the language of 1813 or 1851 can feel like a locked door, and plenty
          of readers give up on page three.
        </p>
        <p>
          LitReimagined exists to open that door without taking the original away. You
          choose how modern the voice should be, you can always see the author&apos;s own
          words, and you get the tools of a good teacher: a glossary, a patient
          explanation, a place to keep your notes.
        </p>
        <h2>Built with care</h2>
        <p>
          This is an independent project made by one person who loves books and software.
          It is still growing, and the library will keep expanding. If you have a book you
          would love to see, or you spot something that reads wrong, we want to hear about
          it.
        </p>
        <p>
          <Link href="/how-it-works">Read how the modernization works →</Link>
        </p>
      </Prose>
    </div>
  );
}
