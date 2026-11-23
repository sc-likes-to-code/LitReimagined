"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Lenis from "lenis";
import {
  scrollToTop,
  setSmoothScroller,
  takePendingTop,
} from "@/lib/client/smooth-scroll";

/** Lenis smooth scrolling on its own animation frame loop. Disabled for reduced motion. */
export function SmoothScroll() {
  const pathname = usePathname();
  // Arriving through the logo means the very top, whatever scroll position Next carried over.
  useEffect(() => {
    if (takePendingTop()) scrollToTop(true);
  }, [pathname]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
    setSmoothScroller(lenis);
    let raf = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      setSmoothScroller(null);
      lenis.destroy();
    };
  }, []);

  return null;
}
