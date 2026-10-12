"use client";

import * as React from "react";

import { Button, type ButtonProps } from "../components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/tooltip";
import { cn } from "../lib/utils";

/**
 * Shared boundary for icon-only actions that sit on a table header or toolbar.
 *
 * The border remains transparent at rest so controls stay quiet without
 * changing size, then becomes visible on hover. The surface stays transparent
 * to preserve the app-wide icon-button rule that forbids a hover fill.
 */
export const tableIconButtonClassName =
  "border border-transparent bg-transparent shadow-none hover:border-border hover:bg-transparent active:bg-transparent dark:hover:bg-transparent";

export type TableIconButtonProps = Omit<ButtonProps, "variant">;

export const TableIconButton = React.forwardRef<
  HTMLButtonElement,
  TableIconButtonProps
>(function TableIconButton({ className, size = "icon", ...props }, ref) {
  return (
    <Button
      ref={ref}
      variant="ghost"
      size={size}
      className={cn(tableIconButtonClassName, className)}
      {...props}
    />
  );
});

export interface TableIconActionProps extends TableIconButtonProps {
  label: string;
}

/**
 * Accessible table-toolbar icon action with the canonical hover boundary and
 * tooltip. Use this instead of pairing a labeled outline button with the
 * table's icon-only search, filter, settings, and export controls.
 */
export const TableIconAction = React.forwardRef<
  HTMLButtonElement,
  TableIconActionProps
>(function TableIconAction({ label, className, children, ...props }, ref) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <TableIconButton
            ref={ref}
            className={cn("h-8 w-8 shrink-0", className)}
            aria-label={label}
            {...props}
          >
            {children}
          </TableIconButton>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
