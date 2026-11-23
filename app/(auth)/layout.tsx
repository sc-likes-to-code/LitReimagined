import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="grid min-h-dvh flex-1 lg:grid-cols-2">
      {/* art panel */}
      <aside className="relative hidden overflow-hidden lg:block">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 60% at 30% 20%, rgb(255 90 54 / 0.35), transparent), radial-gradient(60% 50% at 80% 90%, rgb(76 201 240 / 0.22), transparent), var(--bg-elev)",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-14">
          <Link href="/" aria-label="LitReimagined home">
            <Logo />
          </Link>
          <figure>
            <blockquote className="font-display max-w-md text-4xl leading-tight italic">
              “I am no bird; and no net ensnares me: I am a free human being with an
              independent will.”
            </blockquote>
            <figcaption className="text-muted mt-5 text-sm">
              Jane Eyre · Charlotte Brontë
            </figcaption>
          </figure>
        </div>
      </aside>

      <div className="flex flex-col items-center justify-center px-6 py-16">
        <Link href="/" aria-label="LitReimagined home" className="mb-12 lg:hidden">
          <Logo />
        </Link>
        {children}
      </div>
    </main>
  );
}
