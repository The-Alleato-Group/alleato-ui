"use client";

import * as React from "react";
import { flushSync } from "react-dom";

/**
 * True for the duration of an actual print (including print-preview in
 * browsers that only fire the media query). A paginated table reads this to
 * render its full filtered+sorted dataset instead of the current page before
 * print captures the DOM, then reverts once printing ends.
 *
 * Chrome/Safari fire `beforeprint`/`afterprint`; Firefox only changes the
 * `print` media query. Listening to both covers every engine. The
 * `beforeprint` transition is forced synchronous with `flushSync` so the
 * expanded rows are already laid out when the browser paginates for print —
 * an async state update would still be mid-render when `window.print()`
 * hands off to the browser's print engine.
 */
export function useIsPrinting(): boolean {
  const [isPrinting, setIsPrinting] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const enterPrint = () => {
      flushSync(() => setIsPrinting(true));
    };
    const exitPrint = () => setIsPrinting(false);

    window.addEventListener("beforeprint", enterPrint);
    window.addEventListener("afterprint", exitPrint);

    const printMediaQuery = window.matchMedia("print");
    const handleMediaChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        enterPrint();
      } else {
        exitPrint();
      }
    };
    printMediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      window.removeEventListener("beforeprint", enterPrint);
      window.removeEventListener("afterprint", exitPrint);
      printMediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  return isPrinting;
}
