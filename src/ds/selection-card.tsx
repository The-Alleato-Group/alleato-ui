"use client";

import type * as React from "react";
import { Check } from "lucide-react";
import { cn } from "../lib/utils";
import styles from "./premium.module.css";

export type SelectionCardProps = Omit<
  React.ComponentProps<"button">,
  "children" | "onClick" | "aria-pressed"
> & {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
};

export function SelectionCard({
  label,
  description,
  icon,
  selected,
  onSelectedChange,
  className,
  ...props
}: SelectionCardProps) {
  return (
    <button
      {...props}
      type="button"
      aria-pressed={selected}
      data-selected={selected}
      onClick={() => onSelectedChange(!selected)}
      className={cn(
        styles.control,
        styles.choice,
        "relative flex min-h-28 min-w-0 flex-col items-start gap-3 rounded-xl border border-input bg-background p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      {icon && (
        <span
          aria-hidden="true"
          className={cn(styles.choiceIcon, "[&>svg]:size-6")}
        >
          {icon}
        </span>
      )}
      <span className="grid gap-1 pr-5">
        <span className="text-sm font-semibold">{label}</span>
        {description && (
          <span className="text-sm text-muted-foreground">{description}</span>
        )}
      </span>
      {selected && (
        <Check aria-hidden="true" className="absolute right-3 top-3 size-4" />
      )}
    </button>
  );
}
