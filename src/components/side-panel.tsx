"use client";

import * as React from "react";

import { cn } from "../lib/utils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

/**
 * Default width per rung. Owner, 2026-10-12, on the Edit Project sheet: "it
 * makes absolutely zero sense why we have this sheet so narrow ... expand the
 * width of the sheet globally". Every rung moved up together (md was 34rem, a
 * two-column form squeezed into ~544px) so the ladder keeps its proportions.
 * These are only the starting widths: every left/right panel is resizable and
 * keeps the width the reader drags it to (see `useSidePanelWidth`).
 */
const SIDE_PANEL_WIDTHS = {
  xs: "min(100vw, 20rem)",
  compact: "min(100vw, 30rem)",
  sm: "min(100vw, 36rem)",
  md: "min(100vw, 44rem)",
  lg: "min(100vw, 52rem)",
  xl: "min(100vw, 64rem)",
  /**
   * Edge-to-edge. For a panel that is only ever opened on a phone (the table
   * toolbar's mobile filter/sort/columns sheets), where a 28rem drawer would
   * leave a useless sliver of dimmed page behind it.
   *
   * It is a named rung rather than a `w-full max-w-none` at the callsite for
   * the reason the whole ladder exists: four such panels each wrote their own
   * variant of that override, and each then re-picked its own header padding
   * to go with it (px-4 pb-5 pt-2, px-4 py-4 pr-14, px-4 py-4...). Naming the
   * intent lets the panel keep owning the gutters.
   */
  full: "100vw",
} as const;

type SidePanelSize = keyof typeof SIDE_PANEL_WIDTHS;

/** The default CSS width of a rung, for a host that lays the page out beside a
 *  non-modal panel and must reserve the same space. */
function getSidePanelWidth(size: SidePanelSize): string {
  return SIDE_PANEL_WIDTHS[size];
}

/** Narrowest a reader can drag a panel; below this a two-column form breaks. */
const SIDE_PANEL_MIN_WIDTH_PX = 320;
/** Page strip kept visible beside a dragged-wide panel, so a click outside it
 *  (which closes the panel) always has somewhere to land. */
const SIDE_PANEL_PAGE_GUTTER_PX = 48;
const SIDE_PANEL_KEYBOARD_STEP_PX = 32;
const SIDE_PANEL_WIDTH_STORAGE_PREFIX = "alleato-ui.side-panel-width.";

function clampSidePanelWidth(width: number): number {
  const maxWidth = Math.max(
    SIDE_PANEL_MIN_WIDTH_PX,
    window.innerWidth - SIDE_PANEL_PAGE_GUTTER_PX,
  );
  return Math.round(
    Math.min(maxWidth, Math.max(SIDE_PANEL_MIN_WIDTH_PX, width)),
  );
}

/**
 * localStorage is a per-viewer convenience here: when it is unavailable
 * (private window, blocked site data) the panel opens at its rung's default
 * width, which is the correct behavior, so there is nothing to report.
 */
function readStoredSidePanelWidth(storageKey: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(
      SIDE_PANEL_WIDTH_STORAGE_PREFIX + storageKey,
    );
    const width = raw === null ? Number.NaN : Number(raw);
    return Number.isFinite(width) && width > 0 ? width : null;
  } catch {
    return null;
  }
}

function writeStoredSidePanelWidth(storageKey: string, width: number | null) {
  try {
    const key = SIDE_PANEL_WIDTH_STORAGE_PREFIX + storageKey;
    if (width === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, String(width));
  } catch {
    // See readStoredSidePanelWidth: the width simply is not remembered.
  }
}

/**
 * Drag-to-resize from the panel's inner edge (DESIGN.md: every side panel
 * resizes from its inner edge and keeps its width). Pointer capture keeps the
 * drag alive when the pointer leaves the 12px strip, and because the pointer
 * never "goes down" outside the panel, a drag can never close it.
 *
 * Double-click restores the rung's default; arrow keys nudge for keyboard use.
 */
function useSidePanelWidth(storageKey: string, side: "left" | "right") {
  const [width, setWidth] = React.useState<number | null>(() =>
    readStoredSidePanelWidth(storageKey),
  );
  const dragRef = React.useRef<{ startX: number; startWidth: number } | null>(
    null,
  );
  const widthRef = React.useRef(width);
  widthRef.current = width;

  const panelWidthOf = (handle: HTMLElement) =>
    handle.parentElement?.getBoundingClientRect().width ??
    SIDE_PANEL_MIN_WIDTH_PX;

  const commit = React.useCallback(
    (next: number | null) => {
      setWidth(next);
      writeStoredSidePanelWidth(storageKey, next);
    },
    [storageKey],
  );

  const handleProps: React.ComponentProps<"div"> = {
    onPointerDown: (event) => {
      if (event.button !== 0) return;
      // Stops the pointerdown from starting a text selection under the drag.
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        startX: event.clientX,
        startWidth: panelWidthOf(event.currentTarget),
      };
    },
    onPointerMove: (event) => {
      const drag = dragRef.current;
      if (!drag) return;
      const delta =
        side === "right"
          ? drag.startX - event.clientX
          : event.clientX - drag.startX;
      setWidth(clampSidePanelWidth(drag.startWidth + delta));
    },
    onPointerUp: (event) => {
      if (!dragRef.current) return;
      dragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
      commit(widthRef.current);
    },
    onDoubleClick: () => commit(null),
    onKeyDown: (event) => {
      const grow = side === "right" ? "ArrowLeft" : "ArrowRight";
      const shrink = side === "right" ? "ArrowRight" : "ArrowLeft";
      if (event.key !== grow && event.key !== shrink) return;
      event.preventDefault();
      const current = widthRef.current ?? panelWidthOf(event.currentTarget);
      const step =
        event.key === grow
          ? SIDE_PANEL_KEYBOARD_STEP_PX
          : -SIDE_PANEL_KEYBOARD_STEP_PX;
      commit(clampSidePanelWidth(current + step));
    },
  };

  return { width, handleProps };
}

/**
 * Body gutter treatment.
 *
 * `standard` is the panel's own gutter and aligns the body with the header.
 * `flush` is for a body whose rows draw their own full-bleed hit areas
 * (notification lists, message threads) — the rows own the horizontal inset.
 *
 * These are the ONLY two options on purpose. A callsite that needs "slightly
 * less padding" is a callsite that will disagree with every other panel in the
 * app, which is exactly how this drifted before (nine panels, six different
 * gutters). Enforced by ESLint `design-system/no-side-panel-padding-override`.
 */
type SidePanelBodyLayout = "standard" | "flush";

function SidePanel({ ...props }: React.ComponentProps<typeof Sheet>) {
  return <Sheet {...props} />;
}

function SidePanelContent({
  className,
  children,
  size = "sm",
  resizable = true,
  widthKey,
  style,
  "aria-describedby": ariaDescribedBy = undefined,
  ...props
}: React.ComponentProps<typeof SheetContent> & {
  size?: SidePanelSize;
  /** Drag the inner edge to resize. On for every left/right panel; turn it off
   *  only where the host reserves the panel's width in its own layout. */
  resizable?: boolean;
  /** Which remembered width this panel shares. Defaults to its size rung, so
   *  widening one form sheet widens every form sheet of that size. */
  widthKey?: string;
}) {
  const side = props.side ?? "right";
  const canResize =
    resizable && size !== "full" && (side === "right" || side === "left");
  const { width, handleProps } = useSidePanelWidth(
    widthKey ?? size,
    side === "left" ? "left" : "right",
  );
  const resizedWidth = canResize && width !== null ? width : null;

  return (
    <SheetContent
      className={cn("gap-0 overflow-hidden p-0 md:w-auto lg:w-auto", className)}
      style={{
        ...style,
        width:
          resizedWidth !== null
            ? `min(100vw, ${resizedWidth}px)`
            : SIDE_PANEL_WIDTHS[size],
        maxWidth: "100vw",
      }}
      aria-describedby={ariaDescribedBy}
      {...props}
    >
      {/* The inner column provides fallback scrolling for panels without a
          SidePanelBody. With a body, that bounded region owns scrolling while
          the header, footer, and absolute close button remain in view. */}
      <div className="flex h-full min-h-0 flex-col overflow-y-auto">
        {children}
      </div>
      {canResize ? (
        // Below `sm` every rung is already the full viewport width, so there
        // is nothing to drag against. It comes AFTER the content on purpose:
        // the dialog focuses its first tabbable element on open, and a handle
        // placed first took that focus (drawing its focus line and skipping
        // the first field). It is absolutely positioned, so order is free.
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panel"
          aria-valuemin={SIDE_PANEL_MIN_WIDTH_PX}
          aria-valuenow={resizedWidth ?? undefined}
          tabIndex={0}
          data-side-panel-resizer=""
          className={cn(
            "group absolute inset-y-0 z-20 hidden w-3 cursor-col-resize touch-none select-none outline-none sm:block",
            side === "left" ? "right-0" : "left-0",
          )}
          {...handleProps}
        >
          <div
            className={cn(
              "absolute inset-y-0 w-0.5 transition-colors group-hover:bg-primary group-focus-visible:bg-primary",
              side === "left" ? "right-0" : "left-0",
            )}
          />
        </div>
      ) : null}
    </SheetContent>
  );
}

/**
 * `pr-14` is the close button's clearance, not decoration: SheetContent renders
 * its X at `top-4 right-4`, so every panel header needs the same reserved
 * gutter. The sticky header uses natural stacking so the later Sheet close
 * button remains above it and receives pointer events.
 * It lives here so no callsite has to rediscover it (one did, as
 * `pr-12`, and got a different answer).
 */
function SidePanelHeader({
  className,
  ...props
}: React.ComponentProps<typeof SheetHeader>) {
  return (
    <SheetHeader
      className={cn(
        "sticky top-0 shrink-0 bg-background/80 px-5 py-4 pr-14 text-left backdrop-blur-md supports-[backdrop-filter]:bg-background/70",
        className,
      )}
      {...props}
    />
  );
}

function SidePanelTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetTitle>) {
  return (
    <SheetTitle
      className={cn("text-base font-semibold leading-snug", className)}
      {...props}
    />
  );
}

function SidePanelBody({
  className,
  layout = "standard",
  ...props
}: React.ComponentProps<"div"> & { layout?: SidePanelBodyLayout }) {
  return (
    <div
      className={cn(
        // The body owns overflow when form content is taller than the viewport.
        // Otherwise its flex size shrinks while fields spill beneath the footer,
        // leaving the outer panel with no scroll range.
        "min-h-0 flex-1 overflow-y-auto",
        layout === "standard" && "px-5 py-5",
        className,
      )}
      {...props}
    />
  );
}

function SidePanelFooter({
  className,
  ...props
}: React.ComponentProps<typeof SheetFooter>) {
  return (
    <SheetFooter
      className={cn(
        "sticky bottom-0 shrink-0 bg-background/80 px-5 py-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/70",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Trigger/Close/Description carry no panel chrome, so they are plain
 * re-exports rather than wrappers. They exist here so a panel file can import
 * everything it needs from this module and never reach for "./sheet"
 * — which is how a file ends up with SheetContent in scope and a raw panel one
 * keystroke away.
 */
const SidePanelTrigger = SheetTrigger;
const SidePanelClose = SheetClose;
const SidePanelDescription = SheetDescription;

export {
  getSidePanelWidth,
  SidePanel,
  SidePanelBody,
  SidePanelClose,
  SidePanelContent,
  SidePanelDescription,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
  SidePanelTrigger,
};
export type { SidePanelBodyLayout, SidePanelSize };
