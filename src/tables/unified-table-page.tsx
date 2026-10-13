"use client";

import * as React from "react";
import {
  useTableHost,
  type HeaderAction,
  type HeaderMenuItem,
  type HeaderPrimaryAction,
  type BulkEditField,
  type BulkEditValue,
  type SavedTableView,
  type TablePaginationBehavior,
  type TableSidePanelBodyLayout,
} from "./table-host";
import {
  DEFAULT_SPLIT_PAGE_PRIMARY_PANE_WIDTH,
  useSplitPage,
} from "../components/split-page";
import {
  SplitPageWorkspaceDetailContent,
  SplitPageWorkspaceFrame,
  SplitPageWorkspacePanels,
  SplitPageWorkspaceRailHeader,
} from "../components/split-page-workspace";
import { TableSidePanel } from "./table-side-panel";
import { X } from "lucide-react";

import { useStoredPreference } from "../hooks/use-stored-preference";
import { useIsMobile } from "../hooks/use-mobile";
import { useIsPrinting } from "../hooks/use-is-printing";
import type { ReactElement, ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useVirtualizer } from "@tanstack/react-virtual";

import { cn } from "../lib/utils";
import { LABEL_HEADING_CLASS } from "../layout/headings";
import lightTableThemeStyles from "./light-table-theme.module.css";
import { nextColumnOrderAfterVisibilityChange } from "./column-order";
import { escapeUnifiedTableCsvCell } from "./unified-table-csv";
import { selectUnifiedTableCsvColumns } from "./unified-table-csv-columns";
import {
  EMPTY_FILTER_QUERY,
  applyFilterQuery,
  type FilterFieldResolver,
  type FilterQuery,
} from "../lib/filter-query";
import {
  TablePageActions,
  type TablePageActionItem,
} from "./table-page-actions";
import {
  PageContainer,
  type PageContainerProps,
} from "../layout/page-container";
import { useTablePageShellOwnsLayout } from "../layout/table-page-layout-context";
import { EmptyState } from "../ds/empty-state";
import { humanizeStatus } from "../ds/status-badge";
import { Input } from "../components/input";
import { Skeleton } from "../components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/table";
import { Checkbox } from "../components/checkbox";
import { SimplePagination } from "../components/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/alert-dialog";
import {
  TableToolbar,
  type TableToolbarProps,
  type ColumnConfig,
  type FilterConfig,
  type ViewMode,
  type TableDensity,
} from "./table-toolbar";
import {
  ColumnResizeHandle,
  MIN_COLUMN_RESIZE_WIDTH,
  computeResizedColumnWidth,
  useColumnResizeDrag,
} from "./column-resize";
import { Button } from "../components/button";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  EyeOff,
  GripVertical,
  Inbox,
  Loader2,
  MoreVertical,
  Pencil,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";
import { MobileCardList } from "../ds/mobile-card-list";
import { countCompleteRules } from "./table-filter-builder";
import { InlineSelectEditor } from "./inline-select-editor";
import { TableHorizontalScrollbar } from "./table-horizontal-scrollbar";

const BOOLEAN_EDIT_OPTIONS = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

const INTERACTIVE_ROW_TARGET_SELECTOR = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "[role='button']",
  "[role='menuitem']",
  "[contenteditable='true']",
  "[data-row-interactive='true']",
].join(", ");

/**
 * Fallback-only heuristic for columns that do not declare `dateLike`. Name
 * shape alone is not evidence — "Payments Issued" is money, "Received From" is
 * a person — so a match here is confirmed against real values by
 * {@link isDateRangeFilterColumn} before a date filter is offered.
 */
const DATE_LIKE_COLUMN_PATTERN =
  /(^|[_\s-])(date|created|updated|reviewed|submitted|received|sent|issued|due|completed|closed|opened|start|end)([_\s-]|$)/i;

/**
 * Date columns hand the filter epoch milliseconds (`sortValue: (item) =>
 * new Date(item.created_at).getTime()`), so "is this a number?" cannot separate
 * a date from a dollar amount. Magnitude can: 1e11 ms is 1973-03-03, and no
 * money total or count in this app reaches 100 billion.
 */
const MIN_PLAUSIBLE_EPOCH_MS = 1e11;

/**
 * A real date string carries an ISO date, a slash date, or a spelled month.
 * `new Date(value)` alone is far too permissive — it happily parses "5".
 */
const DATE_SHAPED_STRING_PATTERN =
  /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i;

/** How many rows to inspect when confirming a name-matched column holds dates. */
const DATE_FILTER_INSPECTED_ROW_LIMIT = 25;
const SELECTION_COLUMN_WIDTH = 40;
const FIRST_SELECTED_CONTENT_INSET_PX = 8;

export const TABLE_HEADER_LABEL_CLASSNAME =
  "inline-block min-w-max shrink-0 whitespace-nowrap [word-break:keep-all]";
export const TABLE_COLUMN_HEADER_TOOLTIP_CLASSNAME =
  "max-w-xs whitespace-normal text-left text-xs leading-relaxed normal-case tracking-normal";

/**
 * Column header label, with the column's `description` (where the value comes
 * from / how it is calculated) as a hover tooltip.
 *
 * The same tooltip is used by sortable and non-sortable headers so table
 * definitions never choose between a browser-native title and the product
 * tooltip treatment. Pinned by column-header-description.test.tsx.
 */
export function renderColumnHeaderLabel(column: {
  label: string;
  description?: string;
}) {
  if (!column.description) {
    return <span className={TABLE_HEADER_LABEL_CLASSNAME}>{column.label}</span>;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(TABLE_HEADER_LABEL_CLASSNAME, "cursor-help")}
          data-column-description
        >
          {column.label}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="center"
        className={TABLE_COLUMN_HEADER_TOOLTIP_CLASSNAME}
      >
        {column.description}
      </TooltipContent>
    </Tooltip>
  );
}

export const TABLE_HEADER_MOBILE_TOOLBAR_CLASSNAME = "w-auto lg:hidden";
export const TABLE_INLINE_HEADER_ACTIONS_CLASSNAME =
  "flex min-w-0 flex-1 items-center justify-end gap-2";
export const TABLE_SIDE_PANEL_DESKTOP_WRAPPER_CLASSNAME = "hidden md:block";
export const TABLE_ABOVE_TABLE_TOOLBAR_CLASSNAME =
  "hidden min-w-0 justify-end lg:flex";
// `md:flex-1 md:min-w-0`, not `md:flex-none`: the strip has to be allowed to
// SHRINK. `flex-none` sizes it to its content and refuses to give any of it
// back, so a table with more tabs than fit — Documents derives one per folder,
// which is 11 on a real project — pushed the toolbar (row count, filters,
// export) off the right edge instead of scrolling itself. The strip already
// carries `overflow-x-auto scrollbar-hide`, so shrinking is what makes that
// scrolling reachable. With few tabs nothing changes: the row is
// `justify-between`, so the toolbar sits right either way.
export const TABLE_INLINE_PAGE_TABS_CLASSNAME =
  "-mr-1 mb-0 w-full min-w-0 sm:mr-0 md:mb-0 md:w-auto md:min-w-0 md:flex-1";
export const TABLE_TABBED_CONTENT_GAP_CLASSNAME = "pb-4 md:pb-5";
export const TABLE_SPLIT_VIEW_CONTAINER_CLASSNAME =
  "flex h-full min-h-0 flex-1 min-w-0 overflow-hidden";
export const TABLE_SPLIT_VIEW_PRIMARY_PANE_CLASSNAME =
  "min-h-0 flex-1 min-w-0 overflow-y-auto";
export const TABLE_SPLIT_VIEW_PRIMARY_PANE_WIDTH =
  DEFAULT_SPLIT_PAGE_PRIMARY_PANE_WIDTH;
export const TABLE_SPLIT_VIEW_DESKTOP_PANEL_CLASSNAME =
  "hidden shrink-0 md:block";
/**
 * Room reserved for the fixed-position split-view panel.
 *
 * Both `lg` breakpoints are spelled out on purpose. A page with a side panel
 * also carries `TABLE_SIDE_PANEL_PAGE_CONTAINER_CLASSNAME` ("pr-0 sm:pr-0
 * lg:pr-0") on the same element, and Tailwind resolves same-specificity rules
 * by stylesheet order — so a lone `md:` reservation loses to `lg:pr-0` at
 * >=1024px and the toolbar ends up underneath the panel, unclickable.
 */
export const TABLE_SIDE_PANEL_WIDTH_RESERVATION_CLASSNAME =
  "md:pr-[var(--table-side-panel-reserved-width)] lg:pr-[var(--table-side-panel-reserved-width)]";

/** Split view reserves the fixed panel width while retaining the shared left gutter. */
export const TABLE_SPLIT_VIEW_PANEL_RESERVATION_CLASSNAME =
  TABLE_SIDE_PANEL_WIDTH_RESERVATION_CLASSNAME;

/**
 * The same reservation for the header/toolbar row outside split view, widened to
 * swallow the page gutter (`sm:pr-6 lg:pr-8`) it overrides so the controls do
 * not butt against the panel edge. Pages whose padding belongs to a parent
 * (embedded tabs pass `containerPadding: false`) use the width-only class above.
 *
 * The table below this row deliberately scrolls *under* the panel — that is the
 * peek behavior. The row itself must not: the view switcher, search, filters,
 * column toggle and export all live there, and a panel drawn over them leaves no
 * way to change the view without first closing the panel.
 */
export const TABLE_SIDE_PANEL_HEADER_RESERVATION_CLASSNAME =
  "md:pr-[calc(var(--table-side-panel-reserved-width)_+_1.5rem)] lg:pr-[calc(var(--table-side-panel-reserved-width)_+_2rem)]";

/**
 * Pixel caps behind PageContainer's `maxWidth` tokens (Tailwind's
 * max-w-3xl/5xl/6xl/7xl/screen-2xl). `full` has no cap, so `mx-auto` never
 * introduces a centering margin and the panel's full width always overlaps
 * the container.
 */
const PAGE_CONTAINER_MAX_WIDTH_PX: Record<
  NonNullable<PageContainerProps["maxWidth"]>,
  number | null
> = {
  sm: 768,
  md: 1024,
  lg: 1152,
  xl: 1280,
  "2xl": 1536,
  full: null,
};

/**
 * The side panel is `fixed right-0` — anchored to the viewport, not to
 * PageContainer. When the container has a capped `maxWidth`, `mx-auto`
 * centers it, so above the cap only part of the panel actually overlaps the
 * container's content area (the rest falls in the centering margin). Reserve
 * exactly that geometric overlap instead of the panel's full width, or a
 * constrained page (e.g. `/crm/tasks` at `maxWidth: "2xl"`) shifts its toolbar
 * hundreds of pixels farther left than the panel requires on wide viewports.
 */
export function resolveTableSidePanelReservedWidth(
  panelWidthPx: number,
  containerMaxWidth: PageContainerProps["maxWidth"],
): string {
  const maxWidthPx = containerMaxWidth
    ? PAGE_CONTAINER_MAX_WIDTH_PX[containerMaxWidth]
    : null;
  if (maxWidthPx == null) return `${panelWidthPx}px`;
  return `max(0px, ${panelWidthPx}px - max(0px, (100vw - ${maxWidthPx}px) / 2))`;
}
export const TABLE_SPLIT_VIEW_GENERIC_DETAIL_CLASSNAME = "min-h-0 min-w-0";
export const TABLE_SPLIT_VIEW_PAGE_CONTAINER_CLASSNAME =
  "flex h-full min-h-0 flex-col overflow-hidden pb-0";
export const TABLE_FULL_BLEED_PAGE_CONTAINER_CLASSNAME = "overflow-x-visible";
export const TABLE_PAGE_LAUNCHER_CLEARANCE_CLASSNAME = "pb-24";
/**
 * Full-bleed tables rendered inside their own PageContainer (no PageShell
 * owning the layout): the scroll *region* is pulled out to the screen edge so
 * a trailing column can scroll flush with the viewport, but each gutter the
 * negative margin consumes is restored as inner padding so the content at
 * rest still aligns with the page title. Without the padding the full-bleed
 * edge-cell rule (`[&_th:first-child]:pl-0`) puts the first column at x=0 —
 * measured live on /daily-logs, /meeting-segments and
 * /potential-change-orders on 2026-09-14. Padding on a scroll container is
 * part of its scrollable overflow, so the trailing gutter stays reachable.
 */
export const TABLE_FULL_BLEED_SCROLL_SHELL_CLASSNAME =
  "-mx-4 px-4 w-[calc(100%+2rem)] sm:-mx-6 sm:px-6 sm:w-[calc(100%+3rem)] lg:-mx-8 lg:px-8 lg:w-[calc(100%+4rem)]";
export const TABLE_SIDE_PANEL_PAGE_CONTAINER_CLASSNAME =
  "pr-0 sm:pr-0 lg:pr-0 overflow-x-visible";
export const TABLE_PEEK_PAGE_CONTAINER_CLASSNAME =
  "h-full min-h-0 overflow-y-hidden pb-0";
export const TABLE_PEEK_GRID_CLASSNAME = "min-h-0 flex-1";
export const TABLE_PEEK_TABLE_SCROLL_CLASSNAME =
  "h-full min-h-0 overflow-y-auto";
/**
 * Default for every table: the horizontal scroll area runs to the right edge of
 * the page instead of stopping at the page gutter. A trailing column that ends
 * flush with the viewport reads as "keep scrolling"; one that stops short of a
 * blank gutter reads as randomly cut off. Mirrors the standard page padding
 * scale (px-4 / sm:px-6 / lg:px-8) so the bleed exactly consumes the gutter.
 */
export const TABLE_RIGHT_BLEED_SCROLL_SHELL_CLASSNAME =
  "-mr-4 w-[calc(100%+1rem)] sm:-mr-6 sm:w-[calc(100%+1.5rem)] lg:-mr-8 lg:w-[calc(100%+2rem)]";

function GenericTableSplitMobileSelectionSync({
  activeRowId,
}: {
  activeRowId: string | null;
}) {
  const { isDesktop, isOpen, onClose } = useSplitPage();
  React.useEffect(() => {
    if (!isDesktop && isOpen && activeRowId) onClose();
  }, [activeRowId, isDesktop, isOpen, onClose]);
  return null;
}

function GenericTableSplitDetailPane({
  listLabel,
  header,
  onCloseDetails,
  children,
}: {
  listLabel: string;
  header?: ReactNode;
  onCloseDetails?: () => void;
  children: ReactNode;
}) {
  const { onOpen } = useSplitPage();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-3 py-2 lg:hidden">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onCloseDetails?.();
            onOpen();
          }}
          className="-ml-1 gap-1.5 shadow-none"
        >
          <ChevronLeft className="h-4 w-4" />
          {listLabel}
        </Button>
      </div>
      {header}
      <SplitPageWorkspaceDetailContent>
        {children}
      </SplitPageWorkspaceDetailContent>
    </div>
  );
}

/**
 * Whether a table's desktop scroll shell should bleed into the page's right
 * gutter. Defaults to true for every table; the three layouts below already
 * reach the page edge on their own (full-bleed pulls both gutters, side panel
 * and split view zero out `pr`), so stacking a bleed on them would push the
 * table past the viewport.
 */
export function shouldBleedTableRightEdge(options: {
  bleedRight?: boolean;
  isFullBleedTable: boolean;
  hasSidePanel: boolean;
  isSplitView: boolean;
}): boolean {
  return (
    (options.bleedRight ?? true) &&
    !options.isFullBleedTable &&
    !options.hasSidePanel &&
    !options.isSplitView
  );
}

export function shouldRenderRowSelection(
  features?: UnifiedTableFeatures,
): boolean {
  return features?.enableRowSelection ?? true;
}

/**
 * The selected row IDs are the table's one authoritative selection source.
 * Some older callers also project a toolbar count; accepting that duplicate
 * value can leave the action disabled while the checkboxes are visibly checked.
 */
export function resolveUnifiedTableSelectedCount(
  selectedIds: readonly string[],
  _legacyToolbarCount?: number,
): number {
  return selectedIds.length;
}

/**
 * The rows a bulk delete will actually remove: selected, visible, and allowed
 * by `allowDelete`. The confirmation counts these and the confirm handler
 * deletes exactly these, so the number the user approves is the number
 * deleted. Anything else in the selection is reported as skipped, never
 * silently dropped.
 */
export function resolveBulkDeleteTargets<T>(
  selectedIds: readonly string[],
  visibleItems: readonly T[],
  getRowId: (item: T) => string,
  allowDelete?: (item: T) => boolean,
): { items: T[]; skippedCount: number } {
  const itemsById = new Map(
    visibleItems.map((item) => [getRowId(item), item]),
  );
  const items = selectedIds.flatMap((id) => {
    const item = itemsById.get(id);
    return item && (allowDelete?.(item) ?? true) ? [item] : [];
  });
  return { items, skippedCount: selectedIds.length - items.length };
}

/**
 * Internal selection may only hold rows the table can currently show and act
 * on. A row deleted from its own menu, or dropped by search, a filter, or a
 * page change, leaves the selection here instead of lingering as a phantom
 * "1 selected". Returns `previous` unchanged when nothing was pruned so a
 * state update can bail out.
 *
 * Cross-page selection is deliberately not a feature of the internal
 * selection: bulk delete acts on visible rows only, so an off-page id could
 * be counted but never deleted. A page that needs selection to survive a
 * server page change owns it through the `selection` prop.
 */
export function pruneSelectionToRows<T>(
  previous: string[],
  rows: readonly T[],
  getRowId: (item: T) => string,
): string[] {
  if (previous.length === 0) return previous;
  const rowIds = new Set(rows.map(getRowId));
  const next = previous.filter((id) => rowIds.has(id));
  return next.length === previous.length ? previous : next;
}

export const DEFAULT_UNIFIED_TABLE_VIEWS: ViewMode[] = [
  "table",
  "split",
  "board",
  "card",
];

export function resolveUnifiedTableViews(options: {
  /** @deprecated Standard views are default-on. Use excludedViews to opt out. */
  enabledViews?: ViewMode[];
  excludedViews?: ViewMode[];
  detailPresentation?: "panel" | "page";
  customViews?: Partial<Record<ViewMode, boolean>>;
}): ViewMode[] {
  const excluded = new Set(options.excludedViews ?? []);
  if (options.detailPresentation === "page") excluded.add("split");

  const resolved = DEFAULT_UNIFIED_TABLE_VIEWS.filter(
    (view) => !excluded.has(view),
  );
  const additionalViews = new Set<ViewMode>([
    ...(options.enabledViews ?? []).filter((view) => view !== "list"),
    ...(["calendar", "timeline"] as ViewMode[]).filter(
      (view) => options.customViews?.[view],
    ),
  ]);
  for (const view of additionalViews) {
    if (!excluded.has(view) && !resolved.includes(view)) resolved.push(view);
  }
  return resolved;
}

export function resolveActiveUnifiedTableView(
  activeView: ViewMode,
  enabledViews: ViewMode[],
): ViewMode {
  if (enabledViews.includes(activeView)) return activeView;
  return enabledViews[0] ?? "table";
}

/**
 * Resolves a row adjacent to the active detail-peek selection. Kept pure so
 * every opt-in side panel shares the same boundary and first-selection rules.
 */
export function getAdjacentSidePanelRowIndex(options: {
  activeRowIndex: number;
  itemCount: number;
  key: "ArrowDown" | "ArrowUp";
}): number | null {
  const { activeRowIndex, itemCount, key } = options;
  if (itemCount === 0) return null;

  const fallbackIndex = key === "ArrowDown" ? 0 : itemCount - 1;
  if (activeRowIndex < 0) return fallbackIndex;

  const currentIndex = activeRowIndex;
  const nextIndex = Math.min(
    Math.max(currentIndex + (key === "ArrowDown" ? 1 : -1), 0),
    itemCount - 1,
  );

  return nextIndex === activeRowIndex ? null : nextIndex;
}

// Re-exported so existing callers/tests keep their import path; the owner is
// `./column-resize`, shared with the Gantt task pane.
export { MIN_COLUMN_RESIZE_WIDTH, computeResizedColumnWidth };
export const ROW_ACTIONS_COLUMN_WIDTH = 56;
const DEFAULT_COLUMN_WIDTH = 180;

/**
 * Turn declared column widths into a real table geometry.
 *
 * Under auto layout a table set to `width: 100%` hands surplus space to every
 * column in proportion to its requested width and ignores the `max-width` its
 * cells carry, so a declared width is only ever a ratio. Measured on
 * `/876/closeout` at a 1900px viewport: six columns declaring 1,110px total
 * rendered at 1,844px, every one inflated by the same 1.66x, which left
 * "Retainage held" ~1,400px from the subcontractor whose retainage it reports
 * and stopped the row reading as a row.
 *
 * The opt-in (`table.fixedColumnWidths`) is deliberate rather than inferred
 * from the presence of any `width`, because other configs size *some* of their
 * columns while relying on auto layout to fit the rest to content; switching
 * those implicitly would relayout pages nobody has looked at.
 *
 * Restored 2026-09-07: 071dab33a reverted this file from a stale base and
 * dropped this, so `/876/closeout` -- the page the measurement above came from
 * -- silently went back to ratio widths. Pinned by
 * unified-table-column-widths.test.ts.
 */
export function resolveTableGeometry(options: {
  columns: { id: string; width?: number }[];
  columnWidths: Record<string, number>;
  fixedColumnWidths: boolean;
  hasRowSelection: boolean;
  selectionColumnWidth: number;
  hasRowActions: boolean;
  rowActionsColumnWidth: number;
}):
  | { tableLayout: "fixed"; width: number | string; minWidth?: number }
  | undefined {
  const {
    columns,
    columnWidths,
    fixedColumnWidths,
    hasRowSelection,
    selectionColumnWidth,
    hasRowActions,
    rowActionsColumnWidth,
  } = options;

  if (columns.length === 0) return undefined;

  const rails =
    (hasRowSelection ? selectionColumnWidth : 0) +
    (hasRowActions ? rowActionsColumnWidth : 0);

  // A resize drag wins over the declared widths: the user has just said, with a
  // mouse, what this table should look like.
  if (Object.keys(columnWidths).length > 0) {
    const total = columns.reduce(
      (sum, column) =>
        sum + (columnWidths[column.id] ?? column.width ?? DEFAULT_COLUMN_WIDTH),
      0,
    );
    return { tableLayout: "fixed", width: total + rails };
  }

  if (!fixedColumnWidths) return undefined;

  const declaredTotal = columns.reduce(
    (sum, column) => sum + (column.width ?? 0),
    0,
  );
  const unsizedCount = columns.filter(
    (column) => typeof column.width !== "number",
  ).length;

  // Every column sized: there is no column to hand the surplus to, so pin the
  // table to its total rather than let `width: 100%` inflate all of them again.
  if (unsizedCount === 0) {
    return { tableLayout: "fixed", width: declaredTotal + rails };
  }

  return {
    tableLayout: "fixed",
    width: "100%",
    minWidth: declaredTotal + unsizedCount * MIN_COLUMN_RESIZE_WIDTH + rails,
  };
}

/**
 * Keeps already loaded server pages on-screen when the global continuous-scroll
 * preference advances to a later page. A stable row ID also prevents duplicate
 * rows when an API repeats a record across pages.
 */
export function mergeContinuousTableItems<T>(
  previousItems: T[],
  nextPageItems: T[],
  getRowId: (item: T) => string,
  replace: boolean,
): T[] {
  if (replace) return nextPageItems;
  const nextById = new Map(nextPageItems.map((item) => [getRowId(item), item]));
  const merged = previousItems.map(
    (item) => nextById.get(getRowId(item)) ?? item,
  );
  const loadedIds = new Set(merged.map((item) => getRowId(item)));
  for (const item of nextPageItems) {
    if (!loadedIds.has(getRowId(item))) merged.push(item);
  }
  return merged;
}

function isInteractiveRowTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return Boolean(target.closest(INTERACTIVE_ROW_TARGET_SELECTOR));
}

export function shouldIgnoreSidePanelKeyboardTarget(
  eventTarget: EventTarget | null,
  activeElement: Element | null,
): boolean {
  const eventElement =
    eventTarget instanceof HTMLElement ? eventTarget : undefined;
  if (eventElement?.closest("[data-unified-side-panel-row]")) {
    return false;
  }

  return (
    isInteractiveRowTarget(eventTarget) || isInteractiveRowTarget(activeElement)
  );
}

/**
 * Whether a single cell value read off a row looks like a date rather than a
 * number or a name. Mirrors what {@link parseColumnDateValue} will do with it
 * at filter
 * time, so a column that passes here can actually be filtered.
 */
export function isDateShapedValue(
  value: string | number | null | undefined,
): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (typeof value === "number") {
    return Number.isFinite(value) && Math.abs(value) >= MIN_PLAUSIBLE_EPOCH_MS;
  }
  if (!DATE_SHAPED_STRING_PATTERN.test(value)) return false;
  return !Number.isNaN(new Date(value).getTime());
}

/** Name-shape check only — see {@link isDateRangeFilterColumn} for the verdict. */
export function hasDateLikeColumnName(column: ColumnConfig): boolean {
  if (column.id.endsWith("_by") || /\bby$/i.test(column.label)) {
    return false;
  }
  return (
    DATE_LIKE_COLUMN_PATTERN.test(column.id) ||
    DATE_LIKE_COLUMN_PATTERN.test(column.label)
  );
}

/**
 * Whether the toolbar should auto-offer a date-range filter for this column.
 *
 * Declaration beats inference: `dateLike` (either way) and `editType: "date"`
 * are answered without looking at data. Everything else falls back to the name
 * pattern — and a name match is only believed if the values the filter will
 * compare are actually date-shaped. That is what keeps "Payments Issued"
 * (money) and "Received From" (a person) out of the Filters menu while leaving
 * "Created", "Received", and "Due Date" working.
 */
export function isDateRangeFilterColumn<T>(
  column: TableColumn<T>,
  inspectedRows: readonly T[],
): boolean {
  if (typeof column.dateLike === "boolean") return column.dateLike;
  if (column.editType === "date") return true;
  if (!hasDateLikeColumnName(column)) return false;

  // Date-range filtering compares `column.sortValue(item)`; without it the
  // filter would render and then silently match nothing.
  const { sortValue } = column;
  if (!sortValue) return false;

  let sawValue = false;
  for (const item of inspectedRows) {
    const value = sortValue(item);
    if (value === null || value === undefined || value === "") continue;
    if (value === 0) {
      // An all-zero column is ambiguous from the SORTED value alone: a due-date
      // column where nothing is set yet and money on a brand-new portfolio both
      // read as 0, and the two want opposite answers.
      //
      // The raw field breaks the tie. Date columns sort unset rows as
      // `field ? new Date(field).getTime() : 0` (change orders, RFIs,
      // transmittals, drawings, meetings, …), so that 0 is COMPUTED and the
      // underlying field is absent. A column whose raw field IS 0 -- WIP's
      // "Costs To Date" on a portfolio with no billed activity -- is reporting a
      // real amount, so it counts as an observed non-date value and the column is
      // not offered.
      //
      // When `column.id` is not a key on the row (a purely derived column), the
      // raw value reads as absent and the sentinel is skipped, which is the
      // pre-existing behaviour. That is why the two WIP money columns ALSO
      // declare `dateLike: false`: declaration beats inference, and it holds even
      // where this inference cannot see the field.
      const rawValue = (item as Record<string, unknown>)[column.id];
      if (rawValue === null || rawValue === undefined || rawValue === "") {
        continue;
      }
    }
    sawValue = true;
    if (isDateShapedValue(value)) return true;
  }

  // Empty or still-loading table: keep the name's verdict so the filter is
  // there on first paint. With no rows a wrong guess filters nothing, and the
  // check re-runs the moment data arrives.
  return !sawValue;
}

/**
 * Merge declared filters with the date filters inferred by the shared table.
 *
 * An explicit empty array is an opt-out. Some workspaces own one filter query
 * across table, board, calendar, and split views, so they render that shared
 * control in a toolbar slot and pass `filters: []` to prevent the table view
 * from creating a second, date-only filter control.
 *
 * Restored 2026-09-07: 071dab33a inlined this back into the component from a
 * stale base and dropped the `filters: []` opt-out with it, so those workspaces
 * grew a second date-only control. Pinned by unified-table-date-filters.test.ts.
 */
export function resolveUnifiedTableFilters<T>({
  filters,
  columns,
  rows,
}: {
  filters?: FilterConfig[];
  columns: TableColumn<T>[];
  rows: readonly T[];
}): FilterConfig[] {
  if (filters?.length === 0) return [];

  const providedFilters = filters ?? [];
  const providedFilterIds = new Set(providedFilters.map((filter) => filter.id));
  const inspectedRows = rows.slice(0, DATE_FILTER_INSPECTED_ROW_LIMIT);
  const autoDateRangeFilters = columns
    .filter(
      (column) =>
        (column.defaultVisible !== false || column.alwaysVisible) &&
        !providedFilterIds.has(column.id) &&
        isDateRangeFilterColumn(column, inspectedRows),
    )
    .map((column) => ({
      id: column.id,
      label: column.label,
      type: "dateRange" as const,
    }));

  return [...providedFilters, ...autoDateRangeFilters];
}

function parseFilterDate(
  value: unknown,
  boundary: "start" | "end",
): number | null {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(
    boundary === "start" ? `${value}T00:00:00` : `${value}T23:59:59.999`,
  );
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
}

function parseColumnDateValue(
  value: string | number | null | undefined,
): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const date = new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
}

/**
 * Columns a generic (non-custom) view may render.
 *
 * Table-grid chrome — the expand chevron, an icon-only action column — is
 * declared with an empty label because the header cell is meant to be blank.
 * Generic split rows and fallback cards render column *values* with no header,
 * so those columns contribute nothing, and their placeholder `sortValue` (e.g.
 * `() => 0`) surfaces as a literal "0" where the headline should be. Drop them
 * before choosing what a row leads with.
 */
export function resolveGenericViewColumns<T>(
  columns: TableColumn<T>[],
): TableColumn<T>[] {
  const labeled = columns.filter((column) => Boolean(column.label));
  return labeled.length > 0 ? labeled : columns;
}

/**
 * Split-view detail pane fields: the visible columns in their table order,
 * then every other labeled column the grid is hiding. A detail pane is where
 * a hidden field is read or edited, so hiding a column from the grid never
 * hides it from the pane.
 */
export function resolveDetailPaneColumns<T>(
  allColumns: TableColumn<T>[],
  visibleColumns: TableColumn<T>[],
): TableColumn<T>[] {
  const visible = resolveGenericViewColumns(visibleColumns);
  const seen = new Set(visible.map((column) => column.id));
  const hidden = allColumns.filter(
    (column) => Boolean(column.label) && !seen.has(column.id),
  );
  return [...visible, ...hidden];
}

export function resolveGenericColumnText<T>(
  column: TableColumn<T>,
  item: T,
): string {
  const displayValue = column.displayValue?.(item) ?? column.sortValue?.(item);
  if (typeof displayValue === "string" || typeof displayValue === "number") {
    return String(displayValue);
  }
  if (item && typeof item === "object") {
    const rawValue = (item as Record<string, unknown>)[column.id];
    if (typeof rawValue === "string" || typeof rawValue === "number") {
      return String(rawValue);
    }
  }
  return "";
}

/**
 * Resolves the small set of columns shown in the primary pane of a generic
 * split view. The default remains the first meaningful column so existing
 * split pages do not change. Data-heavy review queues may opt into a compact
 * multi-column list without rebuilding the table or split-page primitives.
 */
/**
 * How many columns the split list shows when the page declares none. One was
 * the original "reading list" default, which only reads when the first column
 * is a title; on pages that lead with an id column (RFIs, submittals) it
 * rendered a bare list of numbers with nothing to choose a row by.
 */
export const DEFAULT_SPLIT_VIEW_COLUMN_COUNT = 3;

export function resolveSplitViewColumns<T>(
  columns: TableColumn<T>[],
  requestedColumnIds?: string[],
): TableColumn<T>[] {
  const genericColumns = resolveGenericViewColumns(columns);
  if (!requestedColumnIds?.length) {
    return genericColumns.slice(0, DEFAULT_SPLIT_VIEW_COLUMN_COUNT);
  }

  const columnsById = new Map(
    genericColumns.map((column) => [column.id, column]),
  );
  const requestedColumns = requestedColumnIds
    .map((columnId) => columnsById.get(columnId))
    .filter((column): column is TableColumn<T> => Boolean(column));

  return requestedColumns.length > 0
    ? requestedColumns
    : genericColumns.slice(0, DEFAULT_SPLIT_VIEW_COLUMN_COUNT);
}

type TableScrollEdges = { left: boolean; right: boolean };

const NO_SCROLL_EDGES: TableScrollEdges = { left: false, right: false };

function sameScrollEdges(
  left: TableScrollEdges,
  right: TableScrollEdges,
): boolean {
  return left.left === right.left && left.right === right.right;
}

// Compare string arrays by value to prevent redundant state updates that can trigger render loops.
function areStringArraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

type SortableHandleProps = {
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
  isDragging: boolean;
};

function SortableColumnHead({
  id,
  disabled,
  className,
  style,
  ariaSort,
  traceState,
  onClick,
  onContextMenu,
  children,
}: {
  id: string;
  disabled: boolean;
  className?: string;
  style?: React.CSSProperties;
  ariaSort?: React.AriaAttributes["aria-sort"];
  traceState?: "active" | "precedent";
  onClick?: () => void;
  onContextMenu?: React.MouseEventHandler<HTMLTableCellElement>;
  children: (handleProps: SortableHandleProps) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
  });

  const resolvedStyle: React.CSSProperties = {
    ...style,
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 3 : style?.zIndex,
    opacity: isDragging ? 0.92 : style?.opacity,
  };

  return (
    <TableHead
      ref={setNodeRef}
      className={className}
      style={resolvedStyle}
      aria-sort={ariaSort}
      data-column-trace={traceState}
      onClick={onClick}
      onContextMenu={onContextMenu}
      data-dragging={isDragging ? "true" : "false"}
    >
      {children({ attributes, listeners, isDragging })}
    </TableHead>
  );
}

/**
 * The internal column store is keyed by page title. Two tables that share a
 * title (tabs on one page) therefore share a stored list, and a list saved by
 * one can name columns the other does not have. Applying it verbatim blanks
 * the table down to whatever ids happen to overlap — on /activity that was a
 * single "Who" column. Keep only ids this table knows; if nothing but the
 * always-visible columns survives, the list was written by a different table
 * and the caller falls back to defaults.
 *
 * Restored 2026-09-07 after 071dab33a deleted it from a stale base, which put
 * the blank-table bug back for anyone carrying a saved list. Pinned by
 * reconcile-stored-columns.test.ts.
 */
export function reconcileStoredColumns(
  stored: string[],
  columns: ReadonlyArray<{ id: string; alwaysVisible?: boolean }>,
): string[] | null {
  const known = new Set(columns.map((column) => column.id));
  const usable = stored.filter((id) => known.has(id));
  const optional = usable.filter(
    (id) => !columns.find((column) => column.id === id)?.alwaysVisible,
  );
  return optional.length > 0 ? usable : null;
}

interface TabItem {
  label: string;
  href: string;
  count?: number;
  isActive?: boolean;
  testId?: string;
  countTestId?: string;
}

export interface BulkEditableColumnConfig {
  /** Label used in the bulk workflow when the table header is too abbreviated. */
  label?: string;
  placeholder?: string;
  searchable?: boolean;
  allowClear?: boolean;
  /**
   * Must be declared for every opted-in field. Plain-text overwrites use true
   * so the dialog can name the replacement consequence; structured values use false.
   */
  destructiveReplacement: boolean;
}

export interface TableColumn<T> extends ColumnConfig {
  /**
   * Opt-in for "edit selected". Restored 2026-09-07: 071dab33a reverted this
   * file from a stale base and dropped the gate, so EVERY inline-editable
   * column silently became bulk-overwritable across the app.
   */
  bulkEditable?: BulkEditableColumnConfig;
  render: (item: T) => ReactNode;
  /** Optional row-level authorization gate for inline editing. */
  isEditable?: (item: T) => boolean;
  /** Optional header control supplied by the domain owner. */
  headerAccessory?: ReactNode;
  /**
   * Spreadsheet-style output/input emphasis shared by lineage-aware tables.
   * Restored 2026-09-08: dropped by the same stale-base revert (071dab33a).
   */
  traceState?: "active" | "precedent";
  /**
   * Plain-text value used by generic list, split, and card views.
   * Keep this separate from `sortValue`: sortable dates and amounts often use
   * numeric values, while review surfaces need human-readable text.
   */
  displayValue?: (item: T) => string | number | null | undefined;
  csvValue?: (item: T) => string;
  /**
   * Leave this column out of the auto-built CSV when its csvValue is empty in
   * every exported row, so an export never carries a column of blanks for a
   * field no row has recorded. The column returns once any row has a value.
   */
  csvOmitWhenEmpty?: boolean;
  /**
   * Value the filter engine compares against for this column. Defaults to
   * `sortValue`, then `csvValue`, then `editValue` — so most columns are
   * filterable with no extra wiring. Declare it when the comparable value
   * differs from the sortable one (e.g. an id-backed column rendered as a name).
   */
  filterValue?: (item: T) => unknown;
  sortable?: boolean;
  showSortIcon?: boolean;
  sortValue?: (item: T) => string | number | null | undefined;
  align?: "left" | "center" | "right";
  /**
   * Inline editing is opt-in per column. Keep identifier/name columns as links
   * and mark operational fields editable so table views can update records in place.
   */
  editable?: boolean;
  editValue?: (item: T) => string;
  /**
   * Return `false` to cancel an inline commit without replacing the rendered
   * value or showing a misleading success toast. This is for workflows that
   * need a confirmation before a high-impact field change takes effect.
   */
  onEdit?: (item: T, value: string) => void | boolean | Promise<void | boolean>;
  editEmptyLabel?: string;
  editInputType?: React.HTMLInputTypeAttribute;
  /** Spreadsheet navigation between visible, unlocked rows; opt-in only. */
  editNavigation?: boolean;
  /** Revert the domain value (for example to a price-list baseline) on Escape. */
  onRevert?: (item: T) => void;
  /**
   * "cell" lets the whole cell enter edit mode. "icon" keeps rendered content
   * available for row/detail navigation and only opens editing from the pencil.
   * Name columns default to "icon".
   */
  editTrigger?: "cell" | "icon";
  /**
   * Declarative inline editor type. The component renders the matching editor
   * centrally — no per-column `renderEditor` needed:
   *  - "text" (default) / "number" / "date" → `<Input>` (also honours `editInputType`)
   *  - "select" → `InlineSelectEditor` driven by `editOptions`
   *  - "boolean" → `InlineSelectEditor` with Yes/No (or custom `editOptions`)
   * Use `renderEditor` only for genuinely custom widgets.
   */
  editType?: "text" | "number" | "date" | "boolean" | "select";
  /** Options for `editType: "select"`. For "boolean" these override the Yes/No default. */
  editOptions?: { value: string; label: string }[];
  /** Preferred column width in pixels. Applied as default when the user has not manually resized. */
  width?: number;
  /** Custom editor widget (e.g. dropdown select). Receives current value, onChange, onCommit, and onCancel. */
  renderEditor?: (props: {
    item: T;
    value: string;
    onChange: (value: string) => void;
    onCommit: (value?: string) => void;
    onCancel: () => void;
    onNavigate: (direction: 1 | -1, value?: string) => void;
  }) => ReactNode;
}

export function shouldUseIconOnlyInlineEdit<T>(
  column: Pick<TableColumn<T>, "id" | "editTrigger">,
) {
  return column.editTrigger
    ? column.editTrigger === "icon"
    : column.id === "name";
}

/**
 * Derives the bulk-edit field list from a table's columns. Any column that is
 * declaratively editable (`editable` + an `onEdit` handler) becomes a bulk-edit
 * field, so a standard editable table gets "edit selected" for free. Select and
 * select columns need `editOptions` to render a value picker. Boolean columns
 * use the shared Yes/No options when no explicit options are supplied. Columns
 * relying on a custom `renderEditor` are skipped (no generic picker exists).
 */
/**
 * Derives bulk-edit fields only from columns that deliberately opt in through
 * `bulkEditable`. Inline `editable` is necessary for the generic write adapter,
 * but it is never authorization for a bulk overwrite. Select columns need
 * `editOptions`; boolean columns use the shared Yes/No options. Columns relying
 * on a custom `renderEditor` are skipped because no generic bulk picker exists.
 */
export function deriveBulkEditFields<T>(
  columns: TableColumn<T>[],
  enabled = true,
): BulkEditField<T>[] {
  if (!enabled) return [];
  return columns
    .filter(
      // A type predicate (not a plain boolean) is what lets the `.map()` below
      // see `editValue` as always-defined across the filter -> map chain.
      (column): column is TableColumn<T> & { editValue: (item: T) => string } =>
        column.bulkEditable !== undefined &&
        column.editable === true &&
        typeof column.onEdit === "function" &&
        typeof column.editValue === "function" &&
        (column.editType === "text" ||
          column.editType === "number" ||
          column.editType === "date" ||
          (column.editType === "select" && Array.isArray(column.editOptions)) ||
          column.editType === "boolean"),
    )
    .map((column) => {
      const isSelect =
        column.editType === "select" || column.editType === "boolean";
      return {
        id: column.id,
        label: column.bulkEditable?.label ?? column.label,
        type: isSelect ? "select" : "text",
        options: isSelect
          ? column.editType === "boolean"
            ? (column.editOptions ?? BOOLEAN_EDIT_OPTIONS)
            : column.editOptions
          : undefined,
        inputType:
          column.editInputType ??
          (column.editType === "date"
            ? "date"
            : column.editType === "number"
              ? "number"
              : "text"),
        placeholder: column.bulkEditable?.placeholder,
        searchable: column.bulkEditable?.searchable,
        allowClear: column.bulkEditable?.allowClear,
        destructiveReplacement:
          column.bulkEditable?.destructiveReplacement ?? false,
        getValue: column.editValue,
      } satisfies BulkEditField<T>;
    });
}

type TableColumnAlignment = "left" | "center" | "right";
/** Where an inline editor was opened: the grid cell or the row's detail pane. */
type InlineEditSurface = "grid" | "pane" | "mobile";

// Identifiers win over money words: "Payment #", "payment_number", "Check #",
// "Invoice Ref" are record numbers, not amounts, and read left-aligned like
// any other text (owner correction 2026-09-04: a right-aligned payment number
// was being read as a currency value). A bare "#" therefore counts as text.
//
// Restored 2026-09-07: 071dab33a ("Make table pages consistently light") wrote
// this file back from a stale base and reverted the correction along with the
// export below. Pinned by column-alignment.test.ts.
const TEXT_LIKE_ALIGNMENT_PATTERN =
  /(^|[_\s-])(title|name|description|reason|origin|status|scope|type|date|period|created|updated|sent|due|closed|opened|numbers?|nbr|no|ref|refs?|references?|ids?|codes?|keys?|#)([_\s-]|$)/i;

const NUMERIC_LIKE_ALIGNMENT_PATTERN =
  /(^|[_\s-])(amounts?|totals?|subtotals?|balances?|costs?|values?|prices?|rates?|revenues?|budgets?|commitments?|paid|payments?|retainages?|over_under|rom|qty|quantities?|percents?|percentages?|counts?|hours?|days?|scores?|variances?|forecasts?|estimates?|estimated|actuals?|projected|remaining|income|expenses?|billed|earned|gross|net|profits?|margins?|wip|billing|changes?|orders?)([_\s-]|$)|[$%]/i;

export function resolveColumnAlignment<T>(
  column: TableColumn<T>,
  fallback: TableColumnAlignment,
): TableColumnAlignment {
  if (column.align) return column.align;

  // Normalize camelCase to space-separated so "contractValue" → "contract Value"
  const searchable = `${column.id} ${column.label}`.replace(
    /([a-z])([A-Z])/g,
    "$1 $2",
  );
  if (TEXT_LIKE_ALIGNMENT_PATTERN.test(searchable)) return fallback;
  if (NUMERIC_LIKE_ALIGNMENT_PATTERN.test(searchable)) return "right";

  return fallback;
}

export type SortDirection = "asc" | "desc";

export interface UnifiedTableFeatures {
  enableSorting?: boolean;
  enablePagination?: boolean;
  enableSearch?: boolean;
  enableViews?: boolean;
  enableFilters?: boolean;
  enableColumnToggle?: boolean;
  enableExport?: boolean;
  enableBulkDelete?: boolean;
  enableBulkEdit?: boolean;
  enableRowSelection?: boolean;
  enableRowActions?: boolean;
  enableColumnReorder?: boolean;
  enableRowReorder?: boolean;
  enableColumnPinning?: boolean;
  enableVirtualization?: boolean;
  enableInlineEditing?: boolean;
}

export interface UnifiedTablePageProps<T> {
  header: {
    title: string;
    eyebrow?: ReactNode;
    description?: ReactNode;
    /**
     * Small muted text rendered on the SAME line as the title, after it.
     *
     * For a fact about the data as a whole that qualifies the title — when it
     * was last synced from an upstream system, say. `description` sits below
     * the title and is suppressed at compact density; this stays beside the
     * title at every density, which is where a freshness stamp has to be to be
     * read at all.
     */
    titleMeta?: ReactNode;
    /**
     * Raw controls — the slot pages are leaving. Describe the actions instead (`primary`,
     * `headerActions`, `overflow`, `headerExtras`) so the header renders them
     * the same on every list page; the list of pages still on this slot is
     * frozen by `list-header-actions-contract.test.ts`.
     */
    actions?: ReactNode;
    /** Shared compact creation action; one option acts directly, multiple options open a menu. */
    create?: {
      options: TablePageActionItem[];
      label?: string;
      buttonLabel?: string;
      testId?: string;
    };
    /** The one labeled button: the workflow's create/primary verb. */
    primary?: HeaderPrimaryAction;
    /** Icon controls (settings, export, sync); the header owns their look. */
    headerActions?: HeaderAction[];
    /** The ⋮ items. */
    overflow?: HeaderMenuItem[];
    /**
     * Icon controls that own their own surface (a dialog trigger built on
     * `HeaderIconButton`), rendered among the icon actions.
     */
    headerExtras?: ReactNode;
    variant?: "default" | "compact";
    mobileActionsInline?: boolean;
    titleClassName?: string;
    /** Keep title available for storage/export/reporting, but hide the visual page header. */
    hidden?: boolean;
  };
  tabs?: TabItem[];
  toolbar: {
    totalItems: number;
    filteredItems: number;
    /** Singular noun for the toolbar count ("photo" -> "37 photos"); defaults to "row". */
    itemNoun?: string;
    /**
     * @deprecated Selection count is derived from the active selectedIds owner.
     * Retained only so existing callers compile while they remove this duplicate
     * projection.
     */
    selectedCount?: number;
    searchValue: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
    currentView?: ViewMode;
    onViewChange?: (view: ViewMode) => void;
    /**
     * Standard views are available by default. Use exclusions when a workflow
     * cannot support a view, instead of rebuilding an allowlist on each page.
     */
    excludedViews?: ViewMode[];
    /** @deprecated Prefer `excludedViews`; retained for existing explicit exceptions. */
    enabledViews?: ViewMode[];
    /**
     * Views the PAGE renders itself, outside this component's own renderers.
     * They appear in the shared view switcher and report selection through
     * `onViewChange`, but never become the rendered view here — so a surface
     * that already owns, say, its own list/detail split can offer "Split" as a
     * normal view icon instead of bolting a stray toggle onto the toolbar.
     * Drive the highlighted icon by passing that mode as `currentView`.
     */
    pageOwnedViews?: ViewMode[];
    /** Use the shared icon-only view switcher variant for dense toolbars. */
    viewSwitcherDisplay?: "default" | "icons";
    filters?: FilterConfig[];
    activeFilters?: Record<
      string,
      string | number | boolean | string[] | null | undefined
    >;
    onFilterChange?: (
      filters: Record<
        string,
        string | number | boolean | string[] | null | undefined
      >,
    ) => void;
    onClearFilters?: () => void;
    /**
     * Rule-based filter query (multi-value, negation, AND/OR). Optional: when a
     * page supplies it — normally from `useUnifiedTableState` so the rules live
     * in the URL — the toolbar renders the rule builder. When it is omitted and
     * every row is already in memory, `UnifiedTablePage` keeps the query itself,
     * so client-side tables get the rule builder with no page changes.
     */
    filterQuery?: FilterQuery;
    onFilterQueryChange?: (query: FilterQuery) => void;
    /**
     * Filter fields this page's list endpoint can filter server-side. Required
     * to enable rules on a server-paginated table: rows the server did not
     * return cannot be filtered here, so anything not declared is disabled in
     * the builder rather than applied to one page and reported as the whole set.
     */
    serverFilterFields?: string[];
    columns?: ColumnConfig[];
    visibleColumns?: string[];
    onColumnVisibilityChange?: (columns: string[]) => void;
    savedViewsDefaults?: {
      visibleColumns: string[];
      columnOrder?: string[];
      columnWidths?: Record<string, number>;
      sortBy: string | null;
      sortDirection: SortDirection;
      filters: Record<
        string,
        string | number | boolean | string[] | null | undefined
      >;
    };
    onExport?: () => void;
    onBulkDelete?: () => void;
    /** Non-delete operation on selected rows; the shared toolbar owns its presentation. */
    selectedAction?: TableToolbarProps["selectedAction"];
    /**
     * Row-grouping options. When provided with `onGroupByChange`, the toolbar
     * renders a global icon-only "Group by" control in the icon row. The first
     * option should be the "no grouping" choice.
     */
    groupByOptions?: readonly { value: string; label: string }[];
    groupBy?: string | null;
    onGroupByChange?: (value: string) => void;
    mobilePanelActions?: ReactNode;
    /** Extra action buttons rendered in the toolbar icon row (e.g. ERP sync) */
    customActions?: ReactNode;
    /**
     * Actions rendered at the START of the toolbar icon row, before search.
     * Use for actions on the data itself (e.g. pulling records in from an
     * upstream system); `customActions` trails the display controls.
     */
    leadingActions?: ReactNode;
    /** Content rendered on the left of the toolbar row, with icons pushed to the right */
    leftContent?: ReactNode;
    /** Render the toolbar into an external DOM node instead of the default toolbar row. */
    portalContainerId?: string;
    /**
     * Stable identifier for this table when saving views (e.g. "meetings").
     * Set this to enable the per-user "Saved views" picker. Project-agnostic —
     * a view created on project A's page applies on project B's page too.
     */
    savedViewsScope?: string;
    /** Built-in views shown before the user's saved views. Ids must start with `builtin:`. */
    savedViewsBuiltin?: readonly SavedTableView[];
  };
  data: {
    items: T[];
    isLoading: boolean;
    isFetching?: boolean;
    error?: Error | null;
  };
  table: {
    columns: TableColumn<T>[];
    defaultPinnedLeftColumns?: string[];
    defaultPinnedRightColumns?: string[];
    rowActions?: (item: T) => ReactNode;
    /** Called when user clicks View in the default row-actions menu. */
    onView?: (item: T) => void;
    /** Specific wording when a row opens a named live surface. */
    viewLabel?: string;
    /** Inline append affordance rendered once per visible group. */
    newRow?: {
      placeholder?: string;
      onCreate: (
        text: string,
        groupValue: string | null,
      ) => void | Promise<void>;
    };
    /** Shared opt-in table row grouping. */
    grouping?: {
      getGroupValue: (item: T) => string;
      getGroupLabel?: (groupValue: string) => string;
      /** Return false to omit a redundant header for a specific group. */
      shouldRenderGroupHeader?: (groupValue: string) => boolean;
      getGroupFooter?: (items: T[], groupValue: string) => ReactNode;
      /** Add a small visual gap between a group's subtotal and the next group. */
      groupFooterGap?: "sm" | "md";
      labelColumnId?: string;
      collapsible?: boolean;
      /** Domain status stays visible while the group is collapsed. */
      getGroupStatus?: (items: T[], groupValue: string) => ReactNode;
      indentItems?: boolean;
      onMoveToGroup?: (
        item: T,
        targetGroupValue: string,
      ) => void | Promise<void>;
    };
    /** Called when user clicks Edit in the default row-actions menu. */
    onEdit?: (item: T) => void;
    /** Hide Edit on rows this returns false for. Defaults to showing Edit whenever `onEdit` is set. */
    allowEdit?: (item: T) => boolean;
    /** Called when user clicks Delete in the default row-actions menu. When provided without custom rowActions, renders a default "⋯" dropdown with View/Edit/Delete as available. */
    onDelete?: (item: T) => void;
    /** Hand selected visible rows to the data owner in one request. */
    onDeleteBatch?: (items: T[]) => void;
    /** Domain wording for the existing delete confirmations. */
    deleteCopy?: { noun: string; pluralNoun?: string; description?: string };
    /** Hide Delete on rows this returns false for. Defaults to showing Delete whenever `onDelete` is set. */
    allowDelete?: (item: T) => boolean;
    getRowId: (item: T) => string;
    /**
     * Bulk edit — update one field across every selected row at once. When
     * omitted, the table auto-derives editable fields from columns marked
     * `editable` with an `onEdit` handler (select/text/number/date), applying
     * the value per-row via `column.onEdit`. Supply this to override the field
     * list and/or provide an efficient batched write (a single UPDATE … IN).
     */
    bulkEdit?: {
      fields?: BulkEditField<T>[];
      onApply?: (
        fieldId: string,
        value: BulkEditValue,
        selectedIds: string[],
      ) => void | Promise<void>;
      /** Applies every changed field in one request when the data owner supports it. */
      onApplyBatch?: (
        changes: Record<string, BulkEditValue>,
        selectedIds: string[],
      ) => void | Promise<void>;
      /** Singular domain noun (e.g. "meeting" or "review item"). Defaults to "item". */
      itemNoun?: string;
      /** Compact, truthful context for the expandable selection preview. */
      getItemLabel?: (item: T) => string;
      getItemContext?: (item: T) => string | null | undefined;
      selectionContextNoun?: string;
      /** Clear the selection after a successful apply (default: false). */
      clearSelectionOnApply?: boolean;
    };
    onRowClick?: (item: T) => void;
    /**
     * Hide the click affordance (cursor, hover, keyboard activation) and skip
     * `onRowClick` on rows this returns false for. Defaults to clickable
     * whenever `onRowClick` is set — same convention as `allowEdit`/`allowDelete`.
     */
    allowRowClick?: (item: T) => boolean;
    activeRowId?: string | null;
    /**
     * Compact columns shown in the generic split-view list, primary first.
     * Omit to show the first three visible columns; declare them when the
     * table leads with an id so the title column takes the wide slot.
     */
    splitColumns?: string[];
    /** Side-panel detail is the default. Use page for records too deep for contextual detail. */
    detailPresentation?: "panel" | "page";
    onTableKeyDown?: (
      event: React.KeyboardEvent<HTMLDivElement>,
      visibleItems: T[],
    ) => void;
    autoFocusOnLoad?: boolean;
    /**
     * Make every `column.width` an exact pixel width from first paint, instead
     * of the ratio `table-layout: auto` turns it into. Size every column to pin
     * the table to their total; leave one unsized to say which one absorbs the
     * surplus on a wide monitor. See `resolveTableGeometry`.
     */
    fixedColumnWidths?: boolean;
    stickyHeader?: boolean;
    /** Draft forms own their values; do not cache them or announce a persisted update. */
    controlledInlineEditing?: boolean;
    /** Shared whole-row focus treatment, with emphasis on the identifying column. */
    highlightEditingRow?: boolean;
    onRowOrderChange?: (orderedRowIds: string[]) => void;
    /** Density preset. "compact" applies tighter padding and smaller text. */
    density?: "default" | "compact";
    /** Render an expandable sub-row below a table row. Return null to skip. */
    renderExpandedRow?: (
      item: T,
      colSpan: number,
      context?: {
        columns: Array<{
          id: string;
          width?: number;
          align?: TableColumnAlignment;
        }>;
        hasSelection: boolean;
        hasActions: boolean;
      },
    ) => ReactNode | null;
  };
  sorting?: {
    sortBy: string | null;
    sortDirection: SortDirection;
    onSortChange: (sortBy: string, direction: SortDirection) => void;
  };
  selection?: {
    selectedIds: string[];
    /**
     * `visibleIds` carries the rows left visible by the active filter rules.
     * Parents that own selection should prefer it over their own list, so
     * select-all cannot reach a row the user cannot see.
     */
    onSelectAll: (checked: boolean, visibleIds?: string[]) => void;
    onSelectRow: (id: string, checked: boolean) => void;
  };
  views?: {
    board?: (context: {
      items: T[];
      getRowId: (item: T) => string;
      activeRowId?: string | null;
      onRowClick?: (item: T) => void;
    }) => ReactElement;
    card?: (item: T) => ReactElement;
    list?: (item: T) => ReactElement;
    split?: (context: {
      items: T[];
      getRowId: (item: T) => string;
      activeRowId?: string | null;
      selectedIds: string[];
      onSelectRow?: (id: string, checked: boolean) => void;
      onSelectAll?: (checked: boolean, visibleIds?: string[]) => void;
      onRowClick?: (item: T) => void;
    }) => ReactElement;
    calendar?: (context: {
      items: T[];
      getRowId: (item: T) => string;
      activeRowId?: string | null;
      onRowClick?: (item: T) => void;
    }) => ReactElement;
    timeline?: (context: {
      items: T[];
      getRowId: (item: T) => string;
      activeRowId?: string | null;
      onRowClick?: (item: T) => void;
    }) => ReactElement;
    /** Group card items by a key. Returns the group label string (or "Ungrouped"). */
    cardGroupBy?: (item: T) => string;
  };
  emptyState: {
    title: string;
    description: string;
    filteredDescription: string;
    isFiltered: boolean;
    icon?: ReactNode;
    action?: ReactNode;
  };
  pagination?: {
    page: number;
    totalPages: number;
    perPage: number;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: string) => void;
    clientSide?: boolean;
  };
  footerTotals?: {
    /** Label shown in the first visible column (default: "Totals") */
    label?: string;
    /** Map of column ID → rendered value for the footer row */
    values: Record<string, ReactNode>;
  };
  topContent?: ReactNode;
  /**
   * Like `topContent`, but still renders while the table query is loading or
   * errored — for banners that fetch independently of the table body.
   */
  persistentTopContent?: ReactNode;
  /** Content rendered below the table and its pagination controls. */
  bottomContent?: ReactNode;
  sidePanel?: {
    /**
     * Whole-pane replacement. Omit it: the pane then renders every labeled
     * column through the same editable-value path as the grid cell
     * (DESIGN.md §5 — a value that edits in one surface edits in every
     * surface that shows it). Supplying `content` means the page owns a
     * second field config for the same record and its edits will not reach
     * the pane; reserve it for a genuinely non-record surface.
     */
    content?: ReactNode;
    /**
     * Compound workspace appended BELOW the shared column fields: comments,
     * files, runs, a conversation. The record's plain fields still come from
     * the column config, never from here.
     */
    body?: ReactNode;
    /** Shared panel header title. */
    title?: ReactNode;
    /** Contextual record actions rendered in the desktop and mobile panel header. */
    headerActions?: ReactNode;
    /** Semantic width preset. Geometry remains owned by UnifiedTablePage. */
    size?: "standard" | "wide";
    /** Standard owns shared gutters; full-bleed is for compound reading/workspace panels. */
    bodyLayout?: TableSidePanelBodyLayout;
    /** Show collapse toggle (default: true) */
    collapsible?: boolean;
    /** Show drag handle for resizing (default: true) */
    resizable?: boolean;
    /** Show the built-in desktop close button row (default: true when onClose is supplied). */
    showCloseButton?: boolean;
    /** localStorage key suffix for persisting width/collapsed state */
    storageKey?: string;
    /** Called when the details panel closes. */
    onClose?: () => void;
    /** Label used by the mobile full-screen panel header. */
    mobileTitle?: string;
    /** Arrow navigation is default-on. Set false only for a conflicting workflow. */
    keyboardNavigation?: boolean;
  };
  layout?: {
    fullBleedTable?: boolean;
    alignHeaderWithFullBleedTable?: boolean;
    removeTableFrame?: boolean;
    plainFooterTotals?: boolean;
    headerAlignment?: "left" | "center";
    toolbarInlineWithHeader?: boolean;
    /**
     * Keep the toolbar (search/filter/column/export icons) on the SAME row as
     * the tabs at every width, instead of the default (icons drop into the
     * header row below `lg`). Only meaningful when `tabs` are provided.
     */
    toolbarWithTabs?: boolean;
    maxWidth?: PageContainerProps["maxWidth"];
    containerClassName?: string;
    /** Override the card-view grid className (default: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4) */
    cardGridClassName?: string;
    /** Remove PageContainer horizontal/vertical padding (default: true) */
    containerPadding?: boolean;
    /** Minimum desktop table width in pixels. Use when columns should scroll horizontally instead of compressing. */
    minWidth?: number;
    /** Hide the built-in table/empty/pagination body when topContent owns a custom table body. */
    hideTableBody?: boolean;
    /**
     * Hide the shared table toolbar when the embedding surface provides its
     * controls elsewhere (for example, beside its section heading).
     */
    hideToolbar?: boolean;
    /**
     * Let the desktop table's horizontal scroll area run into the page's right
     * gutter so a clipped trailing column reads as scrollable (default: true).
     * Set false only when the table is NOT inside a standard page gutter — the
     * bleed assumes the px-4/sm:px-6/lg:px-8 scale and would overflow without it.
     */
    bleedRight?: boolean;
  };
  features?: UnifiedTableFeatures;
  columnGroups?: Array<{ label: string; columnIds: string[] }>;
  /**
   * Optional context embedded as a metadata header in CSV exports. Provides
   * report title, project identification, and any extra fields (filters,
   * exported-by user, etc.). Applies only to the auto-built CSV exporter —
   * a custom `toolbar.onExport` overrides everything.
   */
  reportContext?: {
    projectId?: number | string;
    projectName?: string;
    projectNumber?: string | number;
    projectDescription?: string;
    /** Person triggering the export (defaults to omitted) */
    exportedBy?: string;
    /** Any extra key/value rows appended after the standard metadata block */
    extra?: Record<string, string | number | null | undefined>;
  };
}

// A hidden header has no mobile toolbar slot. Keep its sole above-table
// toolbar reachable at every width; visible headers retain their mobile slot.
export function aboveTableToolbarClassName(
  headerHidden: boolean | undefined,
): string {
  return headerHidden
    ? "flex min-w-0 justify-end"
    : TABLE_ABOVE_TABLE_TOOLBAR_CLASSNAME;
}

/**
 * A toolbar cannot be rendered inline with a header that is intentionally hidden.
 * Embedded/tabbed tables therefore fall back to the standard above-table toolbar.
 */
export function shouldPlaceToolbarInlineWithHeader(
  headerHidden: boolean | undefined,
  requestedInlinePlacement: boolean | undefined,
): boolean {
  if (headerHidden) return false;
  return requestedInlinePlacement ?? true;
}

export function TableExpandedRow({
  colSpan,
  className,
  children,
}: {
  colSpan: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className={cn("p-0", className)}>
        {children}
      </TableCell>
    </TableRow>
  );
}

export function UnifiedTableGroupFooterRow<T>({
  columns,
  label,
  renderCell,
}: {
  columns: TableColumn<T>[];
  label: string;
  renderCell: (column: TableColumn<T>, index: number) => ReactNode;
}) {
  return (
    <TableRow className="font-semibold hover:bg-transparent">
      {columns.map((column, index) => (
        <TableCell
          key={column.id}
          className={
            column.align === "right" ? "text-right tabular-nums" : undefined
          }
        >
          {index === 0 ? label : renderCell(column, index)}
        </TableCell>
      ))}
    </TableRow>
  );
}

function UnifiedTableNewRow({
  colSpan,
  placeholder,
  groupValue,
  onCreate,
}: {
  colSpan: number;
  placeholder?: string;
  groupValue: string | null;
  onCreate: (text: string, groupValue: string | null) => void | Promise<void>;
}) {
  const [draft, setDraft] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const submit = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      await onCreate(text, groupValue);
      setDraft("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="py-1 pl-0 sm:pl-0">
        <Input
          type="text"
          aria-label="Add an item"
          value={draft}
          disabled={busy}
          placeholder={placeholder ?? "Add an item…"}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void submit();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setDraft("");
            }
          }}
          onBlur={() => void submit()}
          className="h-auto w-full rounded-sm border-transparent bg-transparent px-4 py-1.5 text-sm text-foreground shadow-none placeholder:text-muted-foreground/70 hover:bg-muted/40 focus:bg-background focus-visible:ring-1"
        />
      </TableCell>
    </TableRow>
  );
}

export function UnifiedTablePage<T>({
  header,
  tabs,
  toolbar,
  data,
  table,
  sorting,
  selection,
  views,
  emptyState,
  pagination,
  footerTotals,
  topContent,
  persistentTopContent,
  bottomContent,
  sidePanel,
  layout,
  features,
  columnGroups,
  reportContext,
}: UnifiedTablePageProps<T>): ReactElement {
  const {
    PageHeader,
    PageTabs,
    HeaderActions,
    SectionRuleHeading,
    BulkEditDialog,
    useTableSidePanelController,
    readUnifiedTablePreferences,
    saveUnifiedTablePreferences,
    reportNonCriticalFailure,
    toast,
    storage,
  } = useTableHost();
  const readStoredPerPage = () => readUnifiedTablePreferences().perPage ?? 25;
  const readStoredPaginationBehavior = () => readUnifiedTablePreferences().paginationBehavior ?? "pages";
  const resolvedFeatures: Required<UnifiedTableFeatures> = {
    enableSorting: features?.enableSorting ?? true,
    enablePagination: features?.enablePagination ?? true,
    enableSearch: features?.enableSearch ?? true,
    enableViews: features?.enableViews ?? true,
    enableFilters: features?.enableFilters ?? true,
    enableColumnToggle: features?.enableColumnToggle ?? true,
    enableExport: features?.enableExport ?? true,
    enableBulkDelete: features?.enableBulkDelete ?? true,
    enableBulkEdit: features?.enableBulkEdit ?? true,
    enableRowSelection: features?.enableRowSelection ?? true,
    enableRowActions: features?.enableRowActions ?? true,
    enableColumnReorder: features?.enableColumnReorder ?? true,
    enableRowReorder: features?.enableRowReorder ?? true,
    enableColumnPinning: features?.enableColumnPinning ?? true,
    enableVirtualization: features?.enableVirtualization ?? false,
    // Inline editing is ON by default across all tables. It only ever activates
    // on columns explicitly marked `editable`, so this default is a no-op for
    // tables that have not opted a column in — it removes the "forgot the flag"
    // footgun, NOT a free-for-all. Pass `enableInlineEditing: false` to opt out.
    enableInlineEditing: features?.enableInlineEditing ?? true,
  };
  // Internal sort state — used when the parent does not supply a sorting prop
  const [internalSortBy, setInternalSortBy] = React.useState<string | null>(
    null,
  );
  const [internalSortDirection, setInternalSortDirection] =
    React.useState<SortDirection>("asc");
  // Internal pagination state — used when the parent does not supply a pagination prop
  const [internalPage, setInternalPage] = React.useState(1);
  // Saved preferences live in localStorage, which the server cannot read:
  // hydration renders the server values, the saved ones apply right after
  // (useStoredPreference; 2026-09-23 React #418 on every table page for a
  // browser that had saved 25 rows).
  const [internalPerPage, setInternalPerPage] = useStoredPreference(
    readStoredPerPage,
    25,
  );
  const [paginationBehavior, setPaginationBehavior] =
    useStoredPreference<TablePaginationBehavior>(
      readStoredPaginationBehavior,
      "pages",
    );
  const groupingConfig = table.grouping ?? null;
  const shouldClientPaginate =
    !groupingConfig &&
    (pagination?.clientSide ||
      (!pagination && resolvedFeatures.enablePagination));
  const activePage = pagination?.page ?? internalPage;
  const activePerPage = pagination?.perPage ?? internalPerPage;
  // "Continue on scroll" accumulates pages client-side, so it can only work
  // when the table can tell an in-flight page from an arrived one. A
  // server-paginated table that reports no fetch state cannot: `page` advances
  // immediately while `items` stays put, so the sentinel keeps asking for more
  // and the table re-renders until React aborts it ("Maximum update depth
  // exceeded", minified error #185) — which blanked /daily-logs and
  // /daily-reports for anyone whose saved preference was "Continue on scroll".
  // Such a table stays on pages until it opts in by reporting `isFetching`.
  const supportsContinuousLoading =
    !pagination ||
    pagination.clientSide === true ||
    data.isFetching !== undefined;
  const shouldContinuouslyLoad =
    paginationBehavior === "scroll" &&
    resolvedFeatures.enablePagination &&
    supportsContinuousLoading;
  const canLoadAnotherPage =
    shouldContinuouslyLoad &&
    activePage <
      (pagination?.totalPages ??
        Math.max(1, Math.ceil(data.items.length / activePerPage)));
  const [loadedServerItems, setLoadedServerItems] = React.useState<T[]>([]);
  const autoLoadSentinelRef = React.useRef<HTMLDivElement | null>(null);
  const autoLoadRequestRef = React.useRef(false);
  const lastLoadedServerPageRef = React.useRef<{
    page: number;
    items: T[];
  } | null>(null);
  const getRowIdRef = React.useRef(table.getRowId);
  const appliedControlledRowPreferenceRef = React.useRef(false);
  getRowIdRef.current = table.getRowId;

  // Most tables use useUnifiedTableState, which reads this preference before
  // the first request. This covers the remaining controlled consumers so a
  // page-local default cannot silently defeat the global row-count choice.
  React.useEffect(() => {
    if (!pagination || appliedControlledRowPreferenceRef.current) return;
    appliedControlledRowPreferenceRef.current = true;
    const preferredPerPage = readUnifiedTablePreferences().perPage;
    if (preferredPerPage && preferredPerPage !== pagination.perPage) {
      pagination.onPerPageChange(String(preferredPerPage));
    }
  }, [pagination]);

  React.useEffect(() => {
    if (
      !shouldContinuouslyLoad ||
      shouldClientPaginate ||
      data.isLoading ||
      data.isFetching
    ) {
      return;
    }
    // Identical rows mean the page the auto-loader just asked for has not
    // arrived yet — a controlled table advances `page` immediately, while its
    // rows only change once the server answers. Stamping the new page number
    // here would tell the reset effect below that the request completed, so the
    // sentinel could ask for another page on the very next commit, and another,
    // until React aborted the render ("Maximum update depth exceeded",
    // minified error #185). Comparing the page too defeats the guard for
    // exactly the case it exists to catch. Wait for genuinely new rows.
    if (lastLoadedServerPageRef.current?.items === data.items) {
      return;
    }
    lastLoadedServerPageRef.current = { page: activePage, items: data.items };
    setLoadedServerItems((previousItems) =>
      mergeContinuousTableItems(
        previousItems,
        data.items,
        getRowIdRef.current,
        activePage === 1,
      ),
    );
  }, [
    activePage,
    data.isFetching,
    data.isLoading,
    data.items,
    shouldClientPaginate,
    shouldContinuouslyLoad,
  ]);

  React.useEffect(() => {
    if (!shouldContinuouslyLoad || shouldClientPaginate) {
      setLoadedServerItems((items) => (items.length === 0 ? items : []));
      lastLoadedServerPageRef.current = null;
    }
  }, [shouldClientPaginate, shouldContinuouslyLoad]);

  // Internal selection state — used when the parent does not supply a selection prop
  const [internalSelectedIds, setInternalSelectedIds] = React.useState<
    string[]
  >([]);
  const selectedIds = selection?.selectedIds ?? internalSelectedIds;
  /**
   * Rows the active filter rules actually leave visible.
   *
   * "Select all" and bulk delete must never reach a row the user cannot see: a
   * rule that hides rows, followed by select-all and delete, would otherwise
   * destroy the hidden ones. Held in a ref because these handlers are defined
   * before the filtered list is computed further down, and a stale closure here
   * is exactly the bug.
   */
  const visibleItemsRef = React.useRef<T[]>(data.items);
  const handleSelectAll = (checked: boolean) => {
    const visibleIds = visibleItemsRef.current.map((item) =>
      table.getRowId(item),
    );
    if (selection?.onSelectAll) {
      // Second argument is additive: parents that own selection can adopt the
      // rule-filtered ids, and those that ignore it keep their old behaviour.
      selection.onSelectAll(checked, visibleIds);
      return;
    }
    setInternalSelectedIds(checked ? visibleIds : []);
  };
  const handleSelectRow =
    selection?.onSelectRow ??
    ((id: string, checked: boolean) => {
      setInternalSelectedIds((prev) =>
        checked
          ? prev.includes(id)
            ? prev
            : [...prev, id]
          : prev.filter((i) => i !== id),
      );
    });
  const effectiveSorting = React.useMemo(() => {
    if (sorting) return sorting;
    if (!resolvedFeatures.enableSorting) return undefined;
    return {
      sortBy: internalSortBy,
      sortDirection: internalSortDirection,
      onSortChange: (col: string, dir: SortDirection) => {
        setInternalSortBy(col);
        setInternalSortDirection(dir);
      },
    };
  }, [
    sorting,
    resolvedFeatures.enableSorting,
    internalSortBy,
    internalSortDirection,
  ]);

  const effectiveSelectedCount = resolveUnifiedTableSelectedCount(
    selectedIds,
    toolbar.selectedCount,
  );
  // Row selection is default-on across unified tables now. Pages that should
  // not expose selection must explicitly opt out with
  // `features.enableRowSelection: false`.
  const hasRowSelection = shouldRenderRowSelection(features);
  const hasRowActions =
    resolvedFeatures.enableRowActions &&
    Boolean(table.rowActions || table.onView || table.onDelete || table.onEdit);

  // Built-in delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<T | null>(null);
  // Built-in bulk delete confirmation dialog state (auto-built effectiveBulkDelete only)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false);

  const handleDeleteIntent = React.useCallback((item: T) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = React.useCallback(() => {
    if (itemToDelete && table.onDelete) {
      table.onDelete(itemToDelete);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  }, [itemToDelete, table]);

  // Auto-built bulk delete: opens built-in confirmation dialog, then deletes after confirm.
  // Callers don't need to wire toolbar.onBulkDelete — providing table.onDelete is enough.
  const effectiveBulkDelete = React.useMemo(() => {
    if (toolbar.onBulkDelete) return toolbar.onBulkDelete;
    if (!table.onDelete) return undefined;
    return () => setBulkDeleteDialogOpen(true);
  }, [toolbar.onBulkDelete, table.onDelete]);

  const handleBulkDeleteConfirm = React.useCallback(() => {
    if (!table.onDelete) return;
    // Deliberately built from the visible rows, not `data.items`: a selection
    // made before a rule was applied must not delete what the rule now hides.
    // The confirmation counts the same resolver's result, so the number the
    // user approved is the number deleted.
    const { items } = resolveBulkDeleteTargets(
      selectedIds,
      visibleItemsRef.current,
      table.getRowId,
      table.allowDelete,
    );
    if (items.length > 0) {
      if (table.onDeleteBatch) table.onDeleteBatch(items);
      else items.forEach((item) => table.onDelete!(item));
    }
    handleSelectAll(false);
    setBulkDeleteDialogOpen(false);
  }, [selectedIds, table, handleSelectAll]);

  // ── Bulk edit ─────────────────────────────────────────────────────────────
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = React.useState(false);

  // Fields the bulk-edit dialog offers. Explicit config wins; otherwise derive
  // from declaratively-editable columns so any standard editable table gets
  // bulk edit for free.
  const autoBulkEditFields = React.useMemo<BulkEditField<T>[]>(
    () =>
      deriveBulkEditFields(table.columns, resolvedFeatures.enableInlineEditing),
    [table.columns, resolvedFeatures.enableInlineEditing],
  );

  const bulkEditFields = table.bulkEdit?.fields ?? autoBulkEditFields;
  const hasBulkEdit =
    resolvedFeatures.enableBulkEdit &&
    hasRowSelection &&
    bulkEditFields.length > 0;

  const handleBulkEditApply = React.useCallback(
    async (changes: Record<string, BulkEditValue>) => {
      const targetIds = [...selectedIds];
      if (targetIds.length === 0) return;

      if (table.bulkEdit?.onApplyBatch) {
        await table.bulkEdit.onApplyBatch(changes, targetIds);
      } else if (table.bulkEdit?.onApply) {
        for (const [fieldId, value] of Object.entries(changes)) {
          await table.bulkEdit.onApply(fieldId, value, targetIds);
        }
      } else {
        const itemsById = new Map(
          data.items.map((item) => [table.getRowId(item), item]),
        );
        for (const [fieldId, value] of Object.entries(changes)) {
          const column = table.columns.find(
            (candidate) => candidate.id === fieldId,
          );
          if (!column?.onEdit) continue;
          for (const id of targetIds) {
            const item = itemsById.get(id);
            // The legacy inline adapter represents an explicit clear as an
            // empty string. Only the dialog's Clear intention can reach null.
            if (item) await column.onEdit(item, value ?? "");
          }
        }
      }

      if (table.bulkEdit?.clearSelectionOnApply === true) {
        handleSelectAll(false);
      }
    },
    [data.items, selectedIds, table, handleSelectAll],
  );

  // ── Internal view state ──────────────────────────────────────────────────────
  // UnifiedTablePage owns view state internally so individual pages never need
  // to wire currentView / onViewChange — the view switcher always works.
  // If the parent does manage view state (e.g. persisting to URL), calling
  // onViewChange still propagates the value upward, and the parent's
  // toolbar.currentView is honoured as the initial value and on external changes.
  const pageOwnedViews = React.useMemo(
    () => new Set(toolbar.pageOwnedViews ?? []),
    [toolbar.pageOwnedViews],
  );
  const [internalView, setInternalView] = React.useState<ViewMode>(() =>
    toolbar.currentView &&
    !(toolbar.pageOwnedViews ?? []).includes(toolbar.currentView)
      ? toolbar.currentView
      : "table",
  );
  // Sync when the parent drives a view change from outside (e.g. URL navigation).
  // A page-owned mode is deliberately NOT adopted as the rendered view: the page
  // renders it, and the last real view stays underneath it.
  React.useEffect(() => {
    if (toolbar.currentView && !pageOwnedViews.has(toolbar.currentView)) {
      setInternalView(toolbar.currentView);
    }
  }, [toolbar.currentView, pageOwnedViews]);

  // ── Density state — global preference persisted in localStorage ─────────
  const serverDensity: TableDensity =
    table.density === "compact" ? "compact" : "default";
  const readStoredDensity = React.useCallback((): TableDensity => {
    try {
      const stored = storage.getItem(
        "alleato:tableDensity",
      ) as TableDensity | null;
      if (
        stored === "compact" ||
        stored === "default" ||
        stored === "comfortable"
      )
        return stored;
    } catch (error) {
      reportNonCriticalFailure({
        area: "unified-table-page",
        operation: "load-density-preference",
        error,
        userVisibleFallback: "Saved table density could not be restored.",
        metadata: { tableTitle: header.title },
      });
    }
    return serverDensity;
  }, [header.title, serverDensity]);
  const [density, setDensityState] = useStoredPreference<TableDensity>(
    readStoredDensity,
    serverDensity,
  );

  const handleDensityChange = React.useCallback(
    (next: TableDensity) => {
      setDensityState(next);
      try {
        storage.setItem("alleato:tableDensity", next);
      } catch (error) {
        reportNonCriticalFailure({
          area: "unified-table-page",
          operation: "save-density-preference",
          error,
          userVisibleFallback: "Table density preference was not saved.",
          metadata: { tableTitle: header.title, density: next },
        });
      }
    },
    [header.title],
  );

  const activeView = internalView;

  const handleViewChange = React.useCallback(
    (view: ViewMode) => {
      if (!pageOwnedViews.has(view)) setInternalView(view);
      toolbar.onViewChange?.(view);
    },
    [pageOwnedViews, toolbar],
  );

  const effectiveEnabledViews: ViewMode[] = React.useMemo(() => {
    return resolveUnifiedTableViews({
      enabledViews: toolbar.enabledViews,
      excludedViews: toolbar.excludedViews,
      detailPresentation: table.detailPresentation,
      customViews: {
        list: Boolean(views?.list),
        calendar: Boolean(views?.calendar),
        timeline: Boolean(views?.timeline),
      },
    });
  }, [
    toolbar.enabledViews,
    toolbar.excludedViews,
    table.detailPresentation,
    views?.list,
    views?.calendar,
    views?.timeline,
  ]);

  const renderedView = resolveActiveUnifiedTableView(
    activeView,
    effectiveEnabledViews,
  );
  React.useEffect(() => {
    if (renderedView === activeView) return;
    setInternalView(renderedView);
    toolbar.onViewChange?.(renderedView);
  }, [activeView, renderedView, toolbar.onViewChange]);

  // The switcher shows what the USER selected; the renderer shows what THIS
  // component draws. They differ only while a page-owned view is active.
  const viewSwitcherValue: ViewMode =
    toolbar.currentView && pageOwnedViews.has(toolbar.currentView)
      ? toolbar.currentView
      : renderedView;

  const canRenderBoardView =
    resolvedFeatures.enableViews && renderedView === "board";
  const canRenderCardView =
    resolvedFeatures.enableViews && renderedView === "card";
  const canRenderListView =
    resolvedFeatures.enableViews &&
    renderedView === "list" &&
    Boolean(views?.list);
  const canRenderSplitView =
    resolvedFeatures.enableViews && renderedView === "split";
  const canRenderCalendarView =
    resolvedFeatures.enableViews &&
    renderedView === "calendar" &&
    Boolean(views?.calendar);
  const canRenderTimelineView =
    resolvedFeatures.enableViews &&
    renderedView === "timeline" &&
    Boolean(views?.timeline);
  const shouldRenderTableView =
    renderedView === "table" ||
    (!canRenderBoardView &&
      !canRenderCardView &&
      !canRenderListView &&
      !canRenderSplitView &&
      !canRenderCalendarView &&
      !canRenderTimelineView);
  const isFullBleedTable = layout?.fullBleedTable ?? false;
  const hideTableBody = layout?.hideTableBody ?? false;
  const hideToolbar = layout?.hideToolbar ?? false;
  const alignHeaderWithFullBleedTable =
    layout?.alignHeaderWithFullBleedTable ?? false;
  const removeTableFrame = layout?.removeTableFrame ?? false;
  const plainFooterTotals = layout?.plainFooterTotals ?? false;
  const headerAlignment = layout?.headerAlignment ?? "left";
  const toolbarInlineWithHeader = shouldPlaceToolbarInlineWithHeader(
    header.hidden,
    layout?.toolbarInlineWithHeader,
  );
  const toolbarWithTabs = (layout?.toolbarWithTabs ?? false) && Boolean(tabs);
  const containerMaxWidth = layout?.maxWidth ?? "full";
  const containerClassName = layout?.containerClassName;
  const pageShellOwnsTableLayout = useTablePageShellOwnsLayout();
  const containerPadding =
    layout?.containerPadding ?? !pageShellOwnsTableLayout;
  const shouldUseFullBleedDesktopScrollShell =
    isFullBleedTable && containerPadding && !sidePanel;
  const shouldBleedTableRight = shouldBleedTableRightEdge({
    bleedRight: layout?.bleedRight,
    isFullBleedTable,
    hasSidePanel: Boolean(sidePanel),
    isSplitView: canRenderSplitView,
  });
  const toolbarColumns: ColumnConfig[] = React.useMemo(
    () =>
      toolbar.columns ??
      table.columns.map((column) => ({
        id: column.id,
        label: column.label,
        defaultVisible: column.defaultVisible,
        alwaysVisible: column.alwaysVisible,
      })),
    [table.columns, toolbar.columns],
  );
  const effectiveToolbarFilters = React.useMemo<FilterConfig[]>(
    () =>
      resolveUnifiedTableFilters({
        filters: toolbar.filters,
        columns: table.columns,
        rows: data.items,
      }),
    [data.items, table.columns, toolbar.filters],
  );
  // Internal column visibility — persisted to localStorage when the caller
  // does not supply toolbar.visibleColumns / toolbar.onColumnVisibilityChange.
  const colStorageKey = `alleato:cols:${header.title}`;
  const defaultVisibleColumnIds = React.useMemo(() => {
    const baseCols = (toolbar.columns ?? table.columns) as Array<{
      id: string;
      defaultVisible?: boolean;
      alwaysVisible?: boolean;
    }>;
    return baseCols
      .filter((c) => c.defaultVisible !== false || c.alwaysVisible)
      .map((c) => c.id);
  }, [toolbar.columns, table.columns]);
  const readStoredVisibleColumns = React.useCallback((): string[] => {
    try {
      const stored = storage.getItem(`alleato:cols:${header.title}`);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        if (Array.isArray(parsed) && parsed.length > 0) {
          const usable = reconcileStoredColumns(
            parsed as string[],
            (toolbar.columns ?? table.columns) as Array<{
              id: string;
              alwaysVisible?: boolean;
            }>,
          );
          if (usable) return usable;
        }
      }
    } catch (error) {
      reportNonCriticalFailure({
        area: "unified-table-page",
        operation: "load-column-preferences",
        error,
        userVisibleFallback:
          "Saved table column preferences could not be restored.",
        metadata: { tableTitle: header.title },
      });
    }
    return defaultVisibleColumnIds;
  }, [header.title, toolbar.columns, table.columns, defaultVisibleColumnIds]);
  const [internalVisibleColumns, setInternalVisibleColumns] =
    useStoredPreference<string[]>(
      readStoredVisibleColumns,
      defaultVisibleColumnIds,
    );
  // Always include alwaysVisible columns even if stale localStorage omits them
  const rawVisibleColumns = toolbar.visibleColumns ?? internalVisibleColumns;
  const visibleColumns = React.useMemo(() => {
    const alwaysVisibleIds = toolbarColumns
      .filter((c) => c.alwaysVisible)
      .map((c) => c.id);
    const missing = alwaysVisibleIds.filter(
      (id) => !rawVisibleColumns.includes(id),
    );
    if (missing.length === 0) return rawVisibleColumns;
    const visibleSet = new Set([...rawVisibleColumns, ...missing]);
    return toolbarColumns
      .map((column) => column.id)
      .filter((id) => visibleSet.has(id));
  }, [rawVisibleColumns, toolbarColumns]);
  const activeFilters = toolbar.activeFilters ?? {};
  const handleFilterChange =
    toolbar.onFilterChange ??
    (() => {
      // no-op by default so pages without filters don't need wiring
    });
  const handleClearFilters =
    toolbar.onClearFilters ??
    (() => {
      // no-op by default so pages without filters don't need wiring
    });
  const handleColumnVisibilityChange = React.useCallback(
    (columns: string[]) => {
      if (toolbar.onColumnVisibilityChange) {
        toolbar.onColumnVisibilityChange(columns);
      } else {
        setInternalVisibleColumns(columns);
        try {
          storage.setItem(colStorageKey, JSON.stringify(columns));
        } catch (error) {
          reportNonCriticalFailure({
            area: "unified-table-page",
            operation: "save-column-preferences",
            error,
            userVisibleFallback: "Table column preferences were not saved.",
            metadata: { tableTitle: header.title },
          });
        }
      }
    },
    [toolbar.onColumnVisibilityChange, colStorageKey],
  );
  const [columnWidths, setColumnWidths] = React.useState<
    Record<string, number>
  >({});
  const [columnOrder, setColumnOrder] =
    React.useState<string[]>(visibleColumns);
  const [columnPinning, setColumnPinning] = React.useState<{
    left: string[];
    right: string[];
  }>(() => ({
    left: table.defaultPinnedLeftColumns ?? [],
    right: table.defaultPinnedRightColumns ?? [],
  }));
  const [rowOrderIds, setRowOrderIds] = React.useState<string[]>([]);
  const [draggedRowId, setDraggedRowId] = React.useState<string | null>(null);
  const [collapsedGroupValues, setCollapsedGroupValues] = React.useState<
    string[]
  >([]);
  const [dropTargetGroupValue, setDropTargetGroupValue] = React.useState<
    string | null
  >(null);
  const [movingGroupRowId, setMovingGroupRowId] = React.useState<string | null>(
    null,
  );
  const [editingCell, setEditingCell] = React.useState<{
    rowId: string;
    columnId: string;
    surface: InlineEditSurface;
  } | null>(null);
  const [editingValue, setEditingValue] = React.useState("");
  const [savingCell, setSavingCell] = React.useState<{
    rowId: string;
    columnId: string;
  } | null>(null);
  const [inlineEdits, setInlineEdits] = React.useState<Record<string, string>>(
    {},
  );
  const inlineEditCommitsRef = React.useRef(new Set<string>());
  const [internalActiveRowId, setInternalActiveRowId] = React.useState<
    string | null
  >(null);
  const effectiveActiveRowId =
    table.activeRowId === undefined ? internalActiveRowId : table.activeRowId;
  const tableScrollRef = React.useRef<HTMLDivElement>(null);
  const tableScrollViewportId = React.useId();
  // Horizontal-scroll affordance: when a table is wider than the viewport, a
  // partially-visible trailing column must read as "scroll for more" — not as a
  // random/broken clip. We fade the leading/trailing edges whenever there is more
  // content to scroll to in that direction. Fixed here once so every table page
  // inherits it (design-audit DA-001).
  const [tableScrollEdges, setTableScrollEdges] =
    React.useState<TableScrollEdges>(NO_SCROLL_EDGES);
  const rowRefs = React.useRef<Record<string, HTMLTableRowElement | null>>({});
  const splitRowRefs = React.useRef<Record<string, HTMLElement | null>>({});
  const handleColumnWidthChange = React.useCallback(
    (columnId: string, width: number) => {
      setColumnWidths((prev) => ({ ...prev, [columnId]: width }));
    },
    [],
  );
  const { startColumnResize, didResizeRef } = useColumnResizeDrag({
    onResize: handleColumnWidthChange,
  });
  const hasUserManagedColumnOrderRef = React.useRef(false);
  const handleToolbarColumnOrderChange = React.useCallback(
    (nextOrder: string[]) => {
      hasUserManagedColumnOrderRef.current = true;
      setColumnOrder(nextOrder);
    },
    [],
  );
  const canDragRows =
    (Boolean(groupingConfig?.onMoveToGroup) ||
      (resolvedFeatures.enableRowReorder && !effectiveSorting?.sortBy)) &&
    !resolvedFeatures.enableVirtualization;
  const hasLeadingRowDragHandle =
    hasRowSelection &&
    Boolean(groupingConfig?.onMoveToGroup) &&
    !resolvedFeatures.enableVirtualization;
  const selectionColumnWidth =
    SELECTION_COLUMN_WIDTH + (hasLeadingRowDragHandle ? 24 : 0);

  // ── Side panel collapse & resize state ───────────────────────────────
  const panelCollapsible = sidePanel?.collapsible ?? true;
  const panelResizable = sidePanel?.resizable ?? true;
  const isPeekPanel = Boolean(sidePanel) && !canRenderSplitView;
  const panelController = useTableSidePanelController({
    enabled: Boolean(sidePanel),
    size: sidePanel?.size,
    storageKey: sidePanel?.storageKey,
  });
  const panelCollapsed = panelCollapsible ? panelController.collapsed : false;
  const panelWidth = panelController.width;
  const isSidePanelOpen = Boolean(sidePanel && effectiveActiveRowId);
  // Mount the panel body once. The desktop panel and the mobile overlay used
  // to both render it (one hidden only by CSS), so a panel with inputs existed
  // twice: duplicate field ids, two drafts, and every data hook ran twice.
  const isMobileViewport = useIsMobile();
  // Split geometry belongs to the workspace, regardless of row selection.
  // A page's sidePanel supplies detail content; it must not replace that frame
  // or cause the outer page to mount a second header/toolbar.
  const usesGenericSplitWorkspace = canRenderSplitView && !views?.split;

  const sourceItems =
    shouldContinuouslyLoad && !shouldClientPaginate && activePage > 1
      ? loadedServerItems
      : data.items;

  // ── Rule-based filtering ─────────────────────────────────────────────────
  // One resolver per declared filter field, so the engine can read a comparable
  // value out of a row. Columns supply it (`filterValue` → `sortValue` →
  // `csvValue` → `editValue`); a field with no matching column has no resolver
  // and is reported as unsupported instead of silently matching nothing.
  const filterFieldResolvers = React.useMemo(() => {
    const resolvers: Record<string, FilterFieldResolver<T>> = {};
    for (const filter of effectiveToolbarFilters) {
      const column = table.columns.find(
        (candidate) => candidate.id === filter.id,
      );
      const accessor =
        column?.filterValue ??
        column?.sortValue ??
        column?.csvValue ??
        column?.editValue;
      if (!accessor) continue;
      resolvers[filter.id] = {
        // A dateRange field is a date as far as comparison goes; the separate
        // `_from`/`_to` legacy params keep working alongside it.
        type: filter.type === "dateRange" ? "date" : filter.type,
        getValue: (item: T) => accessor(item),
      };
    }
    return resolvers;
  }, [effectiveToolbarFilters, table.columns]);

  // Rules are only applied where the answer can be correct. With every row in
  // memory that is here; on a server-paginated list it is only true for fields
  // the endpoint filters itself, because the other pages were never fetched.
  const [internalFilterQuery, setInternalFilterQuery] =
    React.useState<FilterQuery>(EMPTY_FILTER_QUERY);
  const pageOwnsFilterQuery = Boolean(toolbar.onFilterQueryChange);
  // Grouping disables page slicing, not local knowledge of the full dataset.
  // Keep that capability independent so grouped client-side tables can add rules.
  const canFilterRulesLocally = Boolean(
    pagination?.clientSide || (!pagination && resolvedFeatures.enablePagination),
  );
  const ruleFilteringEnabled = pageOwnsFilterQuery || canFilterRulesLocally;
  const activeFilterQuery = pageOwnsFilterQuery
    ? (toolbar.filterQuery ?? EMPTY_FILTER_QUERY)
    : internalFilterQuery;
  const handleFilterQueryChange = React.useCallback(
    (query: FilterQuery) => {
      if (toolbar.onFilterQueryChange) {
        toolbar.onFilterQueryChange(query);
        return;
      }
      setInternalFilterQuery(query);
      // A narrower rule invalidates the current offset: staying on page 3 of the
      // unfiltered list shows an empty table while matches sit on page 1.
      setInternalPage(1);
      if (pagination?.clientSide) pagination.onPageChange(1);
    },
    [pagination, toolbar.onFilterQueryChange],
  );

  const unsupportedFilterFields = React.useMemo(() => {
    if (!ruleFilteringEnabled) return [];
    const serverFields = new Set(toolbar.serverFilterFields ?? []);
    return effectiveToolbarFilters
      .filter((filter) => {
        if (serverFields.has(filter.id)) return false;
        if (!canFilterRulesLocally) return true;
        return !filterFieldResolvers[filter.id];
      })
      .map((filter) => filter.id);
  }, [
    canFilterRulesLocally,
    effectiveToolbarFilters,
    filterFieldResolvers,
    ruleFilteringEnabled,
    toolbar.serverFilterFields,
  ]);

  const ruleFilteredItems = React.useMemo(() => {
    if (!ruleFilteringEnabled || !activeFilterQuery.rules.length) {
      return sourceItems;
    }
    const serverFields = new Set(toolbar.serverFilterFields ?? []);
    // Rules the endpoint already applied must not be re-applied here: the row
    // shape the client sees can differ from the column the server matched.
    const localRules = activeFilterQuery.rules.filter(
      (rule) =>
        !serverFields.has(rule.field) && filterFieldResolvers[rule.field],
    );
    if (!localRules.length) return sourceItems;
    return applyFilterQuery(
      sourceItems,
      { conjunction: activeFilterQuery.conjunction, rules: localRules },
      filterFieldResolvers,
    );
  }, [
    activeFilterQuery,
    filterFieldResolvers,
    ruleFilteringEnabled,
    sourceItems,
    toolbar.serverFilterFields,
  ]);

  const dateRangeFilteredItems = React.useMemo(() => {
    const dateRangeFilters = effectiveToolbarFilters.filter(
      (filter) => filter.type === "dateRange",
    );
    const activeDateRangeFilters = dateRangeFilters
      .map((filter) => {
        const from = parseFilterDate(
          activeFilters[`${filter.id}_from`],
          "start",
        );
        const to = parseFilterDate(activeFilters[`${filter.id}_to`], "end");
        if (from === null && to === null) return null;

        const column = table.columns.find(
          (candidate) => candidate.id === filter.id,
        );
        if (!column?.sortValue) return null;

        return { column, from, to };
      })
      .filter(
        (
          filter,
        ): filter is {
          column: TableColumn<T>;
          from: number | null;
          to: number | null;
        } => Boolean(filter),
      );

    if (activeDateRangeFilters.length === 0) return ruleFilteredItems;

    return ruleFilteredItems.filter((item) =>
      activeDateRangeFilters.every(({ column, from, to }) => {
        const value = parseColumnDateValue(column.sortValue?.(item));
        if (value === null) return false;
        if (from !== null && value < from) return false;
        if (to !== null && value > to) return false;
        return true;
      }),
    );
  }, [
    activeFilters,
    effectiveToolbarFilters,
    ruleFilteredItems,
    table.columns,
  ]);

  // Assigned during render on purpose: it is derived state read only by event
  // handlers (select-all, bulk delete), and an effect would leave it one render
  // stale — long enough for a click to act on rows a rule already hid.
  visibleItemsRef.current = dateRangeFilteredItems;

  // Internal selection follows the rows: a deleted, searched-out, filtered-out
  // or off-page row leaves it. Skipped while a load or refetch is in flight so
  // an empty placeholder list cannot wipe a selection; the prune runs once the
  // rows arrive. A parent that passes
  // `selection` owns pruning (and may keep cross-page selection on purpose).
  React.useEffect(() => {
    if (selection || data.isLoading || data.isFetching) return;
    setInternalSelectedIds((previous) =>
      pruneSelectionToRows(previous, dateRangeFilteredItems, getRowIdRef.current),
    );
  }, [selection, data.isLoading, data.isFetching, dateRangeFilteredItems]);

  // Resolved only while the dialog is open; the last result is kept through
  // the close animation, after the confirm handler has cleared the selection,
  // so the closing dialog does not flash "No items to delete".
  const lastBulkDeleteTargetsRef = React.useRef<ReturnType<
    typeof resolveBulkDeleteTargets<T>
  > | null>(null);
  const openBulkDeleteTargets = React.useMemo(
    () =>
      bulkDeleteDialogOpen
        ? resolveBulkDeleteTargets(
            selectedIds,
            dateRangeFilteredItems,
            table.getRowId,
            table.allowDelete,
          )
        : null,
    [
      bulkDeleteDialogOpen,
      dateRangeFilteredItems,
      selectedIds,
      table.allowDelete,
      table.getRowId,
    ],
  );
  if (openBulkDeleteTargets) {
    lastBulkDeleteTargetsRef.current = openBulkDeleteTargets;
  }
  const bulkDeleteTargets =
    openBulkDeleteTargets ?? lastBulkDeleteTargetsRef.current;
  const deleteNoun = (count: number) =>
    count === 1
      ? (table.deleteCopy?.noun ?? "item")
      : (table.deleteCopy?.pluralNoun ??
        (table.deleteCopy ? `${table.deleteCopy.noun}s` : "items"));

  const sortedItems = React.useMemo(() => {
    if (!effectiveSorting?.sortBy) return dateRangeFilteredItems;
    const column = table.columns.find(
      (col) => col.id === effectiveSorting.sortBy,
    );
    const getSortValue = column?.sortValue;
    if (!getSortValue) return dateRangeFilteredItems;

    const sorted = [...dateRangeFilteredItems].sort((a, b) => {
      const valueA = getSortValue(a);
      const valueB = getSortValue(b);

      if (valueA == null && valueB == null) return 0;
      if (valueA == null)
        return effectiveSorting!.sortDirection === "asc" ? -1 : 1;
      if (valueB == null)
        return effectiveSorting!.sortDirection === "asc" ? 1 : -1;

      if (typeof valueA === "number" && typeof valueB === "number") {
        return effectiveSorting!.sortDirection === "asc"
          ? valueA - valueB
          : valueB - valueA;
      }

      const comparison = String(valueA).localeCompare(String(valueB));
      return effectiveSorting!.sortDirection === "asc"
        ? comparison
        : -comparison;
    });

    return sorted;
  }, [
    dateRangeFilteredItems,
    effectiveSorting?.sortBy,
    effectiveSorting?.sortDirection,
    table.columns,
  ]);

  const knownColumnIds = React.useMemo(
    () => table.columns.map((column) => column.id),
    [table.columns],
  );

  React.useEffect(() => {
    setColumnOrder((prev) => {
      const nextOrder = nextColumnOrderAfterVisibilityChange({
        previousOrder: prev,
        visibleColumns,
        knownColumnIds,
        userManaged: hasUserManagedColumnOrderRef.current,
      });
      return areStringArraysEqual(prev, nextOrder) ? prev : nextOrder;
    });
  }, [knownColumnIds, visibleColumns]);

  const defaultPinnedLeftSignature = React.useMemo(
    () => (table.defaultPinnedLeftColumns ?? []).join("|"),
    [table.defaultPinnedLeftColumns],
  );
  const defaultPinnedRightSignature = React.useMemo(
    () => (table.defaultPinnedRightColumns ?? []).join("|"),
    [table.defaultPinnedRightColumns],
  );

  React.useEffect(() => {
    const nextLeft = table.defaultPinnedLeftColumns ?? [];
    const nextRight = table.defaultPinnedRightColumns ?? [];
    setColumnPinning((prev) => {
      const prevLeft = prev.left.join("|");
      const prevRight = prev.right.join("|");
      if (
        prevLeft === defaultPinnedLeftSignature &&
        prevRight === defaultPinnedRightSignature
      ) {
        return prev;
      }
      return { left: nextLeft, right: nextRight };
    });
  }, [
    defaultPinnedLeftSignature,
    defaultPinnedRightSignature,
    table.defaultPinnedLeftColumns,
    table.defaultPinnedRightColumns,
  ]);

  const rowOrderedItems = React.useMemo(() => {
    const isManualRowOrderEnabled =
      resolvedFeatures.enableRowReorder && !effectiveSorting?.sortBy;
    if (!isManualRowOrderEnabled) return sortedItems;
    if (rowOrderIds.length === 0) return sortedItems;

    const byId = new Map(
      sortedItems.map((item) => [table.getRowId(item), item]),
    );
    const ordered = rowOrderIds
      .map((id) => byId.get(id))
      .filter((item): item is T => Boolean(item));
    const orderedIds = new Set(ordered.map((item) => table.getRowId(item)));
    const remaining = sortedItems.filter(
      (item) => !orderedIds.has(table.getRowId(item)),
    );
    return [...ordered, ...remaining];
  }, [
    resolvedFeatures.enableRowReorder,
    rowOrderIds,
    sortedItems,
    effectiveSorting?.sortBy,
    table,
  ]);

  // Auto-built CSV exporter: used when toolbar.onExport is not provided.
  // Only exports columns that define csvValue — columns without it are silently skipped.
  const effectiveOnExport = React.useMemo(() => {
    if (toolbar.onExport) return toolbar.onExport;
    if (!resolvedFeatures.enableExport) return undefined;
    const exportableCols = visibleColumns
      .map((id) => table.columns.find((c) => c.id === id))
      .filter((c): c is TableColumn<T> => Boolean(c?.csvValue));
    if (exportableCols.length === 0) return undefined;
    return () => {
      const metaRow = (label: string, value: string) =>
        `${escapeUnifiedTableCsvCell(label)},${escapeUnifiedTableCsvCell(value)}`;

      const exportedAt = new Date();
      const exportedIso = exportedAt.toISOString().slice(0, 10);

      // Metadata block — only emitted when reportContext is provided.
      const metaLines: string[] = [];
      if (reportContext) {
        const projectLabel =
          reportContext.projectName && reportContext.projectNumber
            ? `${reportContext.projectNumber} — ${reportContext.projectName}`
            : reportContext.projectName ||
              (reportContext.projectNumber != null
                ? String(reportContext.projectNumber)
                : "");

        metaLines.push(metaRow("Report", header.title));
        if (projectLabel) metaLines.push(metaRow("Project", projectLabel));
        if (reportContext.projectDescription) {
          metaLines.push(
            metaRow("Description", reportContext.projectDescription),
          );
        }
        metaLines.push(metaRow("Exported", exportedAt.toISOString()));
        if (reportContext.exportedBy) {
          metaLines.push(metaRow("Exported by", reportContext.exportedBy));
        }
        if (reportContext.extra) {
          for (const [key, value] of Object.entries(reportContext.extra)) {
            if (value === null || value === undefined || value === "") continue;
            metaLines.push(metaRow(key, String(value)));
          }
        }
        // Blank separator line between metadata and the table.
        metaLines.push("");
      }

      const exportedCols = selectUnifiedTableCsvColumns(
        exportableCols,
        rowOrderedItems,
      );
      const headers = exportedCols
        .map((c) => escapeUnifiedTableCsvCell(c.label))
        .join(",");
      const rows = rowOrderedItems.map((item) =>
        exportedCols
          .map((c) =>
            escapeUnifiedTableCsvCell(String(c.csvValue!(item) ?? "")),
          )
          .join(","),
      );
      const csv = [...metaLines, headers, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      const slug = header.title.toLowerCase().replace(/\s+/g, "-");
      const projectToken =
        reportContext?.projectNumber != null
          ? `${reportContext.projectNumber}-`
          : "";
      a.href = url;
      a.download = `${projectToken}${slug}-${exportedIso}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };
  }, [
    toolbar.onExport,
    resolvedFeatures.enableExport,
    visibleColumns,
    table.columns,
    rowOrderedItems,
    header.title,
    reportContext,
  ]);

  React.useEffect(() => {
    if (!resolvedFeatures.enableRowReorder || effectiveSorting?.sortBy) {
      setRowOrderIds((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    // Reconcile against the incoming rows (sortedItems), never against
    // rowOrderedItems: that list is derived FROM rowOrderIds, so an effect that
    // reads it and writes rowOrderIds feeds on its own output and re-fires on
    // every render that rebuilds it. On 2026-09-23 that loop, together with the
    // scroll-edge effect below, took /change-events down with "Maximum update
    // depth exceeded" (minified #185) for every browser whose saved row count
    // differed from the page default.
    const nextIds = sortedItems.map((item) => table.getRowId(item));
    setRowOrderIds((prev) => {
      if (prev.length === 0) {
        return areStringArraysEqual(prev, nextIds) ? prev : nextIds;
      }
      const seen = new Set(nextIds);
      const preserved = prev.filter((id) => seen.has(id));
      const additions = nextIds.filter((id) => !preserved.includes(id));
      const nextOrder = [...preserved, ...additions];
      return areStringArraysEqual(prev, nextOrder) ? prev : nextOrder;
    });
  }, [
    resolvedFeatures.enableRowReorder,
    sortedItems,
    effectiveSorting?.sortBy,
    table,
  ]);

  // Printing wants the full filtered+sorted dataset, not the current page:
  // print CSS (print-document.css) hides the pager, so a table that still
  // sliced to one page would silently print an incomplete document. See
  // AGENTS.md "Fix the class" — the PDF has no way to tell the reader a row
  // is missing.
  const isPrinting = useIsPrinting();

  const paginatedItems = React.useMemo(() => {
    if (isPrinting) return rowOrderedItems;
    if (!shouldClientPaginate) return rowOrderedItems;
    if (shouldContinuouslyLoad) {
      return rowOrderedItems.slice(0, activePage * activePerPage);
    }
    const start = (activePage - 1) * activePerPage;
    return rowOrderedItems.slice(start, start + activePerPage);
  }, [
    isPrinting,
    shouldClientPaginate,
    shouldContinuouslyLoad,
    activePage,
    activePerPage,
    rowOrderedItems,
  ]);

  type RenderEntry =
    | {
        kind: "group";
        key: string;
        groupValue: string;
        label: string;
        count: number;
        collapsed: boolean;
      }
    | { kind: "groupFooter"; key: string; footer: ReactNode }
    | { kind: "groupGap"; key: string }
    | { kind: "row"; key: string; item: T }
    | { kind: "newRow"; key: string; groupValue: string | null };

  const renderEntries = React.useMemo<RenderEntry[]>(() => {
    if (!groupingConfig) {
      const rows: RenderEntry[] = paginatedItems.map((item) => ({
        kind: "row",
        key: table.getRowId(item),
        item,
      }));
      if (table.newRow) {
        rows.push({ kind: "newRow", key: "new::all", groupValue: null });
      }
      return rows;
    }

    const ordered = [...paginatedItems].sort((left, right) =>
      groupingConfig
        .getGroupValue(left)
        .localeCompare(groupingConfig.getGroupValue(right)),
    );
    const counts = new Map<string, number>();
    for (const item of ordered) {
      const value = groupingConfig.getGroupValue(item);
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    const itemsByGroup = new Map<string, T[]>();
    for (const item of ordered) {
      const value = groupingConfig.getGroupValue(item);
      itemsByGroup.set(value, [...(itemsByGroup.get(value) ?? []), item]);
    }

    const entries: RenderEntry[] = [];
    let currentGroup: string | null = null;
    for (const item of ordered) {
      const value = groupingConfig.getGroupValue(item);
      if (value !== currentGroup) {
        if (
          currentGroup !== null &&
          table.newRow &&
          !collapsedGroupValues.includes(currentGroup)
        ) {
          entries.push({
            kind: "newRow",
            key: `new::${currentGroup}`,
            groupValue: currentGroup,
          });
        }
        if (
          currentGroup !== null &&
          groupingConfig.getGroupFooter &&
          !collapsedGroupValues.includes(currentGroup)
        ) {
          const footer = groupingConfig.getGroupFooter(
            itemsByGroup.get(currentGroup) ?? [],
            currentGroup,
          );
          if (footer) {
            entries.push({
              kind: "groupFooter",
              key: `group-footer::${currentGroup}`,
              footer,
            });
            if (groupingConfig.groupFooterGap) {
              entries.push({
                kind: "groupGap",
                key: `group-gap::${currentGroup}`,
              });
            }
          }
        }
        currentGroup = value;
        if (groupingConfig.shouldRenderGroupHeader?.(value) ?? true) {
          entries.push({
            kind: "group",
            key: `group::${value}`,
            groupValue: value,
            label: groupingConfig.getGroupLabel?.(value) ?? value,
            count: counts.get(value) ?? 0,
            collapsed: collapsedGroupValues.includes(value),
          });
        }
      }
      if (!collapsedGroupValues.includes(value)) {
        entries.push({ kind: "row", key: table.getRowId(item), item });
      }
    }
    if (
      currentGroup !== null &&
      table.newRow &&
      !collapsedGroupValues.includes(currentGroup)
    ) {
      entries.push({
        kind: "newRow",
        key: `new::${currentGroup}`,
        groupValue: currentGroup,
      });
    }
    if (
      currentGroup !== null &&
      groupingConfig.getGroupFooter &&
      !collapsedGroupValues.includes(currentGroup)
    ) {
      const footer = groupingConfig.getGroupFooter(
        itemsByGroup.get(currentGroup) ?? [],
        currentGroup,
      );
      if (footer) {
        entries.push({
          kind: "groupFooter",
          key: `group-footer::${currentGroup}`,
          footer,
        });
      }
    }
    return entries;
  }, [collapsedGroupValues, groupingConfig, paginatedItems, table]);

  const handlePageChange = React.useCallback(
    (page: number) => {
      if (pagination) {
        pagination.onPageChange(page);
      } else {
        setInternalPage(page);
      }
    },
    [pagination],
  );

  const handlePerPageChange = React.useCallback(
    (perPage: string) => {
      const parsed = Number(perPage);
      if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 150) return;
      try {
        saveUnifiedTablePreferences({ perPage: parsed });
      } catch (error) {
        reportNonCriticalFailure({
          area: "unified-table-page",
          operation: "save-row-count-preference",
          error,
          userVisibleFallback:
            "Your row count preference could not be saved. The current table remains unchanged.",
          metadata: { tableTitle: header.title, perPage: parsed },
        });
      }
      if (pagination) {
        pagination.onPerPageChange(perPage);
      } else {
        setInternalPerPage(parsed);
        setInternalPage(1);
      }
    },
    [header.title, pagination],
  );

  const handlePaginationBehaviorChange = React.useCallback(
    (nextBehavior: TablePaginationBehavior) => {
      setPaginationBehavior(nextBehavior);
      try {
        saveUnifiedTablePreferences({ paginationBehavior: nextBehavior });
      } catch (error) {
        reportNonCriticalFailure({
          area: "unified-table-page",
          operation: "save-pagination-behavior-preference",
          error,
          userVisibleFallback:
            "Your loading preference could not be saved. The current table remains unchanged.",
          metadata: {
            tableTitle: header.title,
            paginationBehavior: nextBehavior,
          },
        });
      }
      if (nextBehavior === "scroll" && activePage !== 1) {
        setLoadedServerItems([]);
        lastLoadedServerPageRef.current = null;
        handlePageChange(1);
      }
    },
    [activePage, handlePageChange, header.title],
  );

  React.useEffect(() => {
    if (
      !shouldContinuouslyLoad ||
      data.isLoading ||
      data.isFetching ||
      (!shouldClientPaginate &&
        lastLoadedServerPageRef.current?.page !== activePage)
    ) {
      return;
    }
    autoLoadRequestRef.current = false;
  }, [
    activePage,
    data.isFetching,
    data.isLoading,
    loadedServerItems,
    shouldClientPaginate,
    shouldContinuouslyLoad,
  ]);

  // A "Continue on scroll" list is always built from row 1 upward, so arriving
  // on a `?page=6` link (left behind by an older build, or by switching modes)
  // would strand the user on a 25-row slice of the middle of the list. Rewind
  // once per mount so the accumulated list and the URL agree.
  const scrollModeRewoundRef = React.useRef(false);
  React.useEffect(() => {
    if (!shouldContinuouslyLoad || scrollModeRewoundRef.current) return;
    scrollModeRewoundRef.current = true;
    if (activePage > 1) {
      setLoadedServerItems([]);
      lastLoadedServerPageRef.current = null;
      handlePageChange(1);
    }
  }, [activePage, handlePageChange, shouldContinuouslyLoad]);

  React.useEffect(() => {
    const sentinel = autoLoadSentinelRef.current;
    if (!sentinel || !canLoadAnotherPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          !entry?.isIntersecting ||
          autoLoadRequestRef.current ||
          data.isLoading ||
          data.isFetching
        ) {
          return;
        }
        autoLoadRequestRef.current = true;
        handlePageChange(activePage + 1);
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    activePage,
    canLoadAnotherPage,
    data.isFetching,
    data.isLoading,
    handlePageChange,
  ]);

  const allSelected =
    rowOrderedItems.length > 0 &&
    rowOrderedItems.every((item) => selectedIds.includes(table.getRowId(item)));
  const someSelected = selectedIds.length > 0 && !allSelected;

  // The shared table owns local filter rules, so callers cannot report this
  // state themselves. Keep empty-state recovery aligned with the applied scope.
  const isFiltered =
    emptyState.isFiltered ||
    (ruleFilteringEnabled &&
      countCompleteRules(activeFilterQuery, effectiveToolbarFilters) > 0) ||
    Object.values(activeFilters).some(
      (value) => value !== undefined && value !== "" && value !== null,
    );

  const showEmptyState =
    !hideTableBody &&
    !data.isLoading &&
    !data.error &&
    rowOrderedItems.length === 0;
  const showTable =
    !hideTableBody &&
    !data.isLoading &&
    !data.error &&
    rowOrderedItems.length > 0;

  const handleSortClick = (columnId: string) => {
    if (!effectiveSorting) return;
    const nextDirection =
      effectiveSorting.sortBy === columnId &&
      effectiveSorting.sortDirection === "asc"
        ? "desc"
        : "asc";
    effectiveSorting.onSortChange(columnId, nextDirection);
  };

  const renderSortIcon = (columnId: string) => {
    if (!effectiveSorting || effectiveSorting.sortBy !== columnId) {
      return (
        <ChevronDown className="ml-1 h-3 w-3 text-muted-foreground/0 group-hover/th:text-muted-foreground/55 transition-colors" />
      );
    }

    return effectiveSorting.sortDirection === "asc" ? (
      <ChevronUp className="ml-1 h-3 w-3 text-muted-foreground/65" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3 text-muted-foreground/65" />
    );
  };

  const hideColumn = React.useCallback(
    (columnId: string) => {
      if (visibleColumns.length <= 1) return;
      handleColumnVisibilityChange(
        visibleColumns.filter((existingId) => existingId !== columnId),
      );
    },
    [handleColumnVisibilityChange, visibleColumns],
  );

  const orderedVisibleColumns = React.useMemo(() => {
    const visibleSet = new Set(visibleColumns);
    const fromOrder = columnOrder.filter((id) => visibleSet.has(id));
    const missing = visibleColumns.filter((id) => !fromOrder.includes(id));
    const merged = [...fromOrder, ...missing];
    const leftPinned = columnPinning.left.filter((id) => merged.includes(id));
    const rightPinned = columnPinning.right.filter((id) => merged.includes(id));
    const unpinned = merged.filter(
      (id) => !leftPinned.includes(id) && !rightPinned.includes(id),
    );
    return [...leftPinned, ...unpinned, ...rightPinned]
      .map((id) => table.columns.find((column) => column.id === id))
      .filter((column): column is TableColumn<T> => Boolean(column));
  }, [
    columnOrder,
    columnPinning.left,
    columnPinning.right,
    table.columns,
    visibleColumns,
  ]);

  // A declared `column.width` only means pixels under `table-layout: fixed`.
  // See `resolveTableGeometry` for the measurement behind the opt-in.
  const tableGeometry = React.useMemo(
    () =>
      resolveTableGeometry({
        columns: orderedVisibleColumns,
        columnWidths,
        fixedColumnWidths: table.fixedColumnWidths === true,
        hasRowSelection,
        selectionColumnWidth,
        hasRowActions,
        rowActionsColumnWidth: ROW_ACTIONS_COLUMN_WIDTH,
      }),
    [
      columnWidths,
      hasRowActions,
      hasRowSelection,
      orderedVisibleColumns,
      selectionColumnWidth,
      table.fixedColumnWidths,
    ],
  );

  const groupLabelOffsetPx = React.useMemo(() => {
    if (!groupingConfig || !hasRowSelection) return undefined;
    const anchorId =
      groupingConfig.labelColumnId ?? orderedVisibleColumns[0]?.id;
    const anchorIndex = Math.max(
      0,
      orderedVisibleColumns.findIndex((column) => column.id === anchorId),
    );
    const leadingColumnWidth = orderedVisibleColumns
      .slice(0, anchorIndex)
      .reduce(
        (total, column) =>
          total + (columnWidths[column.id] ?? column.width ?? 180),
        0,
      );
    return (
      selectionColumnWidth +
      leadingColumnWidth +
      FIRST_SELECTED_CONTENT_INSET_PX
    );
  }, [
    columnWidths,
    groupingConfig,
    hasRowSelection,
    orderedVisibleColumns,
    selectionColumnWidth,
  ]);

  const columnGroupEndIds = React.useMemo(() => {
    const endIds = new Set<string>();
    for (const group of columnGroups ?? []) {
      const visibleIds = group.columnIds.filter((id) =>
        orderedVisibleColumns.some((column) => column.id === id),
      );
      const endId = visibleIds.at(-1);
      if (endId) endIds.add(endId);
    }
    return endIds;
  }, [columnGroups, orderedVisibleColumns]);

  const leftPinnedOffsets = React.useMemo(() => {
    let offset = 0;
    const result: Record<string, number> = {};
    for (const column of orderedVisibleColumns) {
      if (!columnPinning.left.includes(column.id)) continue;
      result[column.id] = offset;
      offset += columnWidths[column.id] ?? column.width ?? 180;
    }
    return result;
  }, [columnPinning.left, columnWidths, orderedVisibleColumns]);

  const rightPinnedOffsets = React.useMemo(() => {
    let offset = hasRowActions ? 50 : 0;
    const result: Record<string, number> = {};
    for (let index = orderedVisibleColumns.length - 1; index >= 0; index -= 1) {
      const column = orderedVisibleColumns[index];
      if (!columnPinning.right.includes(column.id)) continue;
      result[column.id] = offset;
      offset += columnWidths[column.id] ?? column.width ?? 180;
    }
    return result;
  }, [columnPinning.right, columnWidths, hasRowActions, orderedVisibleColumns]);

  const pinColumn = React.useCallback((columnId: string) => {
    setColumnPinning((prev) => {
      if (prev.left.includes(columnId)) {
        return {
          left: prev.left.filter((id) => id !== columnId),
          right: prev.right.filter((id) => id !== columnId),
        };
      }
      return {
        left: [...prev.left.filter((id) => id !== columnId), columnId],
        right: prev.right.filter((id) => id !== columnId),
      };
    });
  }, []);

  const handleColumnDragEnd = React.useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) return;

      const currentOrder = orderedVisibleColumns.map((column) => column.id);
      const oldIndex = currentOrder.indexOf(String(active.id));
      const newIndex = currentOrder.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;

      const reordered = arrayMove(currentOrder, oldIndex, newIndex);
      hasUserManagedColumnOrderRef.current = true;
      setColumnOrder(reordered);
      handleColumnVisibilityChange(reordered);
    },
    [handleColumnVisibilityChange, orderedVisibleColumns],
  );

  const handleRowDrop = React.useCallback(
    (targetRowId: string) => {
      if (!draggedRowId || draggedRowId === targetRowId) return;
      const currentOrder = rowOrderedItems.map((item) => table.getRowId(item));
      const oldIndex = currentOrder.indexOf(draggedRowId);
      const newIndex = currentOrder.indexOf(targetRowId);
      if (oldIndex < 0 || newIndex < 0) return;

      const reordered = [...currentOrder];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      setRowOrderIds(reordered);
      table.onRowOrderChange?.(reordered);
    },
    [draggedRowId, rowOrderedItems, table],
  );

  const toggleGroup = React.useCallback((groupValue: string) => {
    setCollapsedGroupValues((current) =>
      current.includes(groupValue)
        ? current.filter((value) => value !== groupValue)
        : [...current, groupValue],
    );
  }, []);

  const moveDraggedRowToGroup = React.useCallback(
    async (targetGroupValue: string) => {
      const onMoveToGroup = groupingConfig?.onMoveToGroup;
      if (!draggedRowId || !onMoveToGroup) return false;

      const item = rowOrderedItems.find(
        (candidate) => table.getRowId(candidate) === draggedRowId,
      );
      if (!item) return false;
      if (groupingConfig.getGroupValue(item) === targetGroupValue) return false;

      setMovingGroupRowId(draggedRowId);
      try {
        await onMoveToGroup(item, targetGroupValue);
        return true;
      } catch (error) {
        console.error("Failed to move a table row to a different group", error);
        toast.error("Could not move this item to that group", {
          description: "It is still in its original group.",
        });
        return true;
      } finally {
        setMovingGroupRowId(null);
        setDropTargetGroupValue(null);
        setDraggedRowId(null);
      }
    },
    [draggedRowId, groupingConfig, rowOrderedItems, table],
  );

  const handleDropOnRow = React.useCallback(
    (targetItem: T) => {
      const targetGroupValue = groupingConfig?.getGroupValue(targetItem);
      if (targetGroupValue && groupingConfig?.onMoveToGroup) {
        void moveDraggedRowToGroup(targetGroupValue).then((moved) => {
          if (!moved) handleRowDrop(table.getRowId(targetItem));
        });
        return;
      }
      handleRowDrop(table.getRowId(targetItem));
      setDraggedRowId(null);
    },
    [groupingConfig, handleRowDrop, moveDraggedRowToGroup, table],
  );

  const visibleLeftPinnedColumnIds = React.useMemo(
    () =>
      orderedVisibleColumns
        .map((column) => column.id)
        .filter((columnId) => columnPinning.left.includes(columnId)),
    [columnPinning.left, orderedVisibleColumns],
  );
  const visibleRightPinnedColumnIds = React.useMemo(
    () =>
      orderedVisibleColumns
        .map((column) => column.id)
        .filter((columnId) => columnPinning.right.includes(columnId)),
    [columnPinning.right, orderedVisibleColumns],
  );
  const lastLeftPinnedColumnId = visibleLeftPinnedColumnIds.at(-1);
  const firstRightPinnedColumnId = visibleRightPinnedColumnIds[0];
  const columnDndContextId = React.useId();
  const columnDndSensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
    useSensor(KeyboardSensor),
  );
  const columnSortableIds = React.useMemo(
    () => orderedVisibleColumns.map((column) => column.id),
    [orderedVisibleColumns],
  );
  // Split rows and fallback cards render values without headers — drop the
  // label-less grid chrome so the row leads with real content.
  const genericViewColumns = React.useMemo(
    () => resolveGenericViewColumns(orderedVisibleColumns),
    [orderedVisibleColumns],
  );
  // The pane has room for what the grid hides, so it lists every labeled
  // column (the initiative's Objective is hidden from the grid for width and
  // is the field a manager most often edits from the pane).
  const detailPaneColumns = React.useMemo(
    () => resolveDetailPaneColumns(table.columns, orderedVisibleColumns),
    [table.columns, orderedVisibleColumns],
  );
  const splitViewColumns = React.useMemo(
    () => resolveSplitViewColumns(orderedVisibleColumns, table.splitColumns),
    [orderedVisibleColumns, table.splitColumns],
  );
  const getPinnedStyle = React.useCallback(
    (columnId: string): React.CSSProperties | undefined => {
      if (!resolvedFeatures.enableColumnPinning) return undefined;
      if (columnPinning.left.includes(columnId)) {
        const isPinnedBoundary = columnId === lastLeftPinnedColumnId;
        return {
          position: "sticky",
          left: leftPinnedOffsets[columnId] ?? 0,
          zIndex: 2,
          background: "hsl(var(--background))",
          boxShadow: isPinnedBoundary
            ? "inset -1px 0 0 hsl(var(--border)), 6px 0 8px -8px rgba(15,23,42,0.35)"
            : undefined,
        };
      }
      if (columnPinning.right.includes(columnId)) {
        const isPinnedBoundary = columnId === firstRightPinnedColumnId;
        return {
          position: "sticky",
          right: rightPinnedOffsets[columnId] ?? 0,
          zIndex: 2,
          background: "hsl(var(--background))",
          boxShadow: isPinnedBoundary
            ? "inset 1px 0 0 hsl(var(--border)), -6px 0 8px -8px rgba(15,23,42,0.35)"
            : undefined,
        };
      }
      return undefined;
    },
    [
      columnPinning.left,
      columnPinning.right,
      firstRightPinnedColumnId,
      lastLeftPinnedColumnId,
      leftPinnedOffsets,
      resolvedFeatures.enableColumnPinning,
      rightPinnedOffsets,
    ],
  );

  const commitInlineEdit = React.useCallback(
    async (item: T, column: TableColumn<T>, rowId: string, value: string) => {
      const cellKey = `${rowId}::${column.id}`;
      const nextValue = value.trim();
      const currentValue =
        (table.controlledInlineEditing ? undefined : inlineEdits[cellKey]) ??
        column.editValue?.(item) ??
        "";

      if (nextValue === currentValue) {
        setEditingCell(null);
        setEditingValue("");
        return true;
      }

      // Tab moves focus and fires blur after keydown. Keep the actual mutation
      // single-flight so both browser events cannot submit the same cell twice.
      if (inlineEditCommitsRef.current.has(cellKey)) return;
      inlineEditCommitsRef.current.add(cellKey);

      try {
        setSavingCell({ rowId, columnId: column.id });
        if (column.onEdit) {
          const accepted = await column.onEdit(item, nextValue);
          if (accepted === false) return false;
        }
        if (!table.controlledInlineEditing) {
          setInlineEdits((prev) => ({ ...prev, [cellKey]: nextValue }));
          toast.success(`${column.label} updated`, {
            id: `unified-table-cell-updated-${column.id}`,
          });
        }
        return true;
      } catch (error) {
        toast.error("Cell update issue", {
          id: "unified-table-cell-update",
          description:
            error instanceof Error
              ? error.message
              : "The edited cell was restored because the save request did not complete.",
        });
      } finally {
        inlineEditCommitsRef.current.delete(cellKey);
        setEditingCell(null);
        setEditingValue("");
        setSavingCell(null);
      }
    },
    [inlineEdits, table.controlledInlineEditing],
  );

  const startInlineEdit = React.useCallback(
    (item: T, column: TableColumn<T>, surface: InlineEditSurface) => {
      if (!resolvedFeatures.enableInlineEditing) return;
      if (
        !column.editable ||
        !column.editValue ||
        column.isEditable?.(item) === false
      ) return;

      const rowId = table.getRowId(item);
      const cellKey = `${rowId}::${column.id}`;
      setEditingCell({ rowId, columnId: column.id, surface });
      setEditingValue(
        (table.controlledInlineEditing ? undefined : inlineEdits[cellKey]) ??
          column.editValue(item),
      );
    },
    [inlineEdits, resolvedFeatures.enableInlineEditing, table],
  );

  async function navigateInlineEdit(
    item: T,
    column: TableColumn<T>,
    direction: 1 | -1,
    value: string,
    surface: InlineEditSurface,
  ) {
    const visible = renderEntries.flatMap((entry) =>
      entry.kind === "row" && column.isEditable?.(entry.item) !== false
        ? [entry.item]
        : [],
    );
    const index = visible.findIndex(
      (row) => table.getRowId(row) === table.getRowId(item),
    );
    const next = index < 0 ? undefined : visible[index + direction];
    if (await commitInlineEdit(item, column, table.getRowId(item), value)) {
      if (next) startInlineEdit(next, column, surface);
    }
  }

  /**
   * One editable-value renderer for every surface that shows a column's value
   * for a single row: the table cell and the split view's detail pane. Owner
   * rule (2026-09-17): a column that edits in the table edits everywhere the
   * table shows it. The pane used to call `column.render` directly, so State
   * and Objective on /initiatives edited in the grid and were read-only in the
   * pane beside it. Callers pass alignment because the cell aligns numeric
   * columns right; the pane is always left-aligned.
   *
   * The editor mounts only on the surface that opened it. With the row side
   * panel open the grid cell and the panel show the same row and column; when
   * both mounted an autofocused editor, the second stole focus, the first
   * one's blur committed the unchanged value, and the edit closed before it
   * was seen (the panel's "Edit Job Title" on /directory/employees did nothing).
   */
  const renderInlineEditableValue = (
    item: T,
    column: TableColumn<T>,
    columnAlignment: TableColumnAlignment,
    surface: InlineEditSurface,
  ): ReactNode => {
    const rowId = table.getRowId(item);
    const isEditableCell =
      Boolean(resolvedFeatures.enableInlineEditing) &&
      Boolean(column.editable) &&
      column.isEditable?.(item) !== false &&
      Boolean(column.editValue);
    const isIconOnlyEdit =
      isEditableCell && shouldUseIconOnlyInlineEdit(column);
    return editingCell?.rowId === rowId &&
      editingCell.columnId === column.id &&
      editingCell.surface === surface &&
      isEditableCell ? (
      column.renderEditor ? (
        column.renderEditor({
          item,
          value: editingValue,
          onChange: setEditingValue,
          onCommit: (nextValue) =>
            void commitInlineEdit(
              item,
              column,
              rowId,
              nextValue ?? editingValue,
            ),
          onNavigate: (direction, nextValue) => {
            void navigateInlineEdit(
              item,
              column,
              direction,
              nextValue ?? editingValue,
              surface,
            );
          },
          onCancel: () => {
            column.onRevert?.(item);
            setEditingCell(null);
            setEditingValue("");
          },
        })
      ) : column.editType === "select" || column.editType === "boolean" ? (
        <InlineSelectEditor
          value={editingValue}
          options={
            column.editType === "boolean"
              ? (column.editOptions ?? BOOLEAN_EDIT_OPTIONS)
              : (column.editOptions ?? [])
          }
          placeholder={column.editEmptyLabel ?? `Select ${column.label}`}
          onChange={setEditingValue}
          onCommit={(nextValue) =>
            void commitInlineEdit(
              item,
              column,
              rowId,
              nextValue ?? editingValue,
            )
          }
        />
      ) : (
        <Input
          type={column.editInputType}
          variant="inline"
          className={cn(
            "h-8 w-full px-0 text-sm",
            columnAlignment === "right" && "text-right",
            columnAlignment === "center" && "text-center",
          )}
          value={editingValue}
          autoFocus
          disabled={
            savingCell?.rowId === rowId && savingCell.columnId === column.id
          }
          onChange={(event) => setEditingValue(event.target.value)}
          onClick={(event) => event.stopPropagation()}
          onBlur={() => commitInlineEdit(item, column, rowId, editingValue)}
          onFocus={
            column.editNavigation
              ? (event) => event.currentTarget.select()
              : undefined
          }
          onKeyDown={(event) => {
            if (
              column.editNavigation &&
              ["Enter", "ArrowDown", "ArrowUp"].includes(event.key)
            ) {
              event.preventDefault();
              void navigateInlineEdit(
                item,
                column,
                event.key === "ArrowUp" ? -1 : 1,
                editingValue,
                surface,
              );
              return;
            }
            if (event.key === "Enter") {
              event.preventDefault();
              void commitInlineEdit(item, column, rowId, editingValue);
            }
            if (event.key === "Escape") {
              event.preventDefault();
              column.onRevert?.(item);
              setEditingCell(null);
              setEditingValue("");
            }
            if (event.key === "Tab") {
              void commitInlineEdit(item, column, rowId, editingValue);
            }
          }}
        />
      )
    ) : isEditableCell ? (
      isIconOnlyEdit ? (
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="min-w-0 flex-1">{column.render(item)}</div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 opacity-0 transition-opacity hover:bg-transparent focus-visible:opacity-100 group-hover/cell:opacity-100 group-focus-within/cell:opacity-100"
            data-row-interactive="true"
            aria-label={`Edit ${column.label}`}
            title={`Edit ${column.label}`}
            onClick={(event) => {
              event.stopPropagation();
              startInlineEdit(item, column, surface);
            }}
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground/70" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "flex h-auto min-h-8 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-transparent px-0 py-0 font-normal hover:border-border hover:bg-transparent focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring",
            columnAlignment === "right" && "text-right",
            columnAlignment === "center" && "text-center",
            columnAlignment === "left" && "text-left",
          )}
          data-row-interactive="true"
          aria-label={`Edit ${column.label}`}
          title={`Edit ${column.label}`}
          onClick={(event) => {
            event.stopPropagation();
            startInlineEdit(item, column, surface);
          }}
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              columnAlignment === "right" && "text-right",
              columnAlignment === "center" && "text-center",
              columnAlignment === "left" && "text-left",
            )}
          >
            {column.render(item)}
          </span>
          <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity group-hover/cell:opacity-100 group-focus-within/cell:opacity-100" />
        </Button>
      )
    ) : (
      column.render(item)
    );
  };

  function renderMobileItems(items: T[]) {
    return (
      <MobileCardList<T>
        items={items}
        columns={table.controlledInlineEditing ? orderedVisibleColumns.map((column) => ({
          ...column,
          render: (item: T) =>
            renderInlineEditableValue(
              item,
              column,
              resolveColumnAlignment(column, "left"),
              "mobile",
            ),
        })) : orderedVisibleColumns}
        getRowId={table.getRowId}
        activeRowId={effectiveActiveRowId}
        editingRowId={
          table.highlightEditingRow && editingCell?.surface === "mobile"
            ? editingCell.rowId
            : undefined
        }
        onRowClick={table.onRowClick ? activateRow : undefined}
        allowRowClick={table.allowRowClick}
        selectedIds={hasRowSelection ? selectedIds : undefined}
        onSelectRow={hasRowSelection ? handleSelectRow : undefined}
        isFetching={data.isFetching}
        rowActions={table.rowActions}
        onView={table.onView}
        viewLabel={table.viewLabel}
        onEdit={table.onEdit}
        allowEdit={table.allowEdit}
        onDelete={table.onDelete ? handleDeleteIntent : undefined}
        allowDelete={table.allowDelete}
        hasRowActions={hasRowActions}
      />
    );
  }

  function renderGroupHeading(entry: Extract<RenderEntry, { kind: "group" }>) {
    return (
      <>
        {groupingConfig?.collapsible ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-full justify-start gap-1.5 px-0 text-xs font-semibold text-muted-foreground hover:bg-transparent"
            aria-expanded={!entry.collapsed}
            aria-label={`${entry.collapsed ? "Expand" : "Collapse"} ${entry.label}`}
            onClick={() => toggleGroup(entry.groupValue)}
          >
            {entry.collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{entry.label}</span>
            <span className="font-normal tabular-nums opacity-70">
              {entry.count}
            </span>
            {groupingConfig.getGroupStatus ? (
              <span className="ml-auto font-normal">
                {groupingConfig.getGroupStatus(
                  paginatedItems.filter(
                    (row) =>
                      groupingConfig.getGroupValue(row) === entry.groupValue,
                  ),
                  entry.groupValue,
                )}
              </span>
            ) : null}
          </Button>
        ) : (
          <>
            {entry.label}
            <span className="ml-2 font-normal tabular-nums opacity-70">
              {entry.count}
            </span>
          </>
        )}
      </>
    );
  }

  const rowVirtualizer = useVirtualizer({
    count: renderEntries.length,
    getScrollElement: () => tableScrollRef.current,
    estimateSize: () => 52,
    overscan: 8,
    enabled: resolvedFeatures.enableVirtualization && !groupingConfig,
  });

  const activateRow = React.useCallback(
    (item: T) => {
      if (table.allowRowClick && !table.allowRowClick(item)) return;
      tableScrollRef.current?.focus();
      setInternalActiveRowId(table.getRowId(item));
      table.onRowClick?.(item);
      const rowId = table.getRowId(item);
      rowRefs.current[rowId]?.scrollIntoView({ block: "nearest" });
      splitRowRefs.current[rowId]?.scrollIntoView({ block: "nearest" });
    },
    [table],
  );

  React.useEffect(() => {
    if (sidePanel?.keyboardNavigation === false || !isSidePanelOpen) return;

    const handleSidePanelKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        (event.key !== "ArrowDown" && event.key !== "ArrowUp")
      ) {
        return;
      }

      // The table's own handler already owns keyboard events from this region.
      if (tableScrollRef.current?.contains(event.target as Node)) return;
      if (
        shouldIgnoreSidePanelKeyboardTarget(
          event.target,
          document.activeElement,
        )
      ) {
        return;
      }

      const activeRowIndex = effectiveActiveRowId
        ? paginatedItems.findIndex(
            (item) => table.getRowId(item) === effectiveActiveRowId,
          )
        : -1;
      const nextIndex = getAdjacentSidePanelRowIndex({
        activeRowIndex,
        itemCount: paginatedItems.length,
        key: event.key as "ArrowDown" | "ArrowUp",
      });
      if (nextIndex === null) return;

      const nextItem = paginatedItems[nextIndex];
      if (!nextItem) return;
      event.preventDefault();
      activateRow(nextItem);
    };

    window.addEventListener("keydown", handleSidePanelKeyDown);
    return () => window.removeEventListener("keydown", handleSidePanelKeyDown);
  }, [
    activateRow,
    effectiveActiveRowId,
    isSidePanelOpen,
    paginatedItems,
    sidePanel?.keyboardNavigation,
    table,
  ]);

  React.useEffect(() => {
    if (!table.autoFocusOnLoad) return;
    if (!showTable || !shouldRenderTableView) return;

    const raf = window.requestAnimationFrame(() => {
      tableScrollRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [showTable, shouldRenderTableView, table.autoFocusOnLoad]);

  // Track horizontal-scroll position so the edge fades signal "more columns →"
  // (design-audit DA-001). Recomputes on scroll, viewport resize, and whenever the
  // rendered table changes width (column show/hide/resize, data load).
  const renderedRowCount = paginatedItems.length;
  const visibleColumnsKey = visibleColumns.join("|");
  React.useEffect(() => {
    const el = tableScrollRef.current;
    if (!el) {
      setTableScrollEdges((prev) =>
        sameScrollEdges(prev, NO_SCROLL_EDGES) ? prev : NO_SCROLL_EDGES,
      );
      return;
    }

    const update = () => {
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      const overflows = maxScroll > 1;
      const next = {
        left: overflows && el.scrollLeft > 1,
        right: overflows && el.scrollLeft < maxScroll - 1,
      };
      // Keep the same object when nothing moved: a fresh object is a
      // guaranteed re-render, and a re-render that rebuilds the row list
      // re-runs this effect (2026-09-23, React #185 on /change-events).
      setTableScrollEdges((prev) =>
        sameScrollEdges(prev, next) ? prev : next,
      );
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(update);
      observer.observe(el);
      const innerTable = el.querySelector("table");
      if (innerTable) observer.observe(innerTable);
    }

    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
    // Re-measure when the row count or the column set changes -- by value.
    // Depending on the arrays themselves re-ran this on every render that
    // rebuilt them, which is how it joined the #185 loop above. The
    // ResizeObserver covers every other size change.
  }, [showTable, shouldRenderTableView, renderedRowCount, visibleColumnsKey]);

  const handleTableKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    table.onTableKeyDown?.(event, paginatedItems);
    if (event.defaultPrevented || paginatedItems.length === 0) return;
    if (
      event.key !== "ArrowDown" &&
      event.key !== "ArrowUp" &&
      event.key !== "Tab"
    )
      return;
    if (
      event.target instanceof HTMLElement &&
      ["INPUT", "TEXTAREA"].includes(event.target.tagName)
    ) {
      return;
    }

    event.preventDefault();
    const currentIndex = effectiveActiveRowId
      ? paginatedItems.findIndex(
          (item) => table.getRowId(item) === effectiveActiveRowId,
        )
      : -1;
    const step =
      event.key === "ArrowUp" || (event.key === "Tab" && event.shiftKey)
        ? -1
        : 1;
    const fallbackStart = step > 0 ? 0 : paginatedItems.length - 1;
    const nextIndex =
      currentIndex < 0
        ? fallbackStart
        : Math.min(Math.max(currentIndex + step, 0), paginatedItems.length - 1);
    const nextItem = paginatedItems[nextIndex];
    if (!nextItem) return;
    activateRow(nextItem);
  };

  const handleColumnResizeStart = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>, columnId: string) => {
      const headerCell = event.currentTarget.closest("th");
      if (!(headerCell instanceof HTMLElement)) return;
      startColumnResize(
        event,
        columnId,
        headerCell.getBoundingClientRect().width,
      );
    },
    [startColumnResize],
  );

  const renderTableToolbar = (className?: string) => (
    <TableToolbar
      className={cn(
        toolbarInlineWithHeader ? "w-auto py-0" : "w-full lg:w-auto",
        className,
      )}
      totalItems={toolbar.totalItems}
      itemNoun={toolbar.itemNoun}
      filteredItems={
        dateRangeFilteredItems.length === data.items.length
          ? toolbar.filteredItems
          : dateRangeFilteredItems.length
      }
      selectedCount={effectiveSelectedCount}
      searchValue={toolbar.searchValue}
      onSearchChange={toolbar.onSearchChange}
      searchPlaceholder={toolbar.searchPlaceholder}
      currentView={viewSwitcherValue}
      onViewChange={handleViewChange}
      enabledViews={effectiveEnabledViews}
      viewSwitcherDisplay={toolbar.viewSwitcherDisplay}
      filters={effectiveToolbarFilters}
      activeFilters={activeFilters}
      onFilterChange={handleFilterChange}
      filterQuery={ruleFilteringEnabled ? activeFilterQuery : undefined}
      onFilterQueryChange={
        ruleFilteringEnabled ? handleFilterQueryChange : undefined
      }
      unsupportedFilterFields={unsupportedFilterFields}
      onClearFilters={handleClearFilters}
      columns={toolbarColumns}
      visibleColumns={visibleColumns}
      onColumnVisibilityChange={handleColumnVisibilityChange}
      columnOrder={columnOrder}
      onColumnOrderChange={handleToolbarColumnOrderChange}
      columnWidths={columnWidths}
      onColumnWidthsChange={setColumnWidths}
      sortOptions={table.columns.filter((column) => column.sortable !== false)}
      sortBy={effectiveSorting?.sortBy}
      sortDirection={effectiveSorting?.sortDirection}
      onSortChange={effectiveSorting?.onSortChange}
      groupByOptions={toolbar.groupByOptions}
      groupBy={toolbar.groupBy}
      onGroupByChange={toolbar.onGroupByChange}
      onExport={effectiveOnExport}
      onBulkDelete={effectiveBulkDelete}
      selectedAction={toolbar.selectedAction}
      onBulkEdit={hasBulkEdit ? () => setBulkEditDialogOpen(true) : undefined}
      mobilePanelActions={toolbar.mobilePanelActions}
      customActions={toolbar.customActions}
      leadingActions={toolbar.leadingActions}
      leftContent={toolbar.leftContent}
      density={density}
      onDensityChange={handleDensityChange}
      enableSearch={resolvedFeatures.enableSearch}
      enableViews={resolvedFeatures.enableViews}
      enableFilters={resolvedFeatures.enableFilters}
      enableColumnToggle={resolvedFeatures.enableColumnToggle}
      enableExport={resolvedFeatures.enableExport}
      enableBulkDelete={resolvedFeatures.enableBulkDelete && hasRowSelection}
      savedViewsScope={toolbar.savedViewsScope}
      savedViewsBuiltin={toolbar.savedViewsBuiltin}
      savedViewsDefaults={
        toolbar.savedViewsScope
          ? (toolbar.savedViewsDefaults ?? {
              visibleColumns: toolbarColumns
                .filter(
                  (column) =>
                    column.defaultVisible !== false || column.alwaysVisible,
                )
                .map((column) => column.id),
              columnOrder: toolbarColumns.map((column) => column.id),
              columnWidths: {},
              sortBy: effectiveSorting?.sortBy ?? null,
              sortDirection: effectiveSorting?.sortDirection ?? "asc",
              filters: {},
            })
          : undefined
      }
    />
  );

  const tableToolbar = hideToolbar ? null : renderTableToolbar();

  const isCompactDensity = density === "compact";

  // On phone and tablet viewports, force every button rendered through
  // `header.actions` into a 44×44 icon-only shape. We hide text via `text-[0]` (works for raw text nodes that
  // CSS can't otherwise target) and clamp the box to a square. SVG icons keep
  // their absolute `size-4` because the Button base styles size them in rem,
  // not em. Buttons that need to opt out can set `data-keep-text`.
  const mobileIconOnlyActions =
    "max-xl:[&_button:not([data-keep-text])]:!size-11 " +
    "max-xl:[&_button:not([data-keep-text])]:!p-0 " +
    "max-xl:[&_button:not([data-keep-text])]:!gap-0 " +
    "max-xl:[&_button:not([data-keep-text])]:!text-[0px] " +
    "max-xl:[&_button:not([data-keep-text])]:!justify-center";

  // Described actions render through the shared header contract and need
  // none of the selector surgery above — that exists only for the legacy
  // raw slot, where each page painted its own buttons (DESIGN.md §4).
  const describedHeaderActions =
    header.primary ||
    header.headerActions?.length ||
    header.overflow?.length ||
    header.headerExtras ? (
      <HeaderActions
        primary={header.primary}
        actions={header.headerActions}
        overflow={header.overflow}
      >
        {header.headerExtras}
      </HeaderActions>
    ) : null;

  const headerActionsSlot = header.create ? (
    <div className="flex items-center gap-1.5">
      {describedHeaderActions}
      <TablePageActions
        addOptions={header.create.options}
        addLabel={header.create.label}
        buttonLabel={header.create.buttonLabel}
        testId={header.create.testId}
      />
    </div>
  ) : (
    (describedHeaderActions ??
    (header.actions ? (
      <div className={cn("contents", mobileIconOnlyActions)}>
        {header.actions}
      </div>
    ) : null))
  );

  const shouldRenderHeader = Boolean(header.title) && !header.hidden;

  const headerContent = (
    <PageHeader
      title={header.title}
      // Render the title with `truncate` instead of PageHeader's default
      // `break-words`. Table-page headers place the toolbar inline with the
      // title (mobileActionsInline), and the toolbar is `shrink-0`, so in a
      // narrow container (e.g. the tablet 3-pane center column) the title's
      // flex column can be squeezed below one word's width — `break-words`
      // then shatters it one letter per line. Truncating fails gracefully to
      // an ellipsis and is a no-op on desktop where the title fits.
      // Scoped to the default variant: the `compact` variant renders the title
      // as a small Eyebrow, so passing titleContent there would wrongly replace
      // it with this large <h1>.
      titleContent={
        header.variant === "compact" ? undefined : (
          <div className="flex min-w-0 items-baseline gap-3">
            <h1 className="truncate text-xl font-medium text-foreground/90 sm:text-3xl lg:text-[2rem]">
              {header.title}
            </h1>
            {header.titleMeta ? (
              <span className="shrink-0 text-xs text-muted-foreground">
                {header.titleMeta}
              </span>
            ) : null}
          </div>
        )
      }
      eyebrow={header.eyebrow}
      description={isCompactDensity ? undefined : header.description}
      variant={header.variant}
      mobileActionsInline={header.mobileActionsInline ?? true}
      className={cn(
        "mb-2 px-0 sm:px-0 lg:px-0",
        isCompactDensity && "[&>div]:pt-2 [&>div]:pb-2",
        isFullBleedTable && alignHeaderWithFullBleedTable && "mx-0",
      )}
      titleClassName={header.titleClassName}
      actions={
        toolbarInlineWithHeader ? (
          <div className={TABLE_INLINE_HEADER_ACTIONS_CLASSNAME}>
            <div className="min-w-0 flex-1">{tableToolbar}</div>
            {headerActionsSlot}
          </div>
        ) : toolbarWithTabs ? (
          // Toolbar lives on the tabs row at all widths — no duplicate in the header.
          headerActionsSlot
        ) : headerActionsSlot ? (
          // On phones (< md) the toolbar collapses to a single settings sheet
          // trigger. Normalize it and the primary action to the SAME 44px round
          // button so they read as one proportional set instead of a heavy
          // filled square next to a bare glyph. The secondary gets a soft tonal
          // fill; the primary keeps its accent. Icons are pinned to one size and
          // any button label is collapsed (`text-[0]`) so both are icon-only.
          <div className="flex items-center gap-2 max-md:gap-2">
            {/* `:has(svg)` scopes the round-icon treatment to icon-bearing
                buttons only, so a text-only header action degrades to its normal
                label instead of collapsing to an empty circle. */}
            <div className="contents max-xl:[&_button:has(svg)]:h-11 max-xl:[&_button:has(svg)]:w-11 max-xl:[&_button:has(svg)]:justify-center max-xl:[&_button:has(svg)]:gap-0 max-xl:[&_button:has(svg)]:rounded-full max-xl:[&_button:has(svg)]:p-0 max-xl:[&_button:has(svg)]:text-[0px] max-xl:[&_svg]:h-5 max-xl:[&_svg]:w-5">
              {headerActionsSlot}
            </div>
            <div className="contents max-xl:[&_button:has(svg)]:h-11 max-xl:[&_button:has(svg)]:w-11 max-xl:[&_button:has(svg)]:justify-center max-xl:[&_button:has(svg)]:gap-0 max-xl:[&_button:has(svg)]:rounded-full max-xl:[&_button:has(svg)]:bg-muted max-xl:[&_button:has(svg)]:p-0 max-xl:[&_button:has(svg)]:text-[0px] max-xl:[&_button:has(svg)]:text-muted-foreground max-xl:[&_button:has(svg)]:shadow-none max-xl:[&_button:has(svg):hover]:bg-muted/70 max-xl:[&_svg]:h-5 max-xl:[&_svg]:w-5">
              {!hideToolbar
                ? renderTableToolbar(TABLE_HEADER_MOBILE_TOOLBAR_CLASSNAME)
                : null}
            </div>
          </div>
        ) : !hideToolbar ? (
          renderTableToolbar(TABLE_HEADER_MOBILE_TOOLBAR_CLASSNAME)
        ) : null
      }
    />
  );

  const shouldPortalToolbar =
    !hideToolbar && Boolean(toolbar.portalContainerId);
  const toolbarPortalContainer =
    shouldPortalToolbar && typeof document !== "undefined"
      ? document.getElementById(toolbar.portalContainerId!)
      : null;
  const portaledToolbar =
    shouldPortalToolbar && toolbarPortalContainer
      ? createPortal(renderTableToolbar("w-auto py-0"), toolbarPortalContainer)
      : null;

  // Split content into "above table" (header, tabs, toolbar) and "table area" so
  // the side panel grid can align its top with the table, not the page header.
  const aboveTableContent = (
    <>
      {shouldRenderHeader ? headerContent : null}
      {(tabs || (!toolbarInlineWithHeader && !hideToolbar)) && (
        <div
          className={cn(
            toolbarWithTabs
              ? // Keep tabs + toolbar on one horizontal row at EVERY width.
                "flex flex-row items-center justify-between gap-2"
              : cn(
                  "flex flex-col gap-2",
                  tabs
                    ? "md:flex-row md:items-center md:justify-between md:gap-4"
                    : "md:flex-row md:items-center md:justify-end md:gap-4",
                ),
            isCompactDensity
              ? "pb-1 pt-0"
              : cn(
                  tabs ? TABLE_TABBED_CONTENT_GAP_CLASSNAME : "pb-3",
                  containerPadding ? "pt-1 sm:pt-2" : "pt-0",
                ),
          )}
        >
          {tabs && (
            <PageTabs
              tabs={tabs}
              variant="inline"
              className={TABLE_INLINE_PAGE_TABS_CLASSNAME}
            />
          )}
          {!toolbarInlineWithHeader && !shouldPortalToolbar && !hideToolbar ? (
            <div
              className={cn(
                toolbarWithTabs
                  ? "flex min-w-0 justify-end"
                  : aboveTableToolbarClassName(header.hidden),
                tabs ? "self-center md:shrink-0" : "md:shrink-0",
              )}
            >
              {toolbarWithTabs
                ? renderTableToolbar("w-auto py-0")
                : tableToolbar}
            </div>
          ) : null}
        </div>
      )}
    </>
  );

  const splitWorkspaceRailHeader = usesGenericSplitWorkspace ? (
    <SplitPageWorkspaceRailHeader
      title={
        <>
          {header.title}
          {header.titleMeta ? (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {header.titleMeta}
            </span>
          ) : null}
        </>
      }
      description={isCompactDensity ? undefined : header.description}
      actions={headerActionsSlot}
      selection={hasRowSelection ? {
        checked: allSelected ? true : someSelected ? "indeterminate" : false,
        onCheckedChange: handleSelectAll,
        disabled: rowOrderedItems.length === 0,
        "aria-label": "Select all rows",
      } : undefined}
    >
      {tabs || !shouldPortalToolbar ? (
        <div className="mt-3 flex min-w-0 flex-col gap-2">
          {tabs ? (
            <PageTabs
              tabs={tabs}
              variant="inline"
              className={TABLE_INLINE_PAGE_TABS_CLASSNAME}
            />
          ) : null}
          {!shouldPortalToolbar ? (
            <div className="min-w-0">{tableToolbar}</div>
          ) : null}
        </div>
      ) : null}
    </SplitPageWorkspaceRailHeader>
  ) : null;

  const activeItem = rowOrderedItems.find(
    (item) => table.getRowId(item) === effectiveActiveRowId,
  );

  // One field list for every selected-item surface: the split view's
  // detail pane and the row-click side panel both render the record
  // through this, so wiring `editable` on a column edits it in the
  // grid and in whichever pane shows it (DESIGN.md §5, #1253).
  const renderDetailPaneFields = (item: T) => (
    <div className="max-w-3xl">
      {detailPaneColumns.map((column) => {
        const isEditableField =
          Boolean(resolvedFeatures.enableInlineEditing) &&
          Boolean(column.editable) &&
          column.isEditable?.(item) !== false &&
          Boolean(column.editValue);
        const isIconOnlyField =
          isEditableField && shouldUseIconOnlyInlineEdit(column);
        return (
          <div
            key={column.id}
            data-editable-cell={isEditableField ? "true" : undefined}
            className="grid grid-cols-[9rem_minmax(0,1fr)] gap-5 py-3 text-sm"
          >
            <span className="text-muted-foreground">{column.label}</span>
            <div
              className={cn(
                "group/cell min-w-0",
                isEditableField &&
                  !isIconOnlyField &&
                  "cursor-text rounded-sm transition-colors hover:bg-muted/50 focus-within:bg-muted/40",
              )}
              onClick={(event) => {
                if (!isEditableField || isIconOnlyField) return;
                if (isInteractiveRowTarget(event.target)) return;
                event.stopPropagation();
                startInlineEdit(item, column, "pane");
              }}
            >
              {renderInlineEditableValue(item, column, "left", "pane")}
            </div>
          </div>
        );
      })}
    </div>
  );

  // What the row-click side panel shows: a whole-pane `content` when the page
  // supplies one, otherwise the shared column fields; `body` appends below.
  const sidePanelChildren = sidePanel ? (
    <>
      {sidePanel.content !== undefined
        ? sidePanel.content
        : activeItem
          ? renderDetailPaneFields(activeItem)
          : null}
      {sidePanel.body}
    </>
  ) : null;

  const tableAreaContent = (
    <>
      {persistentTopContent ? (
        <div className="mt-4 space-y-4">{persistentTopContent}</div>
      ) : null}

      {data.isLoading && (
        <div className="mt-4 space-y-2 py-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {data.error && (
        <div className="mt-4 text-center py-12">
          <p className="text-destructive">{data.error.message}</p>
        </div>
      )}

      {topContent && !data.isLoading && !data.error && (
        <div className="mt-4 space-y-4">{topContent}</div>
      )}

      {showEmptyState && (
        <div className="mt-4">
          <EmptyState
            icon={emptyState.icon ?? <Inbox />}
            title={emptyState.title}
            description={
              isFiltered
                ? emptyState.filteredDescription
                : emptyState.description
            }
            action={!isFiltered ? emptyState.action : undefined}
          />
        </div>
      )}

      {/* Mobile card view */}
      {showTable &&
        shouldRenderTableView &&
        (groupingConfig?.indentItems ? (
          <div className="sm:hidden space-y-3">
            {[
              ...new Set(
                paginatedItems.map((item) =>
                  groupingConfig.getGroupValue(item),
                ),
              ),
            ]
              .sort((left, right) => left.localeCompare(right))
              .map((groupValue) => {
                const entry = renderEntries.find(
                  (
                    candidate,
                  ): candidate is Extract<RenderEntry, { kind: "group" }> =>
                    candidate.kind === "group" &&
                    candidate.groupValue === groupValue,
                );
                const groupItems = paginatedItems.filter(
                  (item) => groupingConfig.getGroupValue(item) === groupValue,
                );
                const collapsed = collapsedGroupValues.includes(groupValue);
                return (
                  <React.Fragment key={`mobile-group::${groupValue}`}>
                    {entry ? (
                      <div className="bg-muted/40 text-muted-foreground font-semibold">
                        {renderGroupHeading(entry)}
                      </div>
                    ) : null}
                    {!collapsed && renderMobileItems(groupItems)}
                  </React.Fragment>
                );
              })}
          </div>
        ) : (
          renderMobileItems(paginatedItems)
        ))}

      {/* Desktop table view */}
      {showTable && shouldRenderTableView && (
        <div
          className={cn(
            "relative hidden sm:block",
            shouldBleedTableRight && TABLE_RIGHT_BLEED_SCROLL_SHELL_CLASSNAME,
            data.isFetching && "opacity-70",
          )}
        >
          {/* Edge fades — signal that the table scrolls horizontally so a
              partially-visible trailing column reads as "more →", not a broken
              clip (design-audit DA-001). */}
          {tableScrollEdges.left ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 z-20 w-8 bg-gradient-to-r from-background to-transparent"
            />
          ) : null}
          {tableScrollEdges.right ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 z-20 w-10 bg-gradient-to-l from-background to-transparent"
            />
          ) : null}
          <div
            id={tableScrollViewportId}
            data-slot="unified-table-scroll-viewport"
            className={cn(
              // `scrollbar-hide`: the sticky TableHorizontalScrollbar below is
              // the one visible scroll control; a native bar here would sit at
              // the bottom of the last row, off-screen on any tall table.
              "overflow-x-auto pb-3 scrollbar-hide focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border/70",
              shouldUseFullBleedDesktopScrollShell &&
                TABLE_FULL_BLEED_SCROLL_SHELL_CLASSNAME,
              removeTableFrame ? "border-0 rounded-none" : "",
              sidePanel
                ? removeTableFrame
                  ? "mx-0 pl-0"
                  : "mx-0 pl-0"
                : isFullBleedTable
                  ? "mx-0"
                  : "mx-0",
            )}
            tabIndex={0}
            onKeyDown={handleTableKeyDown}
            onClick={() => tableScrollRef.current?.focus()}
            ref={tableScrollRef}
            style={
              resolvedFeatures.enableVirtualization
                ? { maxHeight: 640, overflowY: "auto" }
                : undefined
            }
          >
            <DndContext
              id={columnDndContextId}
              sensors={columnDndSensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToHorizontalAxis]}
              onDragEnd={handleColumnDragEnd}
            >
              <Table
                scrollContainer="parent"
                className={cn(
                  density === "compact" &&
                    "[&_thead_tr]:h-8 [&_th]:py-1 [&_th]:px-3 [&_td]:py-1 [&_td]:px-3 [&_td]:text-xs [&_th:has([role=checkbox])]:pl-0 [&_td:has([role=checkbox])]:pl-0",
                  density === "comfortable" &&
                    "[&_thead_tr]:h-14 [&_th]:py-4 [&_th]:px-4 [&_td]:py-4 [&_td]:px-4 [&_th:has([role=checkbox])]:pl-0 [&_td:has([role=checkbox])]:pl-0",
                  isFullBleedTable &&
                    !hasRowSelection &&
                    "[&_th:first-child]:pl-0 [&_td:first-child]:pl-0 [&_th:last-child]:pr-0 [&_td:last-child]:pr-0",
                )}
                style={
                  layout?.minWidth || tableGeometry
                    ? {
                        ...(layout?.minWidth
                          ? { minWidth: layout.minWidth }
                          : undefined),
                        ...tableGeometry,
                      }
                    : undefined
                }
              >
                <TableHeader
                  className={cn(
                    table.stickyHeader !== false && "sticky top-0 z-20 bg-card",
                  )}
                >
                  {columnGroups && columnGroups.length > 0 && (
                    <TableRow className="border-b-0">
                      {hasRowSelection && (
                        <TableHead
                          style={{
                            width: selectionColumnWidth,
                            minWidth: selectionColumnWidth,
                            maxWidth: selectionColumnWidth,
                          }}
                          className=""
                        />
                      )}
                      {columnGroups.map((group) => {
                        const visibleCount = group.columnIds.filter((id) =>
                          orderedVisibleColumns.some((col) => col.id === id),
                        ).length;
                        if (visibleCount === 0) return null;
                        return (
                          <TableHead
                            key={`group-${group.label}-${group.columnIds.join("-")}`}
                            colSpan={visibleCount}
                            className={cn(
                              "border-x border-b border-border/70 px-2 py-0 text-left text-[11px] font-medium leading-tight text-muted-foreground normal-case",
                            )}
                          >
                            {group.label}
                          </TableHead>
                        );
                      })}
                      {hasRowActions && (
                        <TableHead
                          className={cn(
                            "w-[56px] pl-2",
                            sidePanel ? "pr-4" : "pr-2",
                          )}
                        />
                      )}
                    </TableRow>
                  )}
                  <TableRow className="border-border/80">
                    {hasRowSelection && (
                      <TableHead
                        className="pl-0 pr-2"
                        style={{
                          width: selectionColumnWidth,
                          minWidth: selectionColumnWidth,
                          maxWidth: selectionColumnWidth,
                        }}
                      >
                        <div className="flex items-center justify-center">
                          {!usesGenericSplitWorkspace && <Checkbox
                            checked={
                              allSelected
                                ? true
                                : someSelected
                                  ? "indeterminate"
                                  : false
                            }
                            onCheckedChange={(checked) =>
                              handleSelectAll(Boolean(checked))
                            }
                            aria-label="Select all rows"
                          />}
                        </div>
                      </TableHead>
                    )}
                    <SortableContext
                      items={columnSortableIds}
                      strategy={horizontalListSortingStrategy}
                    >
                      {orderedVisibleColumns.map((column) => {
                        const isSortable =
                          column.sortable !== false &&
                          Boolean(effectiveSorting);
                        const isHideable = !column.alwaysVisible;
                        const columnAlignment = resolveColumnAlignment(
                          column,
                          headerAlignment,
                        );
                        const width = columnWidths[column.id] ?? column.width;
                        const headerPinnedStyle =
                          getPinnedStyle(column.id) ?? undefined;
                        const columnStyle =
                          width || headerPinnedStyle
                            ? ({
                                width,
                                minWidth:
                                  columnWidths[column.id] ?? column.width,
                                maxWidth:
                                  column.width && !columnWidths[column.id]
                                    ? column.width
                                    : undefined,
                                ...headerPinnedStyle,
                              } as React.CSSProperties)
                            : undefined;
                        const hasContextActions =
                          isSortable ||
                          isHideable ||
                          resolvedFeatures.enableColumnPinning;

                        return (
                          <SortableColumnHead
                            key={column.id}
                            id={column.id}
                            disabled={!resolvedFeatures.enableColumnReorder}
                            className={cn(
                              "relative align-middle data-[dragging=true]:shadow-sm",
                              column.traceState === "active" && "bg-muted",
                              column.traceState === "precedent" &&
                                "bg-muted/70",
                              columnAlignment === "right"
                                ? "text-right"
                                : columnAlignment === "center"
                                  ? "text-center"
                                  : "text-left",
                              isSortable && "cursor-pointer",
                              columnGroupEndIds.has(column.id) &&
                                "border-r border-border/70",
                              (isSortable ||
                                resolvedFeatures.enableColumnReorder) &&
                                "select-none group/th",
                            )}
                            traceState={column.traceState}
                            ariaSort={
                              isSortable
                                ? effectiveSorting?.sortBy === column.id
                                  ? effectiveSorting.sortDirection === "asc"
                                    ? "ascending"
                                    : "descending"
                                  : "none"
                                : undefined
                            }
                            style={columnStyle}
                            onClick={() => {
                              // A resize drag ends with a synthetic click on the
                              // <th> (the handle is a child). Consume it so the
                              // resize doesn't also re-sort the column.
                              if (didResizeRef.current) {
                                didResizeRef.current = false;
                                return;
                              }
                              if (isSortable) {
                                handleSortClick(column.id);
                              }
                            }}
                            onContextMenu={(e) => {
                              if (!isHideable) return;
                              e.preventDefault();
                              const btn =
                                e.currentTarget.querySelector<HTMLButtonElement>(
                                  "button[type='button']",
                                );
                              btn?.click();
                            }}
                          >
                            {({ attributes, listeners }) => {
                              const dragHandle =
                                resolvedFeatures.enableColumnReorder ? (
                                  <span
                                    {...attributes}
                                    {...listeners}
                                    aria-label={`Drag ${column.label} column`}
                                    title="Drag to reorder column"
                                    className="ml-1 inline-flex h-4 w-4 shrink-0 cursor-grab items-center justify-center rounded-sm text-muted-foreground/40 opacity-0 transition-[color,opacity] hover:text-muted-foreground group-hover/th:opacity-100 group-focus-within/th:opacity-100 active:cursor-grabbing"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <GripVertical
                                      className="h-3.5 w-3.5"
                                      aria-hidden="true"
                                    />
                                  </span>
                                ) : null;

                              return (
                                <>
                                  {hasContextActions ? (
                                    <div className="flex items-center w-full">
                                      {columnAlignment === "right" &&
                                        dragHandle}
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            className={cn(
                                              "h-auto gap-1.5 p-0 has-[>svg]:px-0 font-medium",
                                              "text-xs",
                                              "flex-1 min-w-0",
                                              "overflow-visible",
                                              "text-muted-foreground hover:bg-transparent hover:text-foreground focus-visible:ring-0 data-[state=open]:bg-transparent data-[state=open]:text-foreground",
                                              columnAlignment === "right"
                                                ? "justify-end"
                                                : columnAlignment === "center"
                                                  ? "justify-center"
                                                  : "justify-start",
                                            )}
                                            onContextMenu={(event) => {
                                              event.preventDefault();
                                              event.currentTarget.click();
                                            }}
                                          >
                                            {/* Right-aligned headers place the sort
                                                indicator BEFORE the label so the label
                                                stays flush with the column's right edge,
                                                matching the right-aligned numeric cells. */}
                                            {columnAlignment === "right" &&
                                              isSortable &&
                                              column.showSortIcon !== false &&
                                              renderSortIcon(column.id)}
                                            {renderColumnHeaderLabel(column)}
                                            {columnAlignment !== "right" &&
                                              isSortable &&
                                              column.showSortIcon !== false &&
                                              renderSortIcon(column.id)}
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                          {column.description ? (
                                            <div className="max-w-xs px-2 py-1.5 text-xs leading-relaxed text-muted-foreground">
                                              {column.description}
                                            </div>
                                          ) : null}
                                          {isSortable && (
                                            <>
                                              <DropdownMenuItem
                                                onClick={(event) => {
                                                  event.stopPropagation();
                                                  effectiveSorting?.onSortChange(
                                                    column.id,
                                                    "asc",
                                                  );
                                                }}
                                              >
                                                <ArrowUp className="mr-2 h-3.5 w-3.5" />
                                                Sort ascending
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={(event) => {
                                                  event.stopPropagation();
                                                  effectiveSorting?.onSortChange(
                                                    column.id,
                                                    "desc",
                                                  );
                                                }}
                                              >
                                                <ArrowDown className="mr-2 h-3.5 w-3.5" />
                                                Sort descending
                                              </DropdownMenuItem>
                                            </>
                                          )}
                                          {resolvedFeatures.enableColumnPinning && (
                                            <>
                                              {isSortable && (
                                                <DropdownMenuSeparator />
                                              )}
                                              <DropdownMenuItem
                                                onClick={(event) => {
                                                  event.stopPropagation();
                                                  pinColumn(column.id);
                                                }}
                                              >
                                                {columnPinning.left.includes(
                                                  column.id,
                                                ) ? (
                                                  <>
                                                    <PinOff className="mr-2 h-3.5 w-3.5" />
                                                    Unpin column
                                                  </>
                                                ) : (
                                                  <>
                                                    <Pin className="mr-2 h-3.5 w-3.5" />
                                                    Pin column
                                                  </>
                                                )}
                                              </DropdownMenuItem>
                                            </>
                                          )}
                                          {isHideable && (
                                            <>
                                              {(isSortable ||
                                                resolvedFeatures.enableColumnPinning) && (
                                                <DropdownMenuSeparator />
                                              )}
                                              <DropdownMenuItem
                                                onClick={(event) => {
                                                  event.stopPropagation();
                                                  hideColumn(column.id);
                                                }}
                                              >
                                                <EyeOff className="mr-2 h-3.5 w-3.5" />
                                                Hide column
                                              </DropdownMenuItem>
                                            </>
                                          )}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                      {column.headerAccessory}
                                      {columnAlignment !== "right" &&
                                        dragHandle}
                                    </div>
                                  ) : (
                                    <div
                                      className={cn(
                                        "flex items-center gap-1.5",
                                        LABEL_HEADING_CLASS,
                                        "w-full",
                                        "overflow-visible",
                                        columnAlignment === "right"
                                          ? "justify-end"
                                          : columnAlignment === "center"
                                            ? "justify-center"
                                            : "justify-start",
                                      )}
                                    >
                                      {columnAlignment === "right" &&
                                        dragHandle}
                                      {renderColumnHeaderLabel(column)}
                                      {columnAlignment !== "right" &&
                                        dragHandle}
                                    </div>
                                  )}
                                  <ColumnResizeHandle
                                    columnId={column.id}
                                    onResizeStart={(event) =>
                                      handleColumnResizeStart(event, column.id)
                                    }
                                  />
                                </>
                              );
                            }}
                          </SortableColumnHead>
                        );
                      })}
                    </SortableContext>
                    {hasRowActions && (
                      <TableHead
                        className={cn(
                          "w-[56px] pl-2",
                          sidePanel ? "pr-4" : "pr-2",
                        )}
                      />
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody
                  style={
                    resolvedFeatures.enableVirtualization && !groupingConfig
                      ? ({
                          position: "relative",
                          height: `${rowVirtualizer.getTotalSize()}px`,
                        } as React.CSSProperties)
                      : undefined
                  }
                >
                  {(resolvedFeatures.enableVirtualization && !groupingConfig
                    ? rowVirtualizer.getVirtualItems().map((virtualRow) => ({
                        entry: {
                          kind: "row" as const,
                          key: table.getRowId(
                            paginatedItems[virtualRow.index]!,
                          ),
                          item: paginatedItems[virtualRow.index]!,
                        },
                        key: table.getRowId(paginatedItems[virtualRow.index]!),
                        style: {
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          transform: `translateY(${virtualRow.start}px)`,
                          height: `${virtualRow.size}px`,
                        } as React.CSSProperties,
                      }))
                    : renderEntries.map((entry) => ({
                        entry,
                        key: entry.key,
                        style: undefined,
                      }))
                  ).map(({ entry, key, style }) => {
                    if (entry.kind === "newRow") {
                      const newRow = table.newRow;
                      if (!newRow) return null;
                      return (
                        <UnifiedTableNewRow
                          key={key}
                          colSpan={
                            orderedVisibleColumns.length +
                            (hasRowSelection ? 1 : 0) +
                            (hasRowActions ? 1 : 0)
                          }
                          placeholder={newRow.placeholder}
                          groupValue={entry.groupValue}
                          onCreate={newRow.onCreate}
                        />
                      );
                    }

                    if (entry.kind === "group") {
                      const isGroupDropTarget =
                        dropTargetGroupValue === entry.groupValue;
                      return (
                        <TableRow
                          key={key}
                          className={cn(
                            "hover:bg-transparent",
                            isGroupDropTarget && "bg-muted",
                          )}
                          onDragOver={(event) => {
                            if (!groupingConfig?.onMoveToGroup || !draggedRowId)
                              return;
                            event.preventDefault();
                            setDropTargetGroupValue(entry.groupValue);
                          }}
                          onDragLeave={() => {
                            if (isGroupDropTarget)
                              setDropTargetGroupValue(null);
                          }}
                          onDrop={() => {
                            void moveDraggedRowToGroup(entry.groupValue);
                          }}
                        >
                          <TableCell
                            colSpan={
                              orderedVisibleColumns.length +
                              (hasRowSelection ? 1 : 0) +
                              (hasRowActions ? 1 : 0)
                            }
                            className="bg-muted/40 !px-1 !py-1 text-xs font-semibold text-muted-foreground"
                            style={
                              groupLabelOffsetPx === undefined
                                ? undefined
                                : { paddingLeft: groupLabelOffsetPx }
                            }
                          >
                            {renderGroupHeading(entry)}
                          </TableCell>
                        </TableRow>
                      );
                    }

                    if (entry.kind === "groupFooter") {
                      return (
                        <React.Fragment key={key}>
                          {entry.footer}
                        </React.Fragment>
                      );
                    }

                    if (entry.kind === "groupGap") {
                      return (
                        <TableRow
                          key={key}
                          className={cn(
                            "border-0 hover:bg-transparent",
                            groupingConfig?.groupFooterGap === "md"
                              ? "h-4"
                              : "h-3",
                          )}
                        >
                          <TableCell
                            colSpan={
                              orderedVisibleColumns.length +
                              (hasRowSelection ? 1 : 0) +
                              (hasRowActions ? 1 : 0)
                            }
                            className="p-0"
                          />
                        </TableRow>
                      );
                    }

                    const item = entry.item;
                    const rowClickable =
                      Boolean(table.onRowClick) &&
                      (!table.allowRowClick || table.allowRowClick(item));
                    return (
                      <React.Fragment key={key}>
                        <TableRow
                          ref={(element) => {
                            rowRefs.current[key] = element;
                          }}
                          className={cn(
                            "group/row transition-colors duration-150",
                            table.highlightEditingRow &&
                              editingCell?.rowId === table.getRowId(item) &&
                              "bg-muted border-l-2 border-l-primary",
                            rowClickable && "cursor-pointer hover:bg-muted/40",
                            effectiveActiveRowId === table.getRowId(item) &&
                              "bg-muted",
                            selectedIds.includes(table.getRowId(item)) &&
                              "bg-muted/50",
                            movingGroupRowId === table.getRowId(item) &&
                              "opacity-60",
                          )}
                          style={style}
                          draggable={canDragRows && !hasLeadingRowDragHandle}
                          onDragStart={() =>
                            setDraggedRowId(table.getRowId(item))
                          }
                          onDragOver={(event) => {
                            const canMoveToGroup = Boolean(
                              groupingConfig?.onMoveToGroup,
                            );
                            const canReorder =
                              resolvedFeatures.enableRowReorder &&
                              !effectiveSorting?.sortBy;
                            if (!canMoveToGroup && !canReorder) return;
                            event.preventDefault();
                          }}
                          onDrop={() => {
                            const canMoveToGroup = Boolean(
                              groupingConfig?.onMoveToGroup,
                            );
                            const canReorder =
                              resolvedFeatures.enableRowReorder &&
                              !effectiveSorting?.sortBy;
                            if (!canMoveToGroup && !canReorder) return;
                            handleDropOnRow(item);
                          }}
                          onDragEnd={() => setDraggedRowId(null)}
                          onClick={(event) => {
                            if (isInteractiveRowTarget(event.target)) {
                              return;
                            }
                            activateRow(item);
                          }}
                          tabIndex={rowClickable ? 0 : undefined}
                          onKeyDown={
                            rowClickable
                              ? (event) => {
                                  if (isInteractiveRowTarget(event.target)) {
                                    return;
                                  }
                                  if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                  ) {
                                    event.preventDefault();
                                    activateRow(item);
                                  }
                                }
                              : undefined
                          }
                        >
                          {hasRowSelection && (
                            <TableCell
                              className="pl-0 pr-2"
                              style={{
                                width: selectionColumnWidth,
                                minWidth: selectionColumnWidth,
                                maxWidth: selectionColumnWidth,
                              }}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <div
                                className={cn(
                                  "flex items-center gap-1",
                                  hasLeadingRowDragHandle
                                    ? "justify-start"
                                    : "justify-center",
                                )}
                              >
                                {hasLeadingRowDragHandle ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    draggable
                                    data-row-interactive="true"
                                    aria-label="Drag row"
                                    title="Drag to move to another group"
                                    className="h-6 w-5 shrink-0 cursor-grab p-0 text-muted-foreground/60 opacity-0 transition-opacity hover:bg-transparent hover:text-muted-foreground focus-visible:opacity-100 group-hover/row:opacity-100 group-focus-within/row:opacity-100 active:cursor-grabbing"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <GripVertical
                                      className="h-3.5 w-3.5"
                                      aria-hidden="true"
                                    />
                                  </Button>
                                ) : null}
                                <Checkbox
                                  checked={selectedIds.includes(
                                    table.getRowId(item),
                                  )}
                                  onCheckedChange={(checked) =>
                                    handleSelectRow(
                                      table.getRowId(item),
                                      Boolean(checked),
                                    )
                                  }
                                  aria-label="Select row"
                                />
                              </div>
                            </TableCell>
                          )}
                          {orderedVisibleColumns.map((column, index) => {
                            const columnAlignment = resolveColumnAlignment(
                              column,
                              "left",
                            );
                            const isEditableCell =
                              Boolean(resolvedFeatures.enableInlineEditing) &&
                              Boolean(column.editable) &&
                              column.isEditable?.(item) !== false &&
                              Boolean(column.editValue);
                            const isIconOnlyEdit =
                              isEditableCell &&
                              shouldUseIconOnlyInlineEdit(column);
                            return (
                              <TableCell
                                key={column.id}
                                data-table-leading-column={
                                  index === 0 ? "true" : undefined
                                }
                                data-editable-cell={
                                  isEditableCell ? "true" : undefined
                                }
                                style={
                                  columnWidths[column.id] ||
                                  column.width ||
                                  getPinnedStyle(column.id)
                                    ? ({
                                        width:
                                          columnWidths[column.id] ??
                                          column.width,
                                        minWidth:
                                          columnWidths[column.id] ??
                                          column.width,
                                        maxWidth:
                                          column.width &&
                                          !columnWidths[column.id]
                                            ? column.width
                                            : undefined,
                                        ...getPinnedStyle(column.id),
                                      } as React.CSSProperties)
                                    : undefined
                                }
                                className={cn(
                                  "group/cell relative align-middle",
                                  table.highlightEditingRow &&
                                    index === 0 &&
                                    editingCell?.rowId ===
                                      table.getRowId(item) &&
                                    "font-semibold",
                                  groupingConfig?.indentItems &&
                                    index === 0 &&
                                    "pl-6",
                                  column.traceState === "active" && "bg-muted",
                                  column.traceState === "precedent" &&
                                    "bg-muted/70",
                                  columnAlignment === "right"
                                    ? "text-right"
                                    : columnAlignment === "center"
                                      ? "text-center"
                                      : "text-left",
                                  isEditableCell &&
                                    !isIconOnlyEdit &&
                                    "cursor-text hover:bg-muted/50 transition-colors focus-within:bg-muted/40",
                                  isIconOnlyEdit && "focus-within:bg-muted/40",
                                )}
                                data-column-trace={column.traceState}
                                onClick={(event) => {
                                  if (!isEditableCell || isIconOnlyEdit) {
                                    return;
                                  }
                                  if (isInteractiveRowTarget(event.target)) {
                                    return;
                                  }
                                  event.stopPropagation();
                                  startInlineEdit(item, column, "grid");
                                }}
                              >
                                {renderInlineEditableValue(
                                  item,
                                  column,
                                  columnAlignment,
                                  "grid",
                                )}
                              </TableCell>
                            );
                          })}
                          {hasRowActions && (
                            <TableCell
                              className={cn(
                                "pl-2",
                                sidePanel ? "pr-4" : "pr-2",
                              )}
                              onClick={(event) => event.stopPropagation()}
                            >
                              {table.rowActions ? (
                                table.rowActions(item)
                              ) : table.onView ||
                                (table.onDelete && (table.allowDelete?.(item) ?? true)) ||
                                (table.onEdit && (table.allowEdit?.(item) ?? true)) ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      aria-label="Row actions"
                                    >
                                      <MoreVertical />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {table.onView && (
                                      <DropdownMenuItem
                                        onClick={() => table.onView!(item)}
                                      >
                                        <Eye className="mr-2 h-4 w-4" />
                                        {table.viewLabel ?? "View"}
                                      </DropdownMenuItem>
                                    )}
                                    {table.onView &&
                                    (table.onEdit || table.onDelete) ? (
                                      <DropdownMenuSeparator />
                                    ) : null}
                                    {table.onEdit &&
                                      (table.allowEdit?.(item) ?? true) && (
                                        <DropdownMenuItem
                                          onClick={() => table.onEdit!(item)}
                                        >
                                          <Pencil className="mr-2 h-4 w-4" />
                                          Edit
                                        </DropdownMenuItem>
                                      )}
                                    {table.onEdit &&
                                      (table.allowEdit?.(item) ?? true) &&
                                      table.onDelete &&
                                      (table.allowDelete?.(item) ?? true) && (
                                        <DropdownMenuSeparator />
                                      )}
                                    {table.onDelete &&
                                      (table.allowDelete?.(item) ?? true) && (
                                        <DropdownMenuItem
                                          className="text-destructive"
                                          onClick={() =>
                                            handleDeleteIntent(item)
                                          }
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : null}
                            </TableCell>
                          )}
                        </TableRow>
                        {!resolvedFeatures.enableVirtualization &&
                          table.renderExpandedRow?.(
                            item,
                            orderedVisibleColumns.length +
                              (hasRowSelection ? 1 : 0) +
                              (hasRowActions ? 1 : 0),
                            {
                              columns: orderedVisibleColumns.map((c) => ({
                                id: c.id,
                                width: columnWidths[c.id] ?? c.width,
                                align: resolveColumnAlignment(c, "left"),
                              })),
                              hasSelection: hasRowSelection,
                              hasActions: hasRowActions,
                            },
                          )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
                {footerTotals && (
                  <TableFooter>
                    <TableRow className={cn("font-medium", "bg-transparent")}>
                      {hasRowSelection && <TableCell />}
                      {orderedVisibleColumns.map((column, index) => {
                        const width = columnWidths[column.id];
                        const columnStyle = width
                          ? ({
                              width,
                              minWidth: width,
                              ...getPinnedStyle(column.id),
                            } as React.CSSProperties)
                          : undefined;
                        const columnAlignment = resolveColumnAlignment(
                          column,
                          "left",
                        );
                        const alignmentClass =
                          columnAlignment === "right"
                            ? "text-right"
                            : columnAlignment === "center"
                              ? "text-center"
                              : "text-left";
                        const value = footerTotals.values[column.id];
                        if (index === 0 && !value) {
                          return (
                            <TableCell
                              key={column.id}
                              className="font-semibold text-left"
                              style={columnStyle}
                            >
                              {footerTotals.label ?? "Totals"}
                            </TableCell>
                          );
                        }
                        return (
                          <TableCell
                            key={column.id}
                            className={cn("font-semibold", alignmentClass)}
                            style={columnStyle}
                          >
                            {value ?? null}
                          </TableCell>
                        );
                      })}
                      {hasRowActions && <TableCell />}
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </DndContext>
          </div>
          <TableHorizontalScrollbar
            viewportRef={tableScrollRef}
            controlsId={tableScrollViewportId}
            measureKey={`${paginatedItems.length}:${visibleColumns.length}`}
          />
        </div>
      )}

      {showTable &&
        canRenderBoardView &&
        (() => {
          const BoardRenderer = views?.board;
          if (BoardRenderer) {
            return (
              <div className="mt-4">
                {BoardRenderer({
                  items: rowOrderedItems,
                  getRowId: table.getRowId,
                  activeRowId: effectiveActiveRowId,
                  onRowClick: table.onRowClick,
                })}
              </div>
            );
          }

          const groupColumn = orderedVisibleColumns.find((column) =>
            /status|stage|phase|state|category/i.test(
              `${column.id} ${column.label}`,
            ),
          );
          const groups = new Map<string, T[]>();
          for (const item of rowOrderedItems) {
            const groupLabel = groupColumn
              ? resolveGenericColumnText(groupColumn, item)
              : "All items";
            groups.set(groupLabel, [...(groups.get(groupLabel) ?? []), item]);
          }

          return (
            <div className="mt-4 flex min-h-0 gap-4 overflow-x-auto pb-2">
              {Array.from(groups.entries()).map(([label, items]) => (
                <section key={label} className="w-80 shrink-0">
                  <div className="mb-2 flex items-center justify-between px-1 text-xs font-medium text-muted-foreground">
                    <span>{humanizeStatus(label)}</span>
                    <span className="tabular-nums">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((item) => {
                      const itemId = table.getRowId(item);
                      const primaryColumn = genericViewColumns[0];
                      return (
                        <div
                          key={itemId}
                          role="button"
                          tabIndex={0}
                          className={cn(
                            "cursor-pointer rounded-md border border-border/70 bg-background px-4 py-3 text-sm transition-colors hover:bg-muted/35",
                            effectiveActiveRowId === itemId && "bg-muted/50",
                          )}
                          onClick={() => activateRow(item)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              activateRow(item);
                            }
                          }}
                        >
                          {primaryColumn
                            ? resolveGenericColumnText(primaryColumn, item) ||
                              itemId
                            : itemId}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          );
        })()}

      {showTable &&
        canRenderCardView &&
        (() => {
          const CardView = views?.card;
          const groupFn = views?.cardGroupBy;
          const gridCls = cn(
            "grid",
            layout?.cardGridClassName ??
              "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
          );

          if (groupFn) {
            const groups = new Map<string, T[]>();
            for (const item of rowOrderedItems) {
              const key = groupFn(item);
              const arr = groups.get(key);
              if (arr) arr.push(item);
              else groups.set(key, [item]);
            }
            return (
              <div className="mt-4 space-y-6">
                {Array.from(groups.entries()).map(([label, items]) => (
                  <div key={label}>
                    <SectionRuleHeading
                      className="mb-3 px-0.5 pb-0"
                      label={label}
                    />
                    <div className={gridCls}>
                      {items.map((item) => (
                        <React.Fragment key={table.getRowId(item)}>
                          {CardView ? CardView(item) : null}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          }

          return (
            <div className={cn("mt-4", gridCls)}>
              {rowOrderedItems.map((item) => (
                <React.Fragment key={table.getRowId(item)}>
                  {CardView ? (
                    CardView(item)
                  ) : (
                    <article
                      role="button"
                      tabIndex={0}
                      className={cn(
                        "cursor-pointer rounded-md border border-border/70 bg-background p-4 transition-colors hover:bg-muted/35",
                        effectiveActiveRowId === table.getRowId(item) &&
                          "bg-muted/50",
                      )}
                      onClick={() => activateRow(item)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          activateRow(item);
                        }
                      }}
                    >
                      {genericViewColumns.slice(0, 4).map((column, index) => (
                        <div
                          key={column.id}
                          className={cn(
                            index === 0
                              ? "mb-3 text-sm font-semibold text-foreground"
                              : "mt-2 grid grid-cols-[6rem_minmax(0,1fr)] gap-3 text-xs",
                          )}
                        >
                          {index > 0 ? (
                            <span className="truncate text-muted-foreground">
                              {column.label}
                            </span>
                          ) : null}
                          <div className="min-w-0 truncate">
                            {resolveGenericColumnText(column, item)}
                          </div>
                        </div>
                      ))}
                    </article>
                  )}
                </React.Fragment>
              ))}
            </div>
          );
        })()}

      {showTable && canRenderListView && (
        <div className="mt-4 flex flex-col gap-2">
          {rowOrderedItems.map((item) => {
            const ListView = views?.list;
            const itemId = table.getRowId(item);
            return (
              <div
                key={itemId}
                ref={(node) => {
                  splitRowRefs.current[itemId] = node;
                }}
                data-unified-side-panel-row
              >
                {ListView ? ListView(item) : null}
              </div>
            );
          })}
        </div>
      )}

      {showTable &&
        canRenderCalendarView &&
        (() => {
          const CalendarRenderer = views?.calendar;
          return CalendarRenderer ? (
            <div className="mt-4">
              {CalendarRenderer({
                items: rowOrderedItems,
                getRowId: table.getRowId,
                activeRowId: effectiveActiveRowId,
                onRowClick: table.onRowClick,
              })}
            </div>
          ) : null;
        })()}

      {showTable &&
        canRenderTimelineView &&
        (() => {
          const TimelineRenderer = views?.timeline;
          return TimelineRenderer ? (
            <div className="mt-4">
              {TimelineRenderer({
                items: rowOrderedItems,
                getRowId: table.getRowId,
                activeRowId: effectiveActiveRowId,
                onRowClick: table.onRowClick,
              })}
            </div>
          ) : null;
        })()}

      {showTable &&
        canRenderSplitView &&
        (() => {
          const SplitView = views?.split;
          if (SplitView) {
            return (
              <div className={TABLE_SPLIT_VIEW_CONTAINER_CLASSNAME}>
                {SplitView({
                  items: rowOrderedItems,
                  getRowId: table.getRowId,
                  activeRowId: effectiveActiveRowId,
                  selectedIds,
                  onSelectRow: selection ? handleSelectRow : undefined,
                  onSelectAll: selection ? handleSelectAll : undefined,
                  onRowClick: table.onRowClick,
                })}
              </div>
            );
          }

          const selectedItem = activeItem ?? rowOrderedItems[0];

          const compactSplitTable = splitViewColumns.length > 1;
          // The split list is the table view in a narrower pane, so it carries
          // the same selection column — same width, same handlers, same
          // select-all semantics — and the toolbar's bulk actions work from it.
          // Width comes off the primary column so the fixed layout still sums
          // to 100% and nothing scrolls sideways.
          const splitPrimaryColumnWidth = hasRowSelection
            ? `calc(52% - ${selectionColumnWidth}px)`
            : "52%";
          const renderSplitRowCheckbox = (itemId: string) => (
            <Checkbox
              checked={selectedIds.includes(itemId)}
              onCheckedChange={(checked) =>
                handleSelectRow(itemId, Boolean(checked))
              }
              aria-label="Select row"
            />
          );
          const handleSplitRowKeyDown =
            (item: T) => (event: React.KeyboardEvent<HTMLElement>) => {
              if (isInteractiveRowTarget(event.target)) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                activateRow(item);
              }
            };
          const primaryPane = (
            <div
              className={cn(
                TABLE_SPLIT_VIEW_PRIMARY_PANE_CLASSNAME,
                sidePanel && "flex-1",
              )}
            >
              {compactSplitTable ? (
                <Table className="table-fixed max-md:block max-md:w-full">
                  <TableHeader className="sticky top-0 z-[1] bg-background max-md:hidden">
                    <TableRow className="hover:bg-transparent">
                      {hasRowSelection && (
                        <TableHead
                          className="h-9 pl-0 pr-2"
                          style={{
                            width: selectionColumnWidth,
                            minWidth: selectionColumnWidth,
                            maxWidth: selectionColumnWidth,
                          }}
                        >
                          <div className="flex items-center justify-center">
                            {!usesGenericSplitWorkspace && <Checkbox
                              checked={
                                allSelected
                                  ? true
                                  : someSelected
                                    ? "indeterminate"
                                    : false
                              }
                              onCheckedChange={(checked) =>
                                handleSelectAll(Boolean(checked))
                              }
                              aria-label="Select all rows"
                            />}
                          </div>
                        </TableHead>
                      )}
                      {splitViewColumns.map((column, index) => (
                        <TableHead
                          key={column.id}
                          className={cn(
                            "h-9 px-2 sm:px-5",
                            LABEL_HEADING_CLASS,
                          )}
                          style={{
                            width:
                              index === 0
                                ? splitPrimaryColumnWidth
                                : `${48 / (splitViewColumns.length - 1)}%`,
                          }}
                        >
                          <span className={TABLE_HEADER_LABEL_CLASSNAME}>
                            {column.label}
                          </span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="max-md:block">
                    {rowOrderedItems.map((item) => {
                      const itemId = table.getRowId(item);
                      return (
                        <TableRow
                          key={itemId}
                          data-unified-side-panel-row
                          ref={(node) => {
                            splitRowRefs.current[itemId] = node;
                          }}
                          tabIndex={0}
                          aria-selected={effectiveActiveRowId === itemId}
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-muted/35 max-md:relative max-md:grid max-md:grid-cols-2 max-md:gap-x-5 max-md:gap-y-3 max-md:py-3",
                            hasRowSelection
                              ? "max-md:pl-12 max-md:pr-4"
                              : "max-md:px-4",
                            effectiveActiveRowId === itemId && "bg-muted/50",
                          )}
                          onClick={(event) => {
                            if (isInteractiveRowTarget(event.target)) return;
                            activateRow(item);
                          }}
                          onKeyDown={handleSplitRowKeyDown(item)}
                        >
                          {hasRowSelection && (
                            <TableCell
                              className="pl-0 pr-2 max-md:absolute max-md:left-2 max-md:top-3 max-md:p-0"
                              style={{
                                width: selectionColumnWidth,
                                minWidth: selectionColumnWidth,
                                maxWidth: selectionColumnWidth,
                              }}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <div className="flex items-center justify-center">
                                {renderSplitRowCheckbox(itemId)}
                              </div>
                            </TableCell>
                          )}
                          {splitViewColumns.map((column, index) => (
                            <TableCell
                              key={column.id}
                              className={cn(
                                "max-w-0 truncate px-2 py-3 text-xs sm:px-5 sm:text-sm",
                                "max-md:block max-md:max-w-none max-md:px-0 max-md:py-0",
                                index === 0 &&
                                  "max-md:col-span-2 max-md:pb-1 max-md:text-sm max-md:font-medium",
                              )}
                              title={resolveGenericColumnText(column, item)}
                            >
                              {index > 0 ? (
                                <span
                                  className={cn(
                                    "mb-1 hidden max-md:block",
                                    LABEL_HEADING_CLASS,
                                  )}
                                >
                                  {column.label}
                                </span>
                              ) : null}
                              <span className="block truncate">
                                {resolveGenericColumnText(column, item)}
                              </span>
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                rowOrderedItems.map((item) => {
                  const itemId = table.getRowId(item);
                  const primaryColumn = splitViewColumns[0];
                  return (
                    <div
                      key={itemId}
                      data-unified-side-panel-row
                      ref={(node) => {
                        splitRowRefs.current[itemId] = node;
                      }}
                      role="button"
                      tabIndex={0}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 border-b border-border/60 py-3 text-sm transition-colors hover:bg-muted/35",
                        hasRowSelection ? "pl-3 pr-5" : "px-5",
                        effectiveActiveRowId === itemId && "bg-muted/50",
                      )}
                      onClick={(event) => {
                        if (isInteractiveRowTarget(event.target)) return;
                        activateRow(item);
                      }}
                      onKeyDown={handleSplitRowKeyDown(item)}
                    >
                      {hasRowSelection && (
                        <span
                          className="flex shrink-0 items-center"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {renderSplitRowCheckbox(itemId)}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        {primaryColumn
                          ? resolveGenericColumnText(primaryColumn, item) ||
                            itemId
                          : itemId}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          );

          return (
            <SplitPageWorkspaceFrame
              className={TABLE_SPLIT_VIEW_CONTAINER_CLASSNAME}
            >
              <SplitPageWorkspacePanels
                defaultIsOpen={!effectiveActiveRowId}
                firstPaneClassName="bg-background"
                secondPaneClassName="bg-background"
              >
                <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
                  <GenericTableSplitMobileSelectionSync
                    activeRowId={effectiveActiveRowId}
                  />
                  {splitWorkspaceRailHeader}
                  {primaryPane}
                </div>
                <GenericTableSplitDetailPane
                  listLabel={header.title || "Items"}
                  header={activeItem && sidePanel ? (
                    <SplitPageWorkspaceRailHeader
                      title={sidePanel.title ?? "Details"}
                      actions={
                        <>
                          {sidePanel.headerActions}
                          {sidePanel.showCloseButton !== false ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Close details"
                              onClick={() => {
                                setInternalActiveRowId(null);
                                sidePanel.onClose?.();
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </>
                      }
                    />
                  ) : undefined}
                  onCloseDetails={() => {
                    setInternalActiveRowId(null);
                    sidePanel?.onClose?.();
                  }}
                >
                  <div className={TABLE_SPLIT_VIEW_GENERIC_DETAIL_CLASSNAME}>
                    {activeItem && sidePanel ? (
                      sidePanelChildren
                    ) : selectedItem ? (
                      renderDetailPaneFields(selectedItem)
                    ) : (
                      <EmptyState
                        title="Select a row"
                        description="Choose a row to inspect its details."
                      />
                    )}
                  </div>
                </GenericTableSplitDetailPane>
              </SplitPageWorkspacePanels>
            </SplitPageWorkspaceFrame>
          );
        })()}

      {(() => {
        if (hideTableBody) return null;
        const paginProps =
          pagination ??
          (resolvedFeatures.enablePagination
            ? {
                page: internalPage,
                totalPages: Math.max(
                  1,
                  Math.ceil(rowOrderedItems.length / internalPerPage),
                ),
                perPage: internalPerPage,
                onPageChange: setInternalPage,
                onPerPageChange: (val: string) => {
                  setInternalPerPage(Number(val));
                  setInternalPage(1);
                },
              }
            : null);
        if (!paginProps || paginProps.totalPages <= 1) return null;
        // Print renders every row (useIsPrinting), so the pager means nothing
        // on paper; print-document.css hides data-print-hide.
        return (
          <div
            data-print-hide=""
            className="flex flex-col gap-4 items-center justify-between pt-6 md:flex-row"
          >
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Rows per page</span>
                <Select
                  value={String(paginProps.perPage)}
                  onValueChange={handlePerPageChange}
                >
                  <SelectTrigger
                    variant="inline"
                    size="sm"
                    className="h-8 w-16 px-1"
                    aria-label="Rows per page"
                  >
                    <SelectValue placeholder={String(paginProps.perPage)} />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100, 150].map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span>Loading</span>
                <Select
                  value={paginationBehavior}
                  onValueChange={(value) =>
                    handlePaginationBehaviorChange(
                      value as TablePaginationBehavior,
                    )
                  }
                >
                  <SelectTrigger
                    variant="inline"
                    size="sm"
                    className="h-8 min-w-36 px-1"
                    aria-label="Table loading behavior"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pages">Pages</SelectItem>
                    <SelectItem value="scroll">Continue on scroll</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {paginationBehavior === "pages" ? (
              <SimplePagination
                currentPage={paginProps.page}
                totalPages={paginProps.totalPages}
                onPageChange={handlePageChange}
              />
            ) : (
              <div
                ref={autoLoadSentinelRef}
                className="flex items-center gap-2 text-sm text-muted-foreground"
                aria-live="polite"
              >
                {data.isFetching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading more rows…</span>
                  </>
                ) : canLoadAnotherPage ? (
                  <span>More rows load as you scroll.</span>
                ) : (
                  <span>All rows loaded.</span>
                )}
              </div>
            )}
          </div>
        );
      })()}
    </>
  );

  // For non-sidePanel pages, combine header + table into one block
  const leftPaneContent = (
    <>
      {!usesGenericSplitWorkspace ? aboveTableContent : null}
      <div
        className={
          canRenderSplitView ? "flex flex-col flex-1 min-h-0" : undefined
        }
      >
        {tableAreaContent}
        {bottomContent}
      </div>
    </>
  );

  return (
    <>
      {portaledToolbar}
      <div
        className={lightTableThemeStyles.lightTheme}
        style={
          isSidePanelOpen && !usesGenericSplitWorkspace
            ? ({
                "--table-side-panel-reserved-width":
                  resolveTableSidePanelReservedWidth(
                    panelCollapsed ? 40 : panelWidth,
                    containerMaxWidth,
                  ),
              } as React.CSSProperties)
            : undefined
        }
      >
        <PageContainer
          maxWidth={containerMaxWidth}
          // Every table-page header begins on the shared page gutter. Split view
          // removes only the right gutter (where the fixed detail panel begins)
          // through TABLE_SIDE_PANEL_PAGE_CONTAINER_CLASSNAME below; disabling
          // PageContainer padding here also removed the left gutter and put the
          // page title directly against the application rail.
          padding={containerPadding}
          className={cn(
            // The pager is the last thing on a table page. pb-24 (96px) lets it
            // scroll clear of the floating AI launcher (48px, 2rem above the
            // viewport bottom), the same clearance PageShell gives its content
            // (ALL-155). Inside PageShell that padding already wraps this
            // container, so keep the old pb-12 there rather than double it.
            pageShellOwnsTableLayout ? "pb-12" : TABLE_PAGE_LAUNCHER_CLEARANCE_CLASSNAME,
            canRenderSplitView && TABLE_SPLIT_VIEW_PAGE_CONTAINER_CLASSNAME,
            isFullBleedTable && TABLE_FULL_BLEED_PAGE_CONTAINER_CLASSNAME,
            sidePanel && !usesGenericSplitWorkspace && TABLE_SIDE_PANEL_PAGE_CONTAINER_CLASSNAME,
            // Must come AFTER the side-panel gutter reset: `cn` is tailwind-merge,
            // which resolves a `pr` conflict by keeping the last class, so listing
            // the reservation first let "lg:pr-0" delete it outright.
            canRenderSplitView &&
              !usesGenericSplitWorkspace &&
              sidePanel &&
              effectiveActiveRowId &&
              TABLE_SPLIT_VIEW_PANEL_RESERVATION_CLASSNAME,
            isPeekPanel && TABLE_PEEK_PAGE_CONTAINER_CLASSNAME,
            // When the gutter belongs to a parent (embedded tabs pass
            // containerPadding: false), this container's own `overflow-x-clip`
            // would cut the bleed off at the old edge. The parent's clip still
            // stops it at the page edge.
            shouldBleedTableRight && !containerPadding && "overflow-x-visible",
            containerClassName,
          )}
        >
          {sidePanel && !usesGenericSplitWorkspace ? (
            <>
              <div
                className={cn(
                  containerPadding && "pr-1 sm:pr-6 lg:pr-8",
                  isPeekPanel && "shrink-0",
                  // Split view reserves the width on PageContainer instead, so
                  // reserving again here would double-count it. Listed last for
                  // the tailwind-merge reason noted on PageContainer.
                  isSidePanelOpen &&
                    !canRenderSplitView &&
                    (containerPadding
                      ? TABLE_SIDE_PANEL_HEADER_RESERVATION_CLASSNAME
                      : TABLE_SIDE_PANEL_WIDTH_RESERVATION_CLASSNAME),
                )}
              >
                {aboveTableContent}
              </div>
              <div
                className={cn(
                  "relative grid grid-cols-1",
                  isPeekPanel && TABLE_PEEK_GRID_CLASSNAME,
                  isFullBleedTable &&
                    (sidePanel ? "mx-0" : "-mx-1 sm:-mx-6 lg:-mx-8"),
                )}
              >
                <div
                  className={cn(
                    "min-w-0",
                    isPeekPanel && TABLE_PEEK_TABLE_SCROLL_CLASSNAME,
                  )}
                >
                  {tableAreaContent}
                  {bottomContent}
                </div>

                {isSidePanelOpen &&
                  !canRenderSplitView &&
                  !isMobileViewport && (
                    <div className={TABLE_SIDE_PANEL_DESKTOP_WRAPPER_CLASSNAME}>
                      <TableSidePanel
                        title={sidePanel.title}
                        headerActions={sidePanel.headerActions}
                        bodyLayout={sidePanel.bodyLayout}
                        width={panelWidth}
                        collapsed={panelCollapsed}
                        collapsible={panelCollapsible}
                        resizable={panelResizable}
                        showCloseButton={sidePanel.showCloseButton}
                        onClose={sidePanel.onClose}
                        onToggleCollapsed={panelController.onToggleCollapsed}
                        onResizeStart={panelController.onResizeStart}
                      >
                        {sidePanelChildren}
                      </TableSidePanel>
                    </div>
                  )}
              </div>
            </>
          ) : (
            leftPaneContent
          )}
        </PageContainer>
      </div>

      {/* Mobile side panel overlay */}
      {sidePanel && !usesGenericSplitWorkspace && effectiveActiveRowId && isMobileViewport && (
        <div className="md:hidden">
          <TableSidePanel
            mode="mobile"
            title={sidePanel.mobileTitle ?? sidePanel.title ?? "Details"}
            headerActions={sidePanel.headerActions}
            bodyLayout={sidePanel.bodyLayout}
            onClose={sidePanel.onClose}
          >
            {sidePanelChildren}
          </TableSidePanel>
        </div>
      )}

      {table.onDelete && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{table.deleteCopy ? `Delete ${table.deleteCopy.noun}?` : "Delete Item"}</AlertDialogTitle>
              <AlertDialogDescription>
                {table.deleteCopy?.description ?? "Are you sure you want to delete this item? This action cannot be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {!toolbar.onBulkDelete && table.onDelete && (
        <AlertDialog
          open={bulkDeleteDialogOpen}
          onOpenChange={setBulkDeleteDialogOpen}
        >
          {bulkDeleteTargets && (
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {bulkDeleteTargets.items.length > 0
                    ? `Delete ${bulkDeleteTargets.items.length} ${deleteNoun(bulkDeleteTargets.items.length)}?`
                    : `No ${deleteNoun(2)} to delete`}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {bulkDeleteTargets.items.length > 0
                    ? (table.deleteCopy?.description ??
                      `This will permanently delete ${bulkDeleteTargets.items.length} selected ${deleteNoun(bulkDeleteTargets.items.length)}. This action cannot be undone.`)
                    : `None of the ${bulkDeleteTargets.skippedCount} selected ${deleteNoun(bulkDeleteTargets.skippedCount)} can be deleted.`}
                  {bulkDeleteTargets.items.length > 0 &&
                    bulkDeleteTargets.skippedCount > 0 &&
                    ` ${bulkDeleteTargets.skippedCount} other selected ${deleteNoun(bulkDeleteTargets.skippedCount)} can't be deleted and will be skipped.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                {bulkDeleteTargets.items.length > 0 && (
                  <AlertDialogAction
                    onClick={handleBulkDeleteConfirm}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete {bulkDeleteTargets.items.length}{" "}
                    {deleteNoun(bulkDeleteTargets.items.length)}
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          )}
        </AlertDialog>
      )}
      {hasBulkEdit && (
        <BulkEditDialog
          open={bulkEditDialogOpen}
          onOpenChange={setBulkEditDialogOpen}
          selectedCount={selectedIds.length}
          itemNoun={table.bulkEdit?.itemNoun}
          fields={bulkEditFields}
          onApply={handleBulkEditApply}
        />
      )}
    </>
  );
}
