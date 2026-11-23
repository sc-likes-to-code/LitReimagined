import type { MetadataRoute } from "next";
import { repo } from "@/lib/data";
import { publicEnv } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.siteUrl;
  const [books, authors, collections] = await Promise.all([
    repo.listBooks(),
    repo.listAuthors(),
    repo.listCollections(),
  ]);

  const fixed = [
    "",
    "/explore",
    "/authors",
    "/collections",
    "/how-it-works",
    "/about",
    "/privacy",
    "/terms",
  ];
  return [
    ...fixed.map((p) => ({
      url: `${base}${p}`,
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : 0.6,
    })),
    ...books.map((b) => ({
      url: `${base}/books/${b.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...authors.map((a) => ({
      url: `${base}/authors/${a.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...collections.map((c) => ({
      url: `${base}/collections/${c.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
