import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AccountButton } from "@/components/layout/AccountButton";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { siteConfig } from "@/config/site";

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <nav
        aria-label="Primary"
        className="glass mx-auto flex h-[var(--nav-h)] max-w-6xl items-center justify-between rounded-full pr-3 pl-5 shadow-[0_10px_40px_-18px_rgb(var(--shadow-color)/0.6)]"
      >
        <Link href="/" aria-label="LitReimagined home" className="shrink-0">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {siteConfig.nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-muted hover:text-ink rounded-full px-4 py-2 text-sm transition-colors"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <CommandPalette />
          <ThemeToggle />
          <AccountButton />
        </div>
      </nav>
    </header>
  );
}
