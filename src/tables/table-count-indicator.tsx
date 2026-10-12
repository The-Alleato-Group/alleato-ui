import * as React from "react";
import { cn } from "../lib/utils";

interface TableCountIndicatorProps {
  count: number;
  className?: string;
}

export function TableCountIndicator({ count, className }: TableCountIndicatorProps): React.ReactElement | null {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        // Brand accent by owner ruling (DESIGN.md, 2026-09-21): the active
        // filter / grouping / settings count is the one place a table toolbar
        // carries the brand colour. It reads as "something is applied", not as
        // a second primary action.
        "inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold tabular-nums text-primary-foreground",
        className,
      )}
    >
      {count}
    </span>
  );
}
