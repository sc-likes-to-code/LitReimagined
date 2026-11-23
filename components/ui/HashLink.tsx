"use client";

import type { ComponentProps, MouseEvent } from "react";
import { scrollToId } from "@/lib/client/smooth-scroll";

/**
 * A link to a spot on the same page. Next's own link only scrolls when the hash changes,
 * so a second click (after scrolling away) did nothing; this scrolls every time.
 */
export function HashLink({
  href,
  onClick,
  ...props
}: ComponentProps<"a"> & { href: string }) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)
      return;
    if (scrollToId(href.slice(1))) {
      e.preventDefault();
      history.replaceState(history.state, "", href);
    }
  };
  return <a href={href} onClick={handle} {...props} />;
}
