"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "../lib/utils";

/**
 * `input` is the form control: a thumb you are meant to notice and grab.
 *
 * `progress` is a media scrubber, where the bar itself carries the meaning —
 * a hairline track that fills with the accent as the episode plays. Its thumb
 * is a small solid dot rather than the ringed control, which read as a stray
 * white-centred circle sitting in the middle of the bar.
 *
 * A variant rather than a className override at the player, because the two
 * treatments are a design decision the system should own; passing a pile of
 * `[&_[role=slider]]:` selectors down from a feature is how a primitive
 * quietly forks into per-page skins.
 */
type SliderVariant = "input" | "progress";

const TRACK_CLASS: Record<SliderVariant, string> = {
  input: "h-2 bg-secondary",
  // Deliberately `bg-muted`, the lightest neutral: the unplayed remainder is
  // background, and only the played portion should carry colour.
  progress: "h-1.5 bg-muted",
};

const THUMB_CLASS: Record<SliderVariant, string> = {
  input:
    "h-5 w-5 border-2 border-primary bg-background",
  // Small and solid. It stays a real thumb — removing it would take keyboard
  // seeking and the slider role with it — but at this size it reads as the
  // leading edge of the fill instead of a separate control.
  progress: "h-2.5 w-2.5 border-0 bg-primary",
};

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    variant?: SliderVariant;
  }
>(
  (
    {
      className,
      variant = "input",
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref,
  ) => {
    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className,
        )}
        {...props}
      >
        <SliderPrimitive.Track
          className={cn(
            "relative w-full grow overflow-hidden rounded-full",
            TRACK_CLASS[variant],
          )}
        >
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className={cn(
            "block rounded-full ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            THUMB_CLASS[variant],
          )}
        />
      </SliderPrimitive.Root>
    );
  },
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
