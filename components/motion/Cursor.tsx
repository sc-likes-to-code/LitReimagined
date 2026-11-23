"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE =
  "a, button, [role='button'], summary, label, select, input, textarea, mark";

/**
 * A soft ember ring that trails the pointer and swells over interactive elements.
 * Additive only: the real cursor is never hidden. Off for touch devices and reduced motion.
 */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ring.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let x = -100;
    let y = -100;
    let rx = x;
    let ry = y;
    let scale = 1;
    let target = 1;
    let raf = 0;
    let visible = false;

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!visible) {
        visible = true;
        rx = x;
        ry = y;
        el.style.opacity = "1";
      }
      target = (e.target as HTMLElement | null)?.closest(INTERACTIVE) ? 1.9 : 1;
    };
    const onLeave = () => {
      visible = false;
      el.style.opacity = "0";
    };
    const tick = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      scale += (target - scale) * 0.2;
      el.style.transform = `translate3d(${rx - 18}px, ${ry - 18}px, 0) scale(${scale})`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ring}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[110] hidden size-9 rounded-full border border-[var(--ember)] opacity-0 mix-blend-normal transition-opacity duration-300 [@media(pointer:fine)]:block"
      style={{
        background: "radial-gradient(circle, rgb(255 90 54 / 0.14), transparent 70%)",
      }}
    />
  );
}
