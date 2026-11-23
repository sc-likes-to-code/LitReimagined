import type { Metadata } from "next";
import { LibraryView } from "@/components/library/LibraryView";
import { repo } from "@/lib/data";

export const metadata: Metadata = {
  title: "Your library",
  robots: { index: false },
};

export default async function LibraryPage() {
  const books = await repo.listBooks({ sort: "title" });
  return <LibraryView books={books} />;
}
