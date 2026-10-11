"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { useWorkspaceOwnsGutter } from "./workspace-gutter-context";

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: boolean;
  paddingClassName?: string;
}

const maxWidthClasses = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
};

export function PageContainer({
  children,
  className,
  maxWidth = "full",
  padding = true,
  paddingClassName,
}: PageContainerProps) {
  // A workspace shell (Executive, AI) already puts a gutter between its nav rail
  // and the page. Paying for it again here is what pushed page content 64-104px
  // clear of the rail, so the shell wins and this container goes flush.
  //
  // Every breakpoint is listed on purpose. `cn` is tailwind-merge, and it only
  // resolves a conflict inside a single variant scope: a bare `px-0` drops
  // `px-4` but leaves `sm:px-6` and `lg:px-8` standing, which is exactly the
  // half-fix that still measured a 64px gap at 1280px.
  const workspaceOwnsGutter = useWorkspaceOwnsGutter();
  const flushGutter =
    "px-0 sm:px-0 md:px-0 lg:px-0 xl:px-0 2xl:px-0";

  return (
    <div
      className={cn(
        "flex flex-col flex-1 mx-auto w-full min-w-0",
        maxWidthClasses[maxWidth],
        // Consistent gutter on every side: 16px on mobile, 24px on tablet, 32px on desktop.
        // Matches the inset of the (tables) layout so nested PageContainers do not double-pad.
        padding && (paddingClassName ?? "px-4 sm:px-6 lg:px-8 pt-2 pb-4"),
        workspaceOwnsGutter && flushGutter,
        // Prevent horizontal overflow on all screen sizes
        "overflow-x-clip",
        className,
      )}
    >
      {children}
    </div>
  );
}
