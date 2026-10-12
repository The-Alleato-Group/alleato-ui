"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { cn } from "../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Breakpoint = "sm" | "md" | "lg" | "xl";
type Orientation = "horizontal" | "vertical";

/** Shared desktop list/primary pane width for split-page workflows. */
export const DEFAULT_SPLIT_PAGE_PRIMARY_PANE_WIDTH = "40%";
export type SplitPageVariant = "two-column" | "three-column";

interface SplitPageContextValue {
  isOpen: boolean;
  isDesktop: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export interface SplitPageProps {
  /** Two children by default: [left/top pane, right/bottom pane]. Add a third child with variant="three-column". */
  children: [ReactNode, ReactNode] | [ReactNode, ReactNode, ReactNode];
  /** Whether this split owns only the primary/detail panes or also an auxiliary rail. */
  variant?: SplitPageVariant;
  /** Breakpoint above which both panes are always visible */
  breakpoint?: Breakpoint;
  /** Breakpoint above which the optional auxiliary rail is visible. Defaults to the main pane breakpoint. */
  auxiliaryBreakpoint?: Breakpoint;
  /** Desktop width for the first pane. Defaults to content/class sizing. */
  firstPaneWidth?: number | string;
  /** Desktop width for the optional auxiliary pane. Defaults to content/class sizing. */
  thirdPaneWidth?: number | string;
  /** Whether the first pane is open on mobile by default */
  defaultIsOpen?: boolean;
  /** Layout direction */
  orientation?: Orientation;
  className?: string;
  firstPaneClassName?: string;
  secondPaneClassName?: string;
  thirdPaneClassName?: string;
}

type SplitPageFrameHeight = "content" | "viewport" | "fill";

export function getSplitPageFrameHeightClass(
  height: SplitPageFrameHeight,
): string {
  if (height === "viewport") return "h-svh";
  if (height === "fill") return "h-full flex-1";
  return "h-[calc(100dvh-5rem)]";
}

export interface SplitPageFrameProps extends React.ComponentPropsWithoutRef<"div"> {
  height?: SplitPageFrameHeight;
}

// ─── Media query hook ─────────────────────────────────────────────────────────

const BREAKPOINT_QUERIES: Record<Breakpoint, string> = {
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
};

function useMediaQuery(query: string): boolean {
  // Always start false (matches SSR) — useEffect corrects to real value after hydration
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SplitPageContext = createContext<SplitPageContextValue | null>(null);

export function useSplitPage(): SplitPageContextValue {
  const ctx = useContext(SplitPageContext);
  if (!ctx) throw new Error("useSplitPage must be used inside <SplitPage>");
  return ctx;
}

// ─── SplitPage ────────────────────────────────────────────────────────────────

export function SplitPage({
  children,
  variant = "two-column",
  breakpoint = "md",
  auxiliaryBreakpoint = breakpoint,
  firstPaneWidth = DEFAULT_SPLIT_PAGE_PRIMARY_PANE_WIDTH,
  thirdPaneWidth,
  defaultIsOpen = true,
  orientation = "horizontal",
  className,
  firstPaneClassName,
  secondPaneClassName,
  thirdPaneClassName,
}: SplitPageProps) {
  const [isOpen, setIsOpen] = useState(defaultIsOpen);
  const isDesktop = useMediaQuery(BREAKPOINT_QUERIES[breakpoint]);
  const isAuxiliaryDesktop = useMediaQuery(
    BREAKPOINT_QUERIES[auxiliaryBreakpoint],
  );

  const [leftPane, rightPane, thirdPane] = children;
  const isHorizontal = orientation === "horizontal";
  const showThirdPane =
    variant === "three-column" && thirdPane !== undefined && isAuxiliaryDesktop;
  const getDesktopPaneWidthStyle = (width?: number | string) =>
    isDesktop && isHorizontal && width !== undefined
      ? { width: typeof width === "number" ? `${width}px` : width }
      : undefined;
  const firstPaneStyle = getDesktopPaneWidthStyle(firstPaneWidth);
  const thirdPaneStyle = getDesktopPaneWidthStyle(thirdPaneWidth);

  return (
    <SplitPageContext.Provider
      value={{
        isOpen,
        isDesktop,
        onOpen: () => setIsOpen(true),
        onClose: () => setIsOpen(false),
      }}
    >
      <div
        data-split-page
        data-split-page-variant={variant}
        className={cn(
          "flex h-full w-full overflow-hidden",
          isHorizontal ? "flex-row" : "flex-col",
          className,
        )}
      >
        {/* First pane (left / top) */}
        <div
          data-split-page-pane="primary"
          style={firstPaneStyle}
          className={cn(
            "shrink-0 overflow-hidden border-b border-border/70",
            isHorizontal ? "h-full" : "w-full",
            isHorizontal && isDesktop && "border-b-0 border-r",
            isDesktop
              ? "block"
              : isOpen
                ? "block w-full flex-none"
                : "!hidden",
            firstPaneClassName,
          )}
        >
          {leftPane}
        </div>

        {/* Second pane (right / bottom) */}
        <div
          data-split-page-pane="detail"
          className={cn(
            "flex-1 min-w-0 overflow-auto bg-background",
            isDesktop ? "block" : isOpen ? "!hidden" : "block",
            secondPaneClassName,
          )}
        >
          {rightPane}
        </div>

        {/* Optional auxiliary pane (right / bottom rail) */}
        {showThirdPane ? (
          <div
            data-split-page-pane="auxiliary"
            data-split-page-auxiliary-pane
            style={thirdPaneStyle}
            className={cn(
              "shrink-0 overflow-hidden border-t border-border/70 bg-background",
              isHorizontal ? "h-full" : "w-full",
              isHorizontal && "border-t-0 border-l",
              thirdPaneClassName,
            )}
          >
            {thirdPane}
          </div>
        ) : null}
      </div>
    </SplitPageContext.Provider>
  );
}

export const SplitPageFrame = React.forwardRef<
  HTMLDivElement,
  SplitPageFrameProps
>(({ children, className, height = "content", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex min-h-0 w-full flex-col overflow-hidden",
      getSplitPageFrameHeightClass(height),
      className,
    )}
    {...props}
  >
    {children}
  </div>
));

SplitPageFrame.displayName = "SplitPageFrame";
