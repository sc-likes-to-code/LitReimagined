import type { Metadata } from "next";
import { Suspense } from "react";
import { SpectaclesDoodle } from "@/components/brand/Doodles";
import { RecommendBox } from "@/components/ai/RecommendBox";
import { ExploreFilters } from "@/components/explore/ExploreFilters";
import { ExploreResults, ResultsSkeleton } from "@/components/explore/ExploreResults";
import { repo } from "@/lib/data";

export const metadata: Metadata = {
  title: "Explore the library",
  description: "Browse classic literature by genre, era, mood and difficulty.",
};

async function Filters() {
  const facets = await repo.getFacets();
  return <ExploreFilters facets={facets} />;
}

export default function ExplorePage({ searchParams }: PageProps<"/explore">) {
  return (
    <div className="container-page relative pt-[calc(var(--nav-h)+4rem)]">
      <SpectaclesDoodle className="absolute top-[calc(var(--nav-h)+3.5rem)] right-6 hidden w-60 lg:block" />
      <header className="mb-14 max-w-2xl">
        <p className="eyebrow mb-4">The library</p>
        <h1 className="font-display text-5xl tracking-tight sm:text-6xl">
          Find your next <em className="text-gradient-ember font-normal">classic.</em>
        </h1>
        <p className="text-muted mt-5 max-w-lg">
          Filter by mood, era or difficulty, or just search for a favourite.
        </p>
      </header>

      <RecommendBox />

      <div className="grid gap-12 lg:grid-cols-[18rem_1fr]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Suspense
            fallback={<div className="bg-surface h-96 animate-pulse rounded-3xl" />}
          >
            <Filters />
          </Suspense>
        </aside>
        <section aria-label="Results">
          <Suspense fallback={<ResultsSkeleton />}>
            <ExploreResults searchParams={searchParams} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
