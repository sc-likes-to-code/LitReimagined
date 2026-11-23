import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Prose } from "@/components/ui/Prose";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="container-page pt-[calc(var(--nav-h)+4rem)] pb-8">
      <PageHeader eyebrow="Legal" title="Privacy" />
      <Prose>
        <p>
          We collect as little as we can. This page explains what, and why. It is a
          plain-language summary, not legal advice.
        </p>
        <h2>What we store</h2>
        <ul>
          <li>
            <strong>Account details</strong> if you sign up: your email address and
            display name.
          </li>
          <li>
            <strong>Your reading data</strong>: shelf, place in each book, bookmarks,
            highlights and notes. Without an account this stays in your browser only.
          </li>
          <li>
            <strong>AI usage</strong>: a count of live AI actions per day, to enforce fair
            limits. Passages you send to the quill are processed by Google&apos;s Gemini
            API to produce a reply, and may be cached so other readers get the same answer
            faster.
          </li>
        </ul>
        <h2>What we don&apos;t do</h2>
        <ul>
          <li>We do not sell your data.</li>
          <li>We do not run advertising trackers.</li>
          <li>We do not read your private notes.</li>
        </ul>
        <h2>Your choices</h2>
        <p>
          You can clear your browser storage at any time to remove guest data. To delete
          an account and everything attached to it, contact us and we will remove it.
        </p>
      </Prose>
    </div>
  );
}
