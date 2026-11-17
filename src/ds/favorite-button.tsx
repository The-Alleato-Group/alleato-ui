"use client";

import type * as React from "react";
import { Heart } from "lucide-react";
import { cn } from "../lib/utils";
import styles from "./premium.module.css";

export type FavoriteButtonProps = Omit<
  React.ComponentProps<"button">,
  "children" | "onClick" | "aria-pressed"
> & {
  label: string;
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
};

export function FavoriteButton({
  label,
  pressed,
  onPressedChange,
  className,
  ...props
}: FavoriteButtonProps) {
  return (
    <button
      {...props}
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        styles.control,
        styles.favorite,
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      <Heart aria-hidden="true" className="size-5" />
    </button>
  );
}
