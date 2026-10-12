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

const SIDE_PANEL_WIDTHS = {
  xs: "min(100vw, 18rem)",
  compact: "min(100vw, 24rem)",
  sm: "min(100vw, 28rem)",
  md: "min(100vw, 34rem)",
  lg: "min(100vw, 42rem)",
  xl: "min(100vw, 54rem)",
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
  style,
  "aria-describedby": ariaDescribedBy = undefined,
  ...props
}: React.ComponentProps<typeof SheetContent> & {
  size?: SidePanelSize;
}) {
  return (
    <SheetContent
      className={cn("gap-0 overflow-hidden p-0 md:w-auto lg:w-auto", className)}
      style={{
        ...style,
        width: SIDE_PANEL_WIDTHS[size],
        maxWidth: "100vw",
      }}
      aria-describedby={ariaDescribedBy}
      {...props}
    >
      {/* The inner column provides fallback scrolling for panels without a
          SidePanelBody. With a body, that bounded region owns scrolling while
          the header, footer, and absolute close button remain in view. */}
      <div className="flex h-full min-h-0 flex-col overflow-y-auto">{children}</div>
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
      className={cn("sticky top-0 shrink-0 bg-background/80 px-5 py-4 pr-14 text-left backdrop-blur-md supports-[backdrop-filter]:bg-background/70", className)}
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
    <SheetFooter className={cn("sticky bottom-0 shrink-0 bg-background/80 px-5 py-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/70", className)} {...props} />
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
