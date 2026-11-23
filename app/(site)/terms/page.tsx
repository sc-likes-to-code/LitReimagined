import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Prose } from "@/components/ui/Prose";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="container-page pt-[calc(var(--nav-h)+4rem)] pb-8">
      <PageHeader eyebrow="Legal" title="Terms of use" />
      <Prose>
        <p>
          By using LitReimagined you agree to the following. It is a plain-language
          summary.
        </p>
        <h2>Content</h2>
        <p>
          Original texts are in the public domain and come from Project Gutenberg. Modern
          versions are AI-assisted adaptations provided for reading and study. They are
          interpretations, not authoritative translations, and may contain errors.
        </p>
        <h2>Fair use of AI features</h2>
        <p>
          Live AI tools have daily limits. Please do not attempt to bypass them, scrape
          the site, or use the tools for anything unlawful or abusive.
        </p>
        <h2>Your content</h2>
        <p>
          Notes and highlights you create belong to you. We store them only to provide the
          service.
        </p>
        <h2>No warranty</h2>
        <p>
          The service is provided as is, and may change or be unavailable from time to
          time.
        </p>
      </Prose>
    </div>
  );
}
