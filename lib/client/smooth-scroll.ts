import type Lenis from "lenis";

let instance: Lenis | null = null;

/** The page's smooth-scroll engine, when it is running (it is off for reduced motion). */
export function setSmoothScroller(l: Lenis | null) {
  instance = l;
}

/**
 * Scrolls to the element with this id, honouring its scroll-margin so it clears the nav.
 * Goes through the smooth scroller when there is one, because a native jump would fight it.
 */
export function scrollToId(id: string): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  const offset = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  if (instance) {
    const lenis = instance;
    // Lenis already honours the scroll-margin. Images and fonts can shift the page while it glides; settle on the right spot afterwards.
    const settle = () => {
      if (Math.abs(el.getBoundingClientRect().top - offset) > 2)
        lenis.scrollTo(el, { immediate: true });
    };
    lenis.scrollTo(el, { onComplete: settle });
  } else el.scrollIntoView({ behavior: "auto", block: "start" });
  return true;
}
