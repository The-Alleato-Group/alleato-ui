"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { PageContainer } from "./page-container";
import { TablePageLayoutProvider } from "./table-page-layout-context";

export type PageShellVariant =
  | "dashboard"
  | "table"
  | "form"
  | "formWide"
  | "detail"
  | "detailNarrow"
  | "detailWide"
  | "detailXWide"
  | "content"
  | "workspace";

export interface PageShellFrameProps {
  variant: PageShellVariant;
  header?: React.ReactNode;
  children: React.ReactNode;
  /** Used only to reset form scroll when host navigation/title changes. */
  title?: string;
  scrollResetKey?: string;
  className?: string;
  contentClassName?: string;
  containerPaddingClassName?: string;
  fillHeight?: boolean;
}

const variantConfig: Record<
  PageShellVariant,
  {
    containerMaxWidth: "full" | "sm" | "md" | "lg" | "xl" | "2xl";
    contentMaxWidth?: string;
    spacing: string;
    headerPadding?: string;
  }
> = {
  dashboard: {
    containerMaxWidth: "full",
    contentMaxWidth: "max-w-[1800px]",
    spacing: "space-y-14",
  },
  table: { containerMaxWidth: "full", spacing: "space-y-4" },
  form: {
    containerMaxWidth: "full",
    contentMaxWidth: "max-w-5xl",
    spacing: "space-y-8",
  },
  formWide: {
    containerMaxWidth: "full",
    contentMaxWidth: "max-w-[1800px]",
    spacing: "space-y-8",
  },
  detail: {
    containerMaxWidth: "full",
    contentMaxWidth: "max-w-screen-2xl",
    spacing: "space-y-6",
  },
  detailNarrow: {
    containerMaxWidth: "full",
    contentMaxWidth: "max-w-7xl",
    spacing: "space-y-6",
  },
  detailWide: {
    containerMaxWidth: "full",
    contentMaxWidth: "max-w-screen-2xl",
    spacing: "space-y-6",
  },
  detailXWide: {
    containerMaxWidth: "full",
    contentMaxWidth: "max-w-[1800px]",
    spacing: "space-y-6",
  },
  workspace: {
    containerMaxWidth: "full",
    contentMaxWidth: "max-w-[1800px]",
    spacing: "space-y-6",
  },
  content: {
    containerMaxWidth: "full",
    contentMaxWidth: "max-w-4xl",
    spacing: "space-y-8",
  },
};

/** Portable canonical layout. The host supplies its header, route state and data. */
export function PageShellFrame({
  variant, header, children, title, scrollResetKey,
  className, contentClassName, containerPaddingClassName, fillHeight = false,
}: PageShellFrameProps) {
  const config = variantConfig[variant];
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  // formWide is the form variant with a wider content column — every
  // form-specific behavior below applies to it identically.
  const isFormVariant = variant === "form" || variant === "formWide";

  React.useEffect(() => {
    if (!isFormVariant) {
      return;
    }

    const resetScrollPosition = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });

      let ancestor = rootRef.current?.parentElement ?? null;
      while (ancestor) {
        const styles = window.getComputedStyle(ancestor);
        if (
          (styles.overflowY === "auto" || styles.overflowY === "scroll") &&
          ancestor.scrollHeight > ancestor.clientHeight
        ) {
          ancestor.scrollTo({ top: 0, left: 0, behavior: "auto" });
          break;
        }
        ancestor = ancestor.parentElement;
      }
    };

    resetScrollPosition();

    const rafId = window.requestAnimationFrame(resetScrollPosition);
    const timeoutId = window.setTimeout(resetScrollPosition, 120);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [scrollResetKey, title, isFormVariant]);

  // Table variant: tight layout — no extra top padding so header aligns with
  // pages that render ProjectPageHeader outside of PageContainer.
  if (variant === "table") {
    return (
      <TablePageLayoutProvider>
        <PageContainer
          maxWidth={config.containerMaxWidth}
          className={cn(fillHeight && "flex flex-col min-h-0", className)}
          // The inner table content owns the canonical bottom rhythm. Keeping
          // it off this outer container makes a PageShell-wrapped table match
          // a standalone UnifiedTablePage exactly.
          paddingClassName={
            containerPaddingClassName ?? "px-4 sm:px-6 lg:px-8 pt-2 pb-0"
          }
        >
          {header}
          <div
            className={cn(
              "min-w-0 pt-0 pb-24",
              "page-shell-content-entrance",
              fillHeight && "flex flex-1 flex-col min-h-0",
              contentClassName,
            )}
          >
            {children}
          </div>
        </PageContainer>
      </TablePageLayoutProvider>
    );
  }

  // Content bottom padding is pb-24 (96px), not pb-12: the floating AI
  // assistant launcher is 48px tall and sits 2rem above the viewport bottom,
  // so with pb-12 the last row or total at the end of a page stayed under it
  // (ALL-155). pb-24 lets the page scroll the final content clear of it.
  // Form/detail/content/dashboard: constrained inner width
  if (config.contentMaxWidth) {
    return (
      <PageContainer
        maxWidth={config.containerMaxWidth}
        className={cn(
          fillHeight && "flex flex-col min-h-0",
          variant === "workspace" && "flex-none min-h-full bg-surface-summary",
          className,
        )}
        paddingClassName={
          containerPaddingClassName ??
          (variant === "workspace"
            ? "px-4 py-6 sm:px-8 xl:px-16 xl:py-9"
            : "px-4 sm:px-6 lg:px-8 pt-2 pb-4")
        }
      >
        <div
          ref={rootRef}
          className={cn(
            "mx-auto w-full min-w-0",
            config.contentMaxWidth,
            config.headerPadding,
            fillHeight && "flex flex-col flex-1 min-h-0",
          )}
        >
          {header}
          <div
            className={cn(
              config.spacing,
              variant === "workspace"
                ? "min-w-0 pt-8 pb-24"
                : "min-w-0 pt-6 pb-24",
              "page-shell-content-entrance",
              variant === "dashboard" &&
                "page-shell-content-entrance-dashboard",
              fillHeight && "flex flex-col flex-1 min-h-0",
              contentClassName,
            )}
          >
            {children}
          </div>
        </div>
      </PageContainer>
    );
  }

  // Fallback: full width
  return (
    <PageContainer
      maxWidth={config.containerMaxWidth}
      className={cn(
        fillHeight && "flex flex-col min-h-0",
        variant === "workspace" && "flex-none min-h-full bg-surface-summary",
        className,
      )}
      paddingClassName={
        containerPaddingClassName ??
        (variant === "workspace"
          ? "px-4 py-6 sm:px-8 xl:px-16 xl:py-9"
          : "px-4 sm:px-6 lg:px-8 pt-2 pb-4")
      }
    >
      {header}
      <div
        ref={rootRef}
        className={cn(
          config.spacing,
          variant === "workspace" ? "min-w-0 pt-8 pb-24" : "min-w-0 pt-6 pb-24",
          "page-shell-content-entrance",
          fillHeight && "flex flex-col flex-1 min-h-0",
          contentClassName,
        )}
      >
        {children}
      </div>
    </PageContainer>
  );
}
