"use client";

import type * as React from "react";
import { cn } from "../lib/utils";
import styles from "./premium.module.css";

export type MotionRevealProps = React.ComponentProps<"div"> & {
  index?: number;
};

/** Mount reveal with a bounded stagger. Change the React key to replay. */
export function MotionReveal({
  index = 0,
  style,
  className,
  ...props
}: MotionRevealProps) {
  return (
    <div
      {...props}
      className={cn(styles.reveal, className)}
      style={
        {
          "--motion-index": Math.max(0, Math.min(6, index)),
          ...style,
        } as React.CSSProperties
      }
    />
  );
}
