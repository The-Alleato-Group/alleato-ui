"use client";

import * as React from "react";

import {
  DEFAULT_SPLIT_PAGE_PRIMARY_PANE_WIDTH,
  SplitPage,
  SplitPageFrame,
  type SplitPageProps,
} from "./split-page";
import { Plus } from "lucide-react";

import { Button } from "./button";
import { SelectionCheckbox } from "../ds/selection-checkbox";
import { getPageTabTriggerClassName } from "../layout/page-tabs";
import {
  APP_SHELL_SPLIT_VIEW_CLASSNAME,
  APP_SHELL_SPLIT_VIEW_NESTED_MARKER,
} from "../layout/app-shell-split-view";
import { cn } from "../lib/utils";

/**
 * The application-level list/detail workspace.
 *
 * Pages supply their domain content only. The viewport fill, responsive handoff,
 * pane chrome, and default desktop geometry have one owner so a new inbox or
 * inspector cannot accidentally become a different kind of page.
 */
export interface SplitPageWorkspaceProps extends Omit<
  SplitPageProps,
  "breakpoint" | "className"
>, Omit<React.ComponentPropsWithoutRef<"div">, "children" | "className"> {
  /** Use only when the workspace genuinely needs a different rail size. */
  firstPaneWidth?: SplitPageProps["firstPaneWidth"];
  /** An auxiliary rail is reserved for a true third workflow, such as AI review. */
  thirdPaneWidth?: SplitPageProps["thirdPaneWidth"];
  className?: string;
}

export const SPLIT_PAGE_WORKSPACE_CLASSNAME = cn(
  APP_SHELL_SPLIT_VIEW_CLASSNAME,
  APP_SHELL_SPLIT_VIEW_NESTED_MARKER,
  "split-page-workspace flex h-full min-h-0 flex-1 w-full overflow-hidden bg-background",
);

/**
 * Selectable list row in the primary rail. Owns the row inset so every inbox
 * keeps the same breathing room against the pane divider: the left edge
 * carries the 2px active indicator, the right edge matches the rail header's
 * horizontal inset (`px-5`) so row content never crowds the divider.
 */
export const SPLIT_PAGE_WORKSPACE_LIST_ROW_CLASSNAME =
  "group h-auto min-w-0 w-full max-w-full justify-start overflow-hidden rounded-none border-l-2 pl-3 pr-5 py-2.5 text-left whitespace-normal shadow-none transition-colors";

export function getSplitPageWorkspaceListRowClassName(
  active: boolean,
  className?: string,
): string {
  return cn(
    SPLIT_PAGE_WORKSPACE_LIST_ROW_CLASSNAME,
    active
      ? "border-primary bg-accent/60"
      : "border-transparent hover:bg-accent/50",
    className,
  );
}

type SplitPageWorkspaceRailAddActionProps = Omit<
  React.ComponentProps<typeof Button>,
  "variant" | "size" | "children"
> & {
  /** Accessible name, e.g. "New task". Also used as the hover title. */
  label: string;
};

/**
 * The bare "create" action for a rail header: a plus icon in the brand
 * accent, no label, no border. Pass it as the header's `actions` (or as a
 * dialog trigger) so every split workspace exposes "add" the same way.
 */
export const SplitPageWorkspaceRailAddAction = React.forwardRef<
  HTMLButtonElement,
  SplitPageWorkspaceRailAddActionProps
>(({ label, className, ...props }, ref) => (
  <Button
    ref={ref}
    type="button"
    variant="ghost"
    size="icon"
    aria-label={label}
    title={label}
    className={cn(
      "size-11 rounded-full text-primary shadow-none hover:text-primary sm:size-8",
      className,
    )}
    {...props}
  >
    <Plus className="h-4 w-4" />
  </Button>
));

SplitPageWorkspaceRailAddAction.displayName = "SplitPageWorkspaceRailAddAction";

type SplitPageWorkspaceRailHeaderProps = {
  /** The concise name of the list or inspector currently in view. */
  title: React.ReactNode;
  /** Select visible records beside the title; the header owns disclosure. */
  selection?: React.ComponentProps<typeof SelectionCheckbox>;
  /** Secondary context, such as the current project or visible item count. */
  description?: React.ReactNode;
  /** Compact, reusable controls such as search, filters, or pane controls. */
  actions?: React.ReactNode;
  /** Navigation control used on the mobile detail handoff. */
  leading?: React.ReactNode;
  /** State tabs or another shared toolbar row beneath the title. */
  children?: React.ReactNode;
  className?: string;
  titleClassName?: string;
};

/**
 * Shared list/detail chrome for every split workspace.
 *
 * Domain pages may supply their title, context, and controls, but they do not
 * recreate a competing rail header or duplicate the detail heading treatment.
 */
export function SplitPageWorkspaceRailHeader({
  title,
  selection,
  description,
  actions,
  leading,
  children,
  className,
  titleClassName,
}: SplitPageWorkspaceRailHeaderProps) {
  return (
    <header
      className={cn("shrink-0 border-b border-border/70 px-5 py-4", className)}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-3 sm:flex-nowrap">
        {leading ? <div className="shrink-0">{leading}</div> : null}
        <div className="min-w-0 flex-1">
          <div className="group/title flex min-w-0 items-center gap-1">
            {selection ? (
              <label
                className={cn(
                  "-my-2 -ml-3 flex size-11 shrink-0 cursor-pointer items-center justify-center transition-opacity motion-reduce:transition-none",
                  "focus-within:pointer-events-auto focus-within:opacity-100 group-hover/title:pointer-events-auto group-hover/title:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100",
                  selection.checked === false ? "pointer-events-none opacity-0" : "opacity-100",
                )}
              >
                <SelectionCheckbox {...selection} />
              </label>
            ) : null}
            <h2
              className={cn(
                "min-w-0 truncate text-lg font-semibold tracking-[-0.01em] text-foreground",
                titleClassName,
              )}
            >
              {title}
            </h2>
          </div>
          {description ? (
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center gap-1 text-muted-foreground">
            {actions}
          </div>
        ) : null}
      </div>
      {children}
    </header>
  );
}

/** A readable rail row: primary context gets its own line on phones. */
export function SplitPageWorkspaceRowContent({
  title,
  trailing,
  metadata = [],
  muted = false,
}: {
  title: React.ReactNode;
  trailing?: React.ReactNode;
  metadata?: ReadonlyArray<{ key: string; label: string; primary?: boolean; desktopOnly?: boolean }>;
  muted?: boolean;
}) {
  return (
    <span className="flex w-full min-w-0 flex-col gap-1">
      <span className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
        <span className={cn("min-w-0 line-clamp-3 text-base font-medium leading-6 text-foreground sm:line-clamp-2 sm:text-sm sm:leading-5", muted && "text-muted-foreground line-through")}>
          {title}
        </span>
        {trailing}
      </span>
      <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-sm leading-5 text-muted-foreground sm:text-xs sm:leading-4">
        {metadata.map(item => (
          <span key={item.key} title={item.label} className={cn(
            "min-w-0 truncate",
            item.primary && "order-first basis-full sm:order-none sm:basis-auto",
            item.desktopOnly && "hidden sm:inline",
          )}>{item.label}</span>
        ))}
      </span>
    </span>
  );
}

/** Row selection has a full touch target and never activates the record. */
export function SplitPageWorkspaceRowSelection(props: React.ComponentProps<typeof SelectionCheckbox>) {
  return (
    <label className="flex min-h-11 w-11 shrink-0 cursor-pointer items-center justify-center self-center">
      <SelectionCheckbox {...props} />
    </label>
  );
}

type SplitPageWorkspaceTabsProps = React.ComponentPropsWithoutRef<"div">;

/** A dense, scroll-safe state strip shared by inbox and review workspaces. */
export function SplitPageWorkspaceTabs({
  children,
  className,
  ...props
}: SplitPageWorkspaceTabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "-mx-1 mt-3 flex min-h-11 items-end gap-1 overflow-x-auto",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type SplitPageWorkspaceTabProps = React.ComponentProps<typeof Button> & {
  active?: boolean;
};

export function SplitPageWorkspaceTab({
  active = false,
  className,
  children,
  ...props
}: SplitPageWorkspaceTabProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      role="tab"
      aria-selected={active}
      className={cn(
        getPageTabTriggerClassName(active, "inline"),
        "shrink-0",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

type SplitPageWorkspaceFrameProps = React.ComponentPropsWithoutRef<"div">;

type SplitPageWorkspaceDetailContentProps =
  React.ComponentPropsWithoutRef<"div"> & {
    /**
     * `reading` mirrors inbox-style detail panes with a calmer, narrower
     * measure. Both variants keep a side gutter at every breakpoint: the
     * max-width only centers content once the pane is wider than it, and a
     * 720px "wide" pane on a laptop never is, so a `lg:px-0` measure-only
     * column put the text flush against the divider (owner correction
     * 2026-09-11). The reading gutter matches `TableSidePanel`'s body inset
     * so the two detail surfaces read the same.
     */
    variant?: "standard" | "reading";
  };

/**
 * Canonical padded, independently scrollable detail surface for split
 * workspaces. Domain pages supply content only so spacing remains consistent
 * across tasks, email, directory, and future list/detail workspaces.
 */
export function SplitPageWorkspaceDetailContent({
  children,
  className,
  variant = "standard",
  ...props
}: SplitPageWorkspaceDetailContentProps) {
  return (
    <div
      data-split-page-workspace-detail
      className="min-h-0 flex-1 overflow-y-auto"
    >
      <div
        className={cn(
          "mx-auto min-h-full w-full",
          variant === "reading"
            ? "max-w-3xl px-6 py-7 sm:px-8"
            : "max-w-5xl px-7 py-5",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

export function SplitPageWorkspaceFrame({
  children,
  className,
  ...props
}: SplitPageWorkspaceFrameProps) {
  return (
    <SplitPageFrame
      height="fill"
      data-split-page-workspace
      className={cn(SPLIT_PAGE_WORKSPACE_CLASSNAME, className)}
      {...props}
    >
      {children}
    </SplitPageFrame>
  );
}

export function SplitPageWorkspacePanels({
  children,
  variant = "two-column",
  auxiliaryBreakpoint = "xl",
  firstPaneWidth = DEFAULT_SPLIT_PAGE_PRIMARY_PANE_WIDTH,
  thirdPaneWidth = "22rem",
  defaultIsOpen = true,
  orientation = "horizontal",
  firstPaneClassName,
  secondPaneClassName,
  thirdPaneClassName,
}: Omit<SplitPageWorkspaceProps, "className">) {
  return (
    <SplitPage
      variant={variant}
      breakpoint="lg"
      auxiliaryBreakpoint={auxiliaryBreakpoint}
      firstPaneWidth={firstPaneWidth}
      thirdPaneWidth={thirdPaneWidth}
      defaultIsOpen={defaultIsOpen}
      orientation={orientation}
      className="min-h-0 flex-1"
      firstPaneClassName={cn(
        "relative flex h-full min-w-0 flex-col overflow-hidden",
        firstPaneClassName,
      )}
      secondPaneClassName={cn(
        "relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden",
        secondPaneClassName,
      )}
      thirdPaneClassName={cn(
        "relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden",
        thirdPaneClassName,
      )}
    >
      {children}
    </SplitPage>
  );
}

export function SplitPageWorkspace({
  className,
  children,
  variant,
  auxiliaryBreakpoint,
  firstPaneWidth,
  thirdPaneWidth,
  defaultIsOpen,
  orientation,
  firstPaneClassName,
  secondPaneClassName,
  thirdPaneClassName,
  ...frameProps
}: SplitPageWorkspaceProps) {
  return (
    <SplitPageWorkspaceFrame className={className} {...frameProps}>
      <SplitPageWorkspacePanels
        variant={variant}
        auxiliaryBreakpoint={auxiliaryBreakpoint}
        firstPaneWidth={firstPaneWidth}
        thirdPaneWidth={thirdPaneWidth}
        defaultIsOpen={defaultIsOpen}
        orientation={orientation}
        firstPaneClassName={firstPaneClassName}
        secondPaneClassName={secondPaneClassName}
        thirdPaneClassName={thirdPaneClassName}
      >
        {children}
      </SplitPageWorkspacePanels>
    </SplitPageWorkspaceFrame>
  );
}
