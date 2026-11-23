import Link from "next/link";
import { SprigDoodle } from "@/components/brand/Doodles";
import { Logo } from "@/components/brand/Logo";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="border-line mt-32 border-t">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="text-muted mt-5 text-sm leading-relaxed">{siteConfig.tagline}</p>
          <p className="text-faint mt-6 text-xs leading-relaxed">
            Original texts are public domain, courtesy of Project Gutenberg. Modern
            versions are AI-assisted and clearly labelled.
          </p>
        </div>
        <div>
          <p className="eyebrow mb-4">Explore</p>
          <ul className="text-muted space-y-2.5 text-sm">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-ink transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4">Company</p>
          <ul className="text-muted space-y-2.5 text-sm">
            <li>
              <Link href="/about" className="hover:text-ink transition-colors">
                About
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-ink transition-colors">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-ink transition-colors">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-line border-t">
        <div className="container-page flex items-center justify-between gap-4 py-6">
          <p className="text-faint text-xs">© LitReimagined. Made for readers.</p>
          <SprigDoodle className="w-24 shrink-0" />
        </div>
      </div>
    </footer>
  );
}
