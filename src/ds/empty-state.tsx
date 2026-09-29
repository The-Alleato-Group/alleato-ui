"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  /** Optional when the surrounding panel already supplies enough context. */
  title?: string;
  description?: string;
  /** Pass any ReactNode — typically a <Button> */
  action?: React.ReactNode;
  className?: string;
  /**
   * Compact states belong inside an existing section or dialog result list.
   * They keep the section's reading flow instead of pretending the whole page
   * is empty.
   */
  density?: "default" | "compact";
  /**
   * Empty states are static by default so the shared primitive stays out of the
   * motion bundle. Opt in only when an entrance animation materially helps the
   * active experience; the animated variant respects reduced-motion settings.
   */
  motion?: "none" | "entrance";
}

const AnimatedEmptyState = React.lazy(() => import("./empty-state-motion"));

export function EmptyStateContent({
  icon,
  title,
  description,
  action,
  className,
  density = "default",
}: Omit<EmptyStateProps, "motion">) {
  return (
    <div
      className={cn(
        "flex flex-col justify-center",
        density === "compact"
          ? "items-start py-4 text-left"
          : "items-center py-16 text-center",
        className,
      )}
    >
      {icon ? (
        // A plain muted icon. No tinted tile, no glow, no brand color: the
        // owner called the orange rounded square "cheap" (2026-09-16), and an
        // empty state is not a place to spend the accent.
        <div className="mb-4 flex items-center justify-center text-muted-foreground [&_svg]:size-6">
          {icon}
        </div>
      ) : null}

      {title ? (
        <p className="text-sm font-medium text-foreground">
          {title}
        </p>
      ) : null}

      {description ? (
        <p
          className={cn(
            "text-[13px] leading-relaxed text-muted-foreground",
            title && "mt-1.5",
            density === "compact" ? "max-w-full" : "max-w-64",
          )}
        >
          {description}
        </p>
      ) : null}

      {action && (
        <div className={cn((title || description) && "mt-4")}>{action}</div>
      )}
    </div>
  );
}

export function EmptyState({ motion = "none", ...props }: EmptyStateProps) {
  if (motion === "none") {
    return <EmptyStateContent {...props} />;
  }

  return (
    <React.Suspense fallback={<EmptyStateContent {...props} />}>
      <AnimatedEmptyState {...props} />
    </React.Suspense>
  );
}
