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

/** Scrolls to the very top, through the smooth scroller when there is one. */
export function scrollToTop(immediate = false) {
  if (instance) instance.scrollTo(0, { immediate });
  else window.scrollTo({ top: 0, behavior: immediate ? "auto" : "smooth" });
}

let topPending = false;

/** Remembers that the next page should open at its very top (Next keeps the old scroll position otherwise). */
export function requestTopOnArrival() {
  topPending = true;
}

/** True once after `requestTopOnArrival`. */
export function takePendingTop(): boolean {
  const was = topPending;
  topPending = false;
  return was;
}

let locks = 0;
let saved: { overflow: string; paddingRight: string } | null = null;

/**
 * Freezes the page behind a dialog or menu: no wheel, touch or key scrolling, and no
 * jump when the scrollbar disappears. Returns the function that releases this lock.
 */
export function lockPageScroll(): () => void {
  if (locks++ === 0) {
    const body = document.body;
    saved = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    const bar = window.innerWidth - document.documentElement.clientWidth;
    if (bar > 0) body.style.paddingRight = `${bar}px`;
    body.style.overflow = "hidden";
    instance?.stop();
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--locks === 0 && saved) {
      document.body.style.overflow = saved.overflow;
      document.body.style.paddingRight = saved.paddingRight;
      saved = null;
      instance?.start();
    }
  };
}
