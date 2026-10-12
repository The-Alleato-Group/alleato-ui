"use client";
import * as React from "react";
import { ChevronLeft, PanelRightClose, PanelRightOpen, X } from "lucide-react";
import { Button } from "../components/button";
import { cn } from "../lib/utils";
import type { TableSidePanelBodyLayout, TableSidePanelMode } from "./table-host";
/**
 * Layers that render outside the panel's DOM subtree but belong to it:
 * Radix portals (select, popover, menu, sheet, dialog), the command palette,
 * and toasts. A pointer-down inside any of these is not "outside the panel".
 */
const SIDE_PANEL_LAYER_SELECTOR = [
  "[data-table-side-panel]",
  "[data-radix-popper-content-wrapper]",
  "[data-radix-portal]",
  '[role="dialog"]',
  '[role="alertdialog"]',
  '[role="menu"]',
  '[role="listbox"]',
  "[data-sonner-toaster]",
  "[cmdk-root]",
].join(", ");

/**
 * True when a pointer-down should close an overlay panel: the target is a
 * real element in the page that is neither the panel nor one of its layers.
 * Scrollbar and root-element hits are not clicks on the page.
 */
export function isTableSidePanelOutsideTarget(
  target: EventTarget | null,
  panel: HTMLElement | null,
): boolean {
  if (!panel || !(target instanceof Element)) return false;
  if (target === document.documentElement || target === document.body) {
    return false;
  }
  if (panel.contains(target)) return false;
  return target.closest(SIDE_PANEL_LAYER_SELECTOR) === null;
}

export interface TableSidePanelProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  headerActions?: React.ReactNode;
  mode?: TableSidePanelMode;
  bodyLayout?: TableSidePanelBodyLayout;
  width?: number;
  collapsed?: boolean;
  collapsible?: boolean;
  resizable?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
  onToggleCollapsed?: () => void;
  onResizeStart?: React.MouseEventHandler<HTMLDivElement>;
}

/**
 * Canonical table-detail panel chrome.
 *
 * Table pages supply record content only. This component owns positioning,
 * height, elevation, header density, body gutters, scrolling, resize affordance,
 * collapse affordance, and mobile presentation.
 */
export function TableSidePanel({
  children,
  title,
  headerActions,
  mode = "overlay",
  bodyLayout = "standard",
  width = 560,
  collapsed = false,
  collapsible = true,
  resizable = true,
  showCloseButton = true,
  onClose,
  onToggleCollapsed,
  onResizeStart,
}: TableSidePanelProps): React.ReactElement {
  const isMobile = mode === "mobile";
  const canCollapse = !isMobile && collapsible && Boolean(onToggleCollapsed);
  const canResize =
    !isMobile && !collapsed && resizable && Boolean(onResizeStart);
  const panelRef = React.useRef<HTMLElement>(null);

  // An overlay panel closes on a click anywhere else on the page (owner rule,
  // 2026-09-12). Inline split panes and the mobile sheet keep their own
  // dismissal: the sheet has an overlay, the split pane is part of the layout.
  const closeOnOutsideClick =
    mode === "overlay" && !collapsed && Boolean(onClose);
  React.useEffect(() => {
    if (!closeOnOutsideClick || !onClose) return;
    const handlePointerDown = (event: PointerEvent) => {
      // Only the primary button dismisses; a right-click opens a menu instead.
      if (event.defaultPrevented || event.button > 0) return;
      if (isTableSidePanelOutsideTarget(event.target, panelRef.current)) {
        onClose();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [closeOnOutsideClick, onClose]);

  return (
    <aside
      ref={panelRef}
      data-table-side-panel
      data-mode={mode}
      data-collapsed={collapsed ? "true" : "false"}
      aria-label={typeof title === "string" ? title : "Record details"}
      className={cn(
        "flex min-h-0 flex-col overflow-hidden bg-background transition-[width,transform,opacity] duration-200 ease-out motion-reduce:transition-none",
        mode === "overlay" &&
          "fixed inset-0 z-30 shadow-[-12px_0_28px_-22px_rgba(15,23,42,0.32)] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 motion-safe:duration-200",
        mode === "inline" &&
          "relative h-full min-w-0 shrink-0 border-l border-border/70",
        mode === "mobile" &&
          "fixed inset-0 z-50 h-dvh w-screen motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 motion-safe:duration-200",
      )}
      style={isMobile ? undefined : { width: collapsed ? 40 : width }}
    >
      {canResize ? (
        <div
          data-table-side-panel-resizer
          className="group absolute bottom-0 left-0 top-0 z-10 w-3 cursor-col-resize select-none"
          onMouseDown={onResizeStart}
          aria-hidden="true"
        >
          <div className="absolute bottom-0 left-0 top-0 w-px bg-border transition-colors group-hover:bg-primary" />
        </div>
      ) : null}

      {collapsed ? (
        <div className="flex h-full items-center justify-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-100">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={onToggleCollapsed}
            aria-label="Expand details panel"
          >
            <PanelRightOpen className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150">
          <header className="flex h-12 shrink-0 items-center justify-between px-6">
            <div className="flex min-w-0 items-center gap-1.5">
              {isMobile && onClose && showCloseButton ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="-ml-2 h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={onClose}
                  aria-label="Back to table"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              ) : null}
              {title ? (
                <span className="truncate text-sm font-medium">{title}</span>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {headerActions}
              {canCollapse ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={onToggleCollapsed}
                  aria-label="Collapse details panel"
                >
                  <PanelRightClose className="h-4 w-4" />
                </Button>
              ) : null}
              {!isMobile && onClose && showCloseButton ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={onClose}
                  aria-label="Close details"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </header>

          <div
            data-table-side-panel-body
            className={cn(
              "min-h-0 flex-1 overflow-y-auto overscroll-contain",
              bodyLayout === "standard" && "px-6 py-6 sm:px-8 sm:py-7",
            )}
          >
            {children}
          </div>
        </div>
      )}
    </aside>
  );
}
