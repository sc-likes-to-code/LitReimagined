"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { requestTopOnArrival, scrollToTop } from "@/lib/client/smooth-scroll";

/**
 * A link to the home page that always lands on its very top: it glides up when
 * you are already home, and opens the page at the top when you come from elsewhere.
 */
export function HomeLink({
  onClick,
  ...props
}: Omit<ComponentProps<typeof Link>, "href">) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)
      return;
    if (window.location.pathname === "/") {
      e.preventDefault();
      if (window.location.hash || window.location.search)
        history.replaceState(history.state, "", "/");
      scrollToTop();
    } else requestTopOnArrival();
  };
  return <Link href="/" onClick={handle} {...props} />;
}
