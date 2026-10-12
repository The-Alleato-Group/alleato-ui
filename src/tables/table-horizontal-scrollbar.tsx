"use client";

import * as React from "react";

import { cn } from "../lib/utils";

/**
 * Always-visible horizontal scrollbar for the UnifiedTable desktop viewport.
 *
 * Why this exists: the viewport is an `overflow-x-auto` box that grows to the
 * full height of the table, so its native horizontal scrollbar only appears at
 * the bottom of the last row -- below the fold on any table taller than the
 * window -- and on macOS overlay scrollbars it is invisible until the user is
 * already scrolling. Megan hit this on /accounting/reconciliation (2026-09-11):
 * "the table isn't scrolling horizontally properly" meant there was nothing to
 * grab.
 *
 * This control is a proxy: it renders as a `sticky bottom-0` sibling *after*
 * the viewport, so it pins to the bottom of whatever scrolls the page while any
 * part of the table is on screen, and it drives / follows the viewport's
 * `scrollLeft`. The thumb is a plain element rather than a styled native
 * scrollbar so it renders identically on macOS overlay scrollbars, Windows
 * classic scrollbars, and Firefox.
 */

const MIN_THUMB_PX = 40;

interface ViewportGeometry {
  scrollWidth: number;
  clientWidth: number;
  scrollLeft: number;
}

export interface TableHorizontalScrollbarProps {
  /** The element that actually scrolls horizontally. */
  viewportRef: React.RefObject<HTMLDivElement | null>;
  /** `id` of the viewport, for `aria-controls`. */
  controlsId?: string;
  /**
   * Re-measure when this changes. The scrollbar also watches the viewport and
   * its table with a ResizeObserver, but a key lets the parent force a
   * measurement after a column show/hide that does not change the table's
   * bounding box (jsdom has no ResizeObserver at all).
   */
  measureKey?: unknown;
  className?: string;
}

export function computeThumbGeometry(
  geometry: ViewportGeometry,
  trackWidth: number,
): {
  overflows: boolean;
  thumbWidth: number;
  thumbLeft: number;
  travel: number;
} {
  const maxScroll = Math.max(0, geometry.scrollWidth - geometry.clientWidth);
  const overflows = maxScroll > 1 && trackWidth > 0;
  if (!overflows) return { overflows, thumbWidth: 0, thumbLeft: 0, travel: 0 };
  const thumbWidth = Math.min(
    trackWidth,
    Math.max(
      MIN_THUMB_PX,
      Math.round((trackWidth * geometry.clientWidth) / geometry.scrollWidth),
    ),
  );
  const travel = trackWidth - thumbWidth;
  const thumbLeft = Math.round((travel * geometry.scrollLeft) / maxScroll);
  return { overflows, thumbWidth, thumbLeft, travel };
}

export function TableHorizontalScrollbar({
  viewportRef,
  controlsId,
  measureKey,
  className,
}: TableHorizontalScrollbarProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = React.useState<ViewportGeometry | null>(null);
  const [trackWidth, setTrackWidth] = React.useState(0);
  const dragRef = React.useRef<{
    startX: number;
    startScrollLeft: number;
    pxPerTrackPx: number;
  } | null>(null);

  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) {
      setGeometry(null);
      return;
    }

    let raf = 0;
    const measure = () => {
      raf = 0;
      setGeometry({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        scrollLeft: el.scrollLeft,
      });
      if (trackRef.current) setTrackWidth(trackRef.current.clientWidth);
    };
    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(measure);
    };

    measure();
    el.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(schedule);
      observer.observe(el);
      const innerTable = el.querySelector("table");
      if (innerTable) observer.observe(innerTable);
      if (trackRef.current) observer.observe(trackRef.current);
    }

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      el.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
    };
  }, [viewportRef, measureKey]);

  const thumb = geometry
    ? computeThumbGeometry(geometry, trackWidth)
    : { overflows: false, thumbWidth: 0, thumbLeft: 0, travel: 0 };
  const maxScroll = geometry
    ? Math.max(0, geometry.scrollWidth - geometry.clientWidth)
    : 0;

  const handleThumbPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const el = viewportRef.current;
    if (!el || event.button !== 0 || thumb.travel <= 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startX: event.clientX,
      startScrollLeft: el.scrollLeft,
      pxPerTrackPx: maxScroll / thumb.travel,
    };
  };

  const handleThumbPointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const el = viewportRef.current;
    const drag = dragRef.current;
    if (!el || !drag) return;
    el.scrollLeft =
      drag.startScrollLeft + (event.clientX - drag.startX) * drag.pxPerTrackPx;
  };

  const handleThumbPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  // Clicking the track outside the thumb pages one viewport toward the click,
  // the way a native scrollbar track does.
  const handleTrackPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const el = viewportRef.current;
    const track = trackRef.current;
    if (!el || !track || !geometry || event.button !== 0) return;
    const clickX = event.clientX - track.getBoundingClientRect().left;
    const direction = clickX < thumb.thumbLeft ? -1 : 1;
    el.scrollBy({
      left: direction * geometry.clientWidth * 0.9,
      behavior: "smooth",
    });
  };

  return (
    <div
      ref={trackRef}
      data-slot="unified-table-scrollbar"
      role="scrollbar"
      aria-controls={controlsId}
      aria-orientation="horizontal"
      aria-valuemin={0}
      aria-valuemax={maxScroll}
      aria-valuenow={geometry ? Math.round(geometry.scrollLeft) : 0}
      aria-hidden={!thumb.overflows}
      onPointerDown={handleTrackPointerDown}
      className={cn(
        // Pins to the bottom of the page scrollport while any part of the table
        // is on screen; the viewport's own `pb-3` reserves this 12px so nothing
        // shifts when the scrollbar appears.
        "sticky bottom-0 z-20 -mt-3 h-3 touch-none select-none rounded-full bg-muted/40 p-px",
        !thumb.overflows && "invisible",
        className,
      )}
    >
      <div
        data-slot="unified-table-scrollbar-thumb"
        onPointerDown={handleThumbPointerDown}
        onPointerMove={handleThumbPointerMove}
        onPointerUp={handleThumbPointerUp}
        onPointerCancel={handleThumbPointerUp}
        className="h-full cursor-grab rounded-full bg-border transition-colors hover:bg-muted-foreground/40 active:cursor-grabbing"
        style={{
          width: thumb.thumbWidth,
          transform: `translateX(${thumb.thumbLeft}px)`,
        }}
      />
    </div>
  );
}
