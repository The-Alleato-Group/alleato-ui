"use client";

import * as React from "react";

const phoneQuery = "(max-width: 767px)";

/** One opening policy for sheets, side panels, phone dialogs and drawers. */
export function useSheetOpening(onOpenAutoFocus?: (event: Event) => void, forwardedRef?: React.Ref<HTMLDivElement>) {
  const [content, setContent] = React.useState<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const handled = React.useRef(false);
  const onOpenRef = React.useRef(onOpenAutoFocus);
  onOpenRef.current = onOpenAutoFocus;
  const ref = React.useCallback((node: HTMLDivElement | null) => {
    contentRef.current = node;
    setContent(node);
    const cleanup = typeof forwardedRef === "function" ? forwardedRef(node) : undefined;
    if (forwardedRef && typeof forwardedRef !== "function") forwardedRef.current = node;
    return () => {
      contentRef.current = null;
      setContent(null);
      if (typeof cleanup === "function") cleanup();
      else if (typeof forwardedRef === "function") forwardedRef(null);
      else if (forwardedRef) forwardedRef.current = null;
    };
  }, [forwardedRef]);

  React.useEffect(() => {
    if (!content) return;
    const viewport = window.visualViewport;
    const media = window.matchMedia(phoneQuery);
    const update = () => {
      if (!media.matches) {
        content.style.removeProperty("--sheet-viewport-height");
        content.style.removeProperty("--sheet-viewport-bottom");
        content.style.removeProperty("--sheet-viewport-top");
        return;
      }
      // iOS keyboards shrink the visual viewport without resizing 100vh.
      // Keep the scroll region above the keyboard instead of panning the form.
      const height = viewport?.height ?? window.innerHeight;
      const bottom = Math.max(0, window.innerHeight - height - (viewport?.offsetTop ?? 0));
      content.style.setProperty("--sheet-viewport-height", `${height}px`);
      content.style.setProperty("--sheet-viewport-bottom", `${bottom}px`);
      content.style.setProperty("--sheet-viewport-top", `${viewport?.offsetTop ?? 0}px`);
    };
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [content]);

  const handleOpenAutoFocus = React.useCallback((event: Event) => {
    const content = contentRef.current;
    if (!content) return;
    if (handled.current) {
      if (window.matchMedia(phoneQuery).matches) event.preventDefault();
      return;
    }
    handled.current = true;
    // Include nested bodies/ScrollAreas and force-mounted sheets on every open.
    content.scrollTop = 0;
    content.scrollLeft = 0;
    for (const element of content.querySelectorAll<HTMLElement>("*")) {
      if (element.scrollTop) element.scrollTop = 0;
      if (element.scrollLeft) element.scrollLeft = 0;
    }
    onOpenRef.current?.(event);
    if (!event.defaultPrevented && window.matchMedia(phoneQuery).matches) {
      event.preventDefault();
      // Accessible dialog focus, without input autofocus/keyboard/scroll jump.
      content.focus({ preventScroll: true });
    }
  }, []);

  React.useLayoutEffect(() => {
    if (!content) return;
    const open = () => {
      if (content.dataset.state === "closed") {
        handled.current = false;
        return;
      }
      // React autoFocus runs before Radix's FocusScope. When a child already
      // has focus, FocusScope skips its opening callback altogether. Normalize
      // that path too, including retained content reopened after a close.
      if (!handled.current && window.matchMedia(phoneQuery).matches) {
        // Dispatch on the content, like FocusScope, preserving the callback's
        // event type/target/currentTarget as well as cancellation semantics.
        const event = new CustomEvent("focusScope.autoFocusOnMount", { cancelable: true });
        content.addEventListener(event.type, handleOpenAutoFocus, { once: true });
        content.dispatchEvent(event);
      }
    };
    open();
    const observer = new MutationObserver(open);
    observer.observe(content, { attributes: true, attributeFilter: ["data-state"] });
    return () => { observer.disconnect(); handled.current = false; };
  }, [content, handleOpenAutoFocus]);

  return { ref, onOpenAutoFocus: handleOpenAutoFocus };
}

export const phoneSheetViewport = "max-md:max-h-[calc(var(--sheet-viewport-height,100dvh)-max(1rem,env(safe-area-inset-top)))] max-md:bottom-[var(--sheet-viewport-bottom,0px)]";
