"use client";

import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "../lib/utils";

function Table({
  className,
  stickyHeader = false,
  scrollContainer = "self",
  ...props
}: React.ComponentProps<"table"> & {
  /**
   * Opt in when the table is height-constrained and its <thead> should stay
   * visible while the rows scroll under it. Requires the caller to bound the
   * height (e.g. `[&_[data-slot=table-container]]:h-full` on a flex parent);
   * without a bound there is nothing to scroll and this is a no-op.
   *
   * Opt-in rather than default because 38 files render this table and most grow
   * to their natural height inside the page scroll, where handing the viewport
   * its own vertical scroll would trap them in a nested scrollbar.
   */
  stickyHeader?: boolean;
  /**
   * UnifiedTablePage already owns its horizontal scroll viewport, keyboard
   * focus, and edge affordances. Let it opt out of this standalone wrapper so
   * the rendered table has one scroll owner instead of two nested viewports.
   */
  scrollContainer?: "self" | "parent";
}) {
  const table = (
    <table
      data-slot="table"
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  );

  if (scrollContainer === "parent") return table;

  return (
    <ScrollAreaPrimitive.Root
      data-slot="table-container"
      type="always"
      scrollHideDelay={0}
      className={cn("relative w-full", stickyHeader && "overflow-hidden")}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="table-viewport"
        className={cn(
          "w-full rounded-[inherit] pb-3",
          // Why the vertical scroll must live HERE, on the viewport.
          //
          // `position: sticky` resolves against the nearest SCROLLING ancestor.
          // This ScrollArea declares only a horizontal scrollbar, so Radix sets
          // `overflow-x: scroll; overflow-y: hidden` inline on the viewport --
          // and any non-visible overflow makes it a scroll container. A sticky
          // <thead> therefore sticks to the viewport, which never scrolls
          // vertically, so it sits at the top of the FULL table and slides out
          // of sight with everything else.
          //
          // Putting `overflow-auto` on the Root instead cannot fix it: the
          // viewport is closer to the thead and always wins. The header and the
          // scroll it should follow have to be the same box.
          //
          // `!` is required because Radix's overflow-y is an inline style.
          stickyHeader && "h-full !overflow-y-auto",
        )}
      >
        {table}
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.ScrollAreaScrollbar
        data-slot="table-scrollbar"
        orientation="horizontal"
        className="flex h-3 touch-none select-none bg-muted/30 p-px"
      >
        <ScrollAreaPrimitive.ScrollAreaThumb
          data-slot="table-scrollbar-thumb"
          className="relative flex-1 rounded-full bg-border"
        />
      </ScrollAreaPrimitive.ScrollAreaScrollbar>
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "[&_tr]:border-b [&_tr]:border-border [&_tr]:h-11 [&_tr:hover]:bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b border-border/60 transition-colors",
        className,
      )}
      {...props}
    />
  );
}

// Column headers are sentence case, never all caps or letter-spaced
// (DESIGN.md s3, owner 2026-09-23). A <button> inside a header resets
// text-transform by UA default, which hid an `uppercase` here for every
// header without a context menu.
function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground px-3 pb-2.5 pt-2.5 text-left align-middle text-[10px] font-semibold whitespace-nowrap sm:px-4 [&:has([role=checkbox])]:overflow-visible [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        // Table baseline: keep data dense and scannable with single-line cells.
        // Avoid stacking multiple lines in table cells; use dedicated columns instead.
        "px-3 py-2.5 align-middle text-sm text-foreground/80 whitespace-nowrap max-w-[220px] overflow-hidden text-ellipsis sm:px-4 sm:max-w-[280px] [&:has([role=checkbox])]:max-w-none [&:has([role=checkbox])]:overflow-visible [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
