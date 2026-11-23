import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Newsreader } from "next/font/google";
import "./globals.css";
import { SyncProvider } from "@/components/layout/SyncProvider";
import { Cursor } from "@/components/motion/Cursor";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { publicEnv } from "@/lib/env";
import { siteConfig } from "@/config/site";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT", "WONK"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: {
    default: `${siteConfig.name}: ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0E0C14" },
    { media: "(prefers-color-scheme: light)", color: "#F4ECDD" },
  ],
};

// Runs before first paint so the saved theme never flashes. Ink (dark) is the default.
const themeScript = `try{var t=localStorage.getItem('lr-theme');if(t!=='paper'&&t!=='ink'){t='ink'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='ink'}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="ink"
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable} ${newsreader.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="bg-ink text-bg fixed top-3 left-3 z-[200] -translate-y-20 rounded-full px-4 py-2 text-sm focus:translate-y-0"
        >
          Skip to content
        </a>
        <SmoothScroll />
        <SyncProvider />
        <Cursor />
        {children}
      </body>
    </html>
  );
}
