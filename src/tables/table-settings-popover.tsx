"use client";

import type { ReactElement, ReactNode } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/tooltip";
import { cn } from "../lib/utils";

/**
 * Canonical shell for table view, filter, column, and density settings.
 * Keep the shell here so settings surfaces cannot drift in spacing, border
 * treatment, or popover sizing.
 *
 * Deliberately renders no visible title bar: the popover is opened from a
 * labelled trigger, so a heading repeating that label only costs vertical
 * space. `title` becomes the accessible name instead.
 *
 * Height is driven by content and capped by the viewport, never by a fixed
 * pixel value — `--radix-popover-content-available-height` is the measured
 * space between the popover and the viewport edge.
 */
export function TableSettingsPopover({
  trigger,
  tooltip,
  title = "View settings",
  align = "end",
  open,
  onOpenChange,
  children,
  className,
}: {
  trigger: ReactElement;
  tooltip: string;
  title?: string;
  align?: "start" | "center" | "end";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent
        align={align}
        aria-label={title}
        collisionPadding={12}
        className={cn(
          "flex w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-lg border-border/80 bg-popover p-2 shadow-sm",
          "max-h-[var(--radix-popover-content-available-height)]",
          className,
        )}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
