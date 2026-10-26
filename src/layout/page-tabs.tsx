"use client";

import React, { type ReactElement } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "../components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import { titleCase } from "../lib/title-case";
import { cn } from "../lib/utils";

export interface PageTabMenuItem {
  label: string;
  href: string;
}

export interface PageTab {
  label: string;
  href: string;
  count?: number;
  isActive?: boolean;
  testId?: string;
  countTestId?: string;
  /**
   * A menu tab: the trigger opens these destinations instead of navigating to
   * `href`. `href` still identifies the tab and, when the current path is
   * inside any item, the tab reads as active. Used for a group like
   * "Reporting" that fans out to several tools without spending a tab each.
   */
  items?: PageTabMenuItem[];
}

export interface PageTabsProps {
  /** Host route state; no Next.js dependency is required. */
  pathname?: string;
  search?: string;
  /** The host supplies navigation or local-state switching. */
  onNavigate: (href: string) => void;
  tabs: PageTab[];
  className?: string;
  variant?: "default" | "inline" | "workspace";
  /**
   * Quiet actions at the far end of the tab row, sharing its baseline — the
   * "+ Create task" of the initiative workspace. One or two link-weight
   * controls, never a toolbar; the row stays a view switcher.
   */
  actions?: React.ReactNode;
  /**
   * Active-tab colour. `primary` (default) is the app's orange; `ink` is the
   * near-black underline the initiative workspace frame uses (Figma 5216:18131).
   */
  tone?: "primary" | "ink";
}

type PageTabVariant = NonNullable<PageTabsProps["variant"]>;

/** A menu tab is active when the current path is one of its items or nested under it. */
export function isMenuTabActive(
  tab: Pick<PageTab, "items">,
  pathname: string,
): boolean {
  const path = pathname.split("?")[0];
  return (tab.items ?? []).some((item) => {
    const itemPath = item.href.split("?")[0];
    return path === itemPath || path.startsWith(`${itemPath}/`);
  });
}

/**
 * Canonical visual contract for page and workspace tab triggers.
 *
 * Split-page workspaces consume this same owner so the global Button radius,
 * hover fill, or pressed translation can never create a competing tab style.
 */
export function getPageTabTriggerClassName(
  isActive: boolean,
  variant: PageTabVariant = "default",
  tone: "primary" | "ink" = "primary",
): string {
  // 2-3px of horizontal padding, not 12. The underline marks the active tab,
  // so the trigger does not need an inset to read as a target; `gap-*` on the
  // strip does the separating. The wrapper adds NO horizontal inset either --
  // stacking one on top of this gave the FIRST tab 16px on its left against
  // 12px on its right, which is what read as lopsided. DESIGN.md.
  const sizingClasses =
    variant === "inline"
      ? "h-full min-h-11 px-0.5 py-0 text-xs"
      : "min-h-11 px-0.5 py-3 text-sm";

  return cn(
    "group relative inline-flex snap-start items-center gap-2 whitespace-nowrap font-medium transition-colors",
    sizingClasses,
    "rounded-none hover:bg-transparent active:translate-y-0",
    "after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:content-[''] after:transition-colors",
    isActive
      ? tone === "ink"
        ? "font-semibold text-foreground after:bg-foreground"
        : "text-primary after:bg-primary"
      : "text-foreground/70 hover:text-foreground/90 after:bg-transparent",
  );
}

/**
 * PageTabs owns page-level or top-of-tool navigation.
 * Use this for the primary view switcher on a page or workspace, whether the
 * tab changes the route or swaps top-level local state via `onTabClick`.
 *
 * Use `Tabs` from `@/components/ui/tabs` for section-level content tabs inside
 * a page instead of styling section tabs into a page-navigation look.
 */
export function PageTabs({
  tabs,
  className,
  variant = "default",
  pathname = "",
  search = "",
  onNavigate,
  actions,
  tone = "primary",
}: PageTabsProps): ReactElement {

  // Find the active tab based on pathname
  const searchString = search.replace(/^\?/, "");
  const currentPath = searchString ? `${pathname}?${searchString}` : pathname;
  const hasExactHrefMatch = tabs.some((tab) => tab.href === currentPath);
  // An explicit owner decision must win across the whole tab set. Evaluating
  // `isActive ?? pathMatch` one tab at a time lets an earlier pathname match
  // steal selection from a later explicit tab whenever unrelated query state
  // (for example `detail`) makes the full href non-exact.
  const explicitlyActiveTab = tabs.find((tab) => tab.isActive === true);
  const activeTabHref =
    explicitlyActiveTab?.href ??
    tabs.find((tab) => {
      if (tab.isActive === false) return false;
      if (tab.items) return isMenuTabActive(tab, pathname);
      return hasExactHrefMatch
        ? tab.href === currentPath
        : pathname === tab.href;
    })?.href;
  const activeTabRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    activeTabRef.current?.scrollIntoView?.({
      block: "nearest",
      inline: "nearest",
    });
  }, [activeTabHref]);
  // On a phone the strip takes the whole row and the actions drop under it.
  // Sharing the row let a "+ Create task" shrink the strip until the last
  // tabs scrolled out of sight with no affordance (scrollbar-hide) — the
  // initiative workspace at 390px, 2026-09-16. DESIGN.md §15: never content
  // shrunk until it clips. From sm up they share the row as before.
  const stackedActions = Boolean(actions) && variant !== "inline";
  const wrapperClasses =
    variant === "inline"
      ? "relative flex h-11 min-w-0 w-full items-center"
      : stackedActions
        ? "flex min-w-0 flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-4"
        : "";
  const navClasses =
    variant === "inline"
      ? "-mb-px flex h-full flex-1 min-w-0 items-center overflow-x-auto overscroll-x-contain scrollbar-hide"
      : "-mb-px flex gap-5 overflow-x-auto overscroll-x-contain pb-1 scrollbar-hide";
  // Tighter on a phone: the desktop gap costs a much larger share of the fold
  // at 390px. DESIGN.md.
  const spacingClasses =
    variant === "inline"
      ? "mb-3 md:mb-5"
      : variant === "workspace"
        ? "mb-5"
        : "mb-4 md:mb-8";
  // The ink tone carries the frame's full-width rule under the tab row; the
  // active underline sits on it (nav is -mb-px). With stacked actions the
  // rule belongs to the strip on a phone (the actions sit below it) and to
  // the whole row from sm up.
  const rowRuleClasses =
    tone === "ink"
      ? stackedActions
        ? "sm:border-b sm:border-border"
        : "border-b border-border"
      : "border-0";
  const navRuleClasses =
    tone === "ink" && stackedActions
      ? "border-b border-border sm:border-0"
      : "";

  return (
    <div
      data-page-tabs={variant}
      className={cn(wrapperClasses, spacingClasses, className, rowRuleClasses)}
    >
      {variant === "inline" && (
        <div data-page-tabs-fade="" className="pointer-events-none absolute right-0 top-0 z-10 h-[calc(100%-0.25rem)] w-4 bg-gradient-to-l from-background to-transparent md:hidden" />
      )}
      <nav className={cn(navClasses, navRuleClasses)} aria-label="Tabs">
        <div
          className={cn(
            "flex snap-x snap-mandatory md:space-x-6",
            "min-w-max space-x-2",
          )}
        >
          {tabs.map((tab) => {
            const isActive = tab.href === activeTabHref;
            const tabLabel = titleCase(tab.label);

            if (tab.items) {
              return (
                <DropdownMenu key={tab.href}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      ref={isActive ? activeTabRef : undefined}
                      aria-label={tabLabel}
                      data-testid={tab.testId}
                      className={getPageTabTriggerClassName(
                        isActive,
                        variant,
                        tone,
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span>{tabLabel}</span>
                      <ChevronDown
                        aria-hidden
                        className="size-3.5 opacity-70"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {tab.items.map((item) => (
                      <DropdownMenuItem
                        key={item.href}
                        onSelect={() =>
                          onNavigate(item.href)
                        }
                      >
                        {titleCase(item.label)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            return (
              <React.Fragment key={tab.href}>
                <Button
                  type="button"
                  variant="ghost"
                  ref={isActive ? activeTabRef : undefined}
                  onClick={() =>
                    onNavigate(tab.href)
                  }
                  aria-label={tabLabel}
                  data-testid={tab.testId}
                  className={getPageTabTriggerClassName(
                    isActive,
                    variant,
                    tone,
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span>{tabLabel}</span>
                  {tab.count !== undefined ? (
                    <span
                      data-testid={tab.countTestId}
                      className="ml-1.5 font-normal tabular-nums text-muted-foreground"
                    >
                      {tab.count}
                    </span>
                  ) : null}
                </Button>
              </React.Fragment>
            );
          })}
        </div>
      </nav>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2 self-end py-2 sm:self-center sm:py-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
