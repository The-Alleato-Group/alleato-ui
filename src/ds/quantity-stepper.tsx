"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "../components/button";
import { cn } from "../lib/utils";
import styles from "./premium.module.css";

export type QuantityStepperProps = Omit<
  React.ComponentProps<"div">,
  "onChange"
> & {
  label: string;
  description?: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
};

/** Integer quantities; the host owns value and any persistence. */
export function QuantityStepper({
  label,
  description,
  value,
  onValueChange,
  min = 0,
  max = 99,
  disabled = false,
  className,
  ...props
}: QuantityStepperProps) {
  const id = React.useId();
  return (
    <div
      {...props}
      role="group"
      aria-labelledby={`${id}-label`}
      className={cn("flex items-center justify-between gap-4", className)}
    >
      <div className="grid min-w-0 gap-1">
        <span id={`${id}-label`} className="text-sm font-medium">
          {label}
        </span>
        {description && (
          <span className="text-sm text-muted-foreground">{description}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className={cn(styles.control, "size-11 rounded-full p-0")}
          aria-label={`Decrease ${label}`}
          disabled={disabled || value <= min}
          onClick={() => onValueChange(Math.max(min, value - 1))}
        >
          <Minus aria-hidden="true" />
        </Button>
        <output
          aria-live="polite"
          aria-atomic="true"
          aria-label={label}
          className="w-8 text-center text-sm tabular-nums"
        >
          <span key={value} className={cn(styles.count, "inline-block")}>
            {value}
          </span>
        </output>
        <Button
          type="button"
          variant="outline"
          className={cn(styles.control, "size-11 rounded-full p-0")}
          aria-label={`Increase ${label}`}
          disabled={disabled || value >= max}
          onClick={() => onValueChange(Math.min(max, value + 1))}
        >
          <Plus aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
