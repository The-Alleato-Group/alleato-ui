"use client";

import * as React from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { cn } from "../lib/utils";
import styles from "./premium.module.css";

export type SegmentOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
};
export type SegmentedControlProps = Omit<
  React.ComponentProps<typeof RadioGroup.Root>,
  "children" | "value" | "defaultValue" | "onValueChange"
> & {
  label: string;
  options: readonly SegmentOption[];
  value: string;
  onValueChange: (value: string) => void;
};

/** A form selection, with Radix roving focus and a measured sliding surface. */
export function SegmentedControl({
  label,
  options,
  value,
  onValueChange,
  className,
  ...props
}: SegmentedControlProps) {
  const root = React.useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = React.useState<React.CSSProperties>();
  React.useLayoutEffect(() => {
    const node = root.current;
    if (!node) return;
    const measure = () => {
      const selected = node.querySelector<HTMLElement>(
        '[data-state="checked"]',
      );
      if (!selected) {
        setIndicator(undefined);
        return;
      }
      setIndicator({
        width: selected.offsetWidth,
        height: selected.offsetHeight,
        transform: `translate(${selected.offsetLeft}px, ${selected.offsetTop}px)`,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    for (const child of node.querySelectorAll<HTMLElement>(
      '[data-slot="segment"]',
    ))
      observer.observe(child);
    return () => observer.disconnect();
  }, [value, options]);
  return (
    <RadioGroup.Root
      {...props}
      ref={root}
      aria-label={label}
      orientation="horizontal"
      value={value}
      onValueChange={onValueChange}
      className={cn(
        styles.segments,
        "max-w-full gap-1 overflow-x-auto rounded-2xl bg-muted p-1",
        className,
      )}
    >
      {indicator && (
        <span
          aria-hidden="true"
          className={styles.indicator}
          style={indicator}
        />
      )}
      {options.map((option) => (
        <RadioGroup.Item
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          data-slot="segment"
          className={cn(
            styles.segment,
            styles.control,
            "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring data-[state=checked]:text-foreground disabled:opacity-40 disabled:cursor-not-allowed",
          )}
        >
          {option.icon && (
            <span aria-hidden="true" className="shrink-0 [&>svg]:size-4">
              {option.icon}
            </span>
          )}
          <span>{option.label}</span>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
