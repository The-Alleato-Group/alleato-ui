"use client";
import { useTableHost, type SavedTableView, type TableViewsMenuCurrentState } from "./table-host";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  ReactElement,
  ReactNode,
} from "react";
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
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  AlignJustify,
  ArrowUpDown,
  CalendarDays,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  Download,
  Eye,
  EyeOff,
  Filter,
  Flag,
  GanttChart as GanttChartIcon,
  GripVertical,
  LayoutGrid,
  ListTree,
  PanelRight,
  Route,
  Search,
  SlidersHorizontal,
  PencilLine,
  Table2,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button } from "../components/button";
import { Checkbox } from "../components/checkbox";
import { TableFilterBuilder, countCompleteRules } from "./table-filter-builder";
import {
  EMPTY_FILTER_QUERY,
  decodeFilterQuery,
  encodeFilterQuery,
  mergeSingleValueIntoQuery,
  singleValueViewOfQuery,
  type FilterQuery,
} from "../lib/filter-query";

/**
 * Reserved key inside a saved view's `filters` record that carries the encoded
 * rule query. Prefixed so it can never collide with a real field id.
 */
const SAVED_VIEW_QUERY_KEY = "__filter_query";

function pluralize(noun: string, count: number): string {
  return count === 1 ? noun : `${noun}s`;
}
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import { Input } from "../components/input";
import { NumberInput } from "../components/number-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/select";
import {
  Modal as Dialog,
  ModalContent as DialogContent,
  ModalHeader as DialogHeader,
  ModalTitle as DialogTitle,
} from "../components/unified-modal";
import {
  SidePanel,
  SidePanelBody,
  SidePanelContent,
  SidePanelHeader,
  SidePanelTitle,
  SidePanelTrigger,
} from "../components/side-panel";
import { tabsListVariants } from "../components/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/tooltip";
import { Calendar } from "../components/calendar";
import { cn } from "../lib/utils";
import { LabelHeading } from "../layout/headings";
import { TableIconButton, tableIconButtonClassName } from "./table-icon-button";
import { TableSettingsPopover } from "./table-settings-popover";

import { TableCountIndicator } from "./table-count-indicator";
import { ExpandingSearch } from "../ds/expanding-search";

export { ExpandingSearch, ExpandingSearch as ExpandableSearch };

export type ViewMode =
  | "gantt"
  | "table"
  | "board"
  | "card"
  | "list"
  | "split"
  | "calendar"
  | "milestones"
  | "timeline";
export type TableDensity = "compact" | "default" | "comfortable";

export interface FilterConfig {
  id: string;
  label: string;
  type:
    | "select"
    | "multiSelect"
    | "dateRange"
    | "text"
    | "boolean"
    | "date"
    | "number";
  options?: { value: string; label: string }[];
  placeholder?: string;
  /** Set false for a required scope selector with no unfiltered/All state. */
  allowClear?: boolean;
}

export interface ColumnConfig {
  id: string;
  label: string;
  defaultVisible?: boolean;
  alwaysVisible?: boolean;
  /**
   * Declares whether this column holds dates, deciding whether the toolbar
   * auto-offers a date-range filter for it. Set it when the column's name is
   * misleading in either direction — `false` for money/people columns that read
   * as dates ("Payments Issued", "Received From"), `true` for date columns
   * whose name says nothing ("Period", "As Of"). Left undefined, the column is
   * inferred from its name and its values (`editType: "date"` implies `true`).
   */
  dateLike?: boolean;
  /**
   * Where the value comes from and how it is calculated, in plain words. The
   * table renders it as a tooltip on the column header, so a reader never has
   * to guess whether "Invoiced" means SOV billing or Acumatica bills. Owner
   * rule (2026-09-04): every column on a financial table declares one.
   */
  description?: string;
}

type FilterValue = string | string[] | number | boolean | null | undefined;
type SortDirection = "asc" | "desc";

/**
 * Feature flags for TableToolbar. Pass a partial object to opt out of specific
 * capabilities — omitted flags default to `true`.
 *
 * Prefer this over the old flat `enableSearch`, `enableViews`, … boolean props.
 */
export interface TableToolbarFeatures {
  search?: boolean;
  views?: boolean;
  filters?: boolean;
  columnToggle?: boolean;
  export?: boolean;
  bulkDelete?: boolean;
  bulkEdit?: boolean;
}

export interface TableToolbarProps {
  totalItems: number;
  filteredItems: number;
  /**
   * Singular noun for the count label ("photo" -> "37 photos"). Defaults to
   * "row"; set it on libraries where the rows are not rows to the reader.
   */
  itemNoun?: string;
  selectedCount: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  enabledViews?: ViewMode[];
  /** @deprecated Unified tables always use the shared icon-only view switcher. */
  viewSwitcherDisplay?: "default" | "icons";
  filters?: FilterConfig[];
  activeFilters: Record<string, FilterValue>;
  onFilterChange: (filters: Record<string, FilterValue>) => void;
  onClearFilters: () => void;
  /**
   * Rule-based filter query. When `onFilterQueryChange` is supplied the toolbar
   * renders the Notion-style rule builder (multi-value, negation, AND/OR)
   * instead of the one-control-per-field list, and the query is the single
   * source of truth — the touch sheet's per-field controls read and write
   * through it.
   */
  filterQuery?: FilterQuery;
  onFilterQueryChange?: (query: FilterQuery) => void;
  /**
   * Fields this table cannot filter correctly yet (server-paginated list whose
   * API has no pushdown for them). Offered but disabled, with the reason.
   */
  unsupportedFilterFields?: string[];
  unsupportedFilterReason?: string;
  columns?: ColumnConfig[];
  visibleColumns: string[];
  onColumnVisibilityChange: (columns: string[]) => void;
  columnOrder?: string[];
  onColumnOrderChange?: (columns: string[]) => void;
  columnWidths?: Record<string, number>;
  onColumnWidthsChange?: (widths: Record<string, number>) => void;
  sortOptions?: ColumnConfig[];
  sortBy?: string | null;
  sortDirection?: SortDirection;
  onSortChange?: (sortBy: string, direction: SortDirection) => void;
  /**
   * Row-grouping options. When provided alongside `onGroupByChange`, the toolbar
   * renders the shared grouping control beside the filter control. The first
   * option should be the "no grouping" choice.
   */
  groupByOptions?: readonly { value: string; label: string }[];
  groupBy?: string | null;
  onGroupByChange?: (value: string) => void;
  onExport?: () => void;
  onBulkDelete?: () => void;
  /** Opens the shared bulk-edit dialog. Rendered as a pencil icon next to bulk delete. */
  onBulkEdit?: () => void;
  /** A page's non-delete selected-row operation, rendered by the shared toolbar. */
  selectedAction?: {
    verb: string;
    icon: LucideIcon;
    onClick: () => void;
    disabled?: boolean;
  };
  mobilePanelActions?: ReactNode;
  /** Extra action buttons rendered in the toolbar icon row (e.g. ERP sync) */
  customActions?: ReactNode;
  /**
   * Actions rendered at the START of the toolbar icon row, before search.
   *
   * `customActions` lands after the column-settings icon, which reads as part
   * of the display controls. Use this slot for an action on the DATA itself
   * (pulling records in from an upstream system, say) so it leads the row
   * instead of trailing the view chrome.
   */
  leadingActions?: ReactNode;
  /** Content rendered on the left of the toolbar row, with icons pushed to the right */
  leftContent?: ReactNode;
  density?: TableDensity;
  onDensityChange?: (density: TableDensity) => void;
  /** Feature flags. Omitted flags default to enabled. */
  features?: TableToolbarFeatures;
  /**
   * Stable identifier for this table when saving views (e.g. "meetings"). When
   * set, the toolbar renders a "Saved views" picker before the view switcher.
   * Views are user-scoped via Supabase RLS, so they sync across browsers.
   * Project-agnostic — a view created on project A applies on project B.
   */
  savedViewsScope?: string;
  /** Built-in views shown before the user's saved views. Ids must start with `builtin:`. */
  savedViewsBuiltin?: readonly SavedTableView[];
  /** Defaults the toolbar will fall back to when "Reset to defaults" is picked. */
  savedViewsDefaults?: {
    visibleColumns: string[];
    columnOrder?: string[];
    columnWidths?: Record<string, number>;
    sortBy: string | null;
    sortDirection: SortDirection;
    filters: Record<string, FilterValue>;
  };
  /** @deprecated Use `features.search` instead */
  enableSearch?: boolean;
  /** @deprecated Use `features.views` instead */
  enableViews?: boolean;
  /** @deprecated Use `features.filters` instead */
  enableFilters?: boolean;
  /** @deprecated Use `features.columnToggle` instead */
  enableColumnToggle?: boolean;
  /** @deprecated Use `features.export` instead */
  enableExport?: boolean;
  /** @deprecated Use `features.bulkDelete` instead */
  enableBulkDelete?: boolean;
  className?: string;
}

export function ViewSwitcher({
  currentView,
  onViewChange,
  enabledViews = ["table", "split", "board", "card"],
}: {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  enabledViews?: ViewMode[];
  /** @deprecated The shared switcher is always icon-only. */
  display?: "default" | "icons";
}): ReactElement {
  const viewButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const views: { mode: ViewMode; icon: ReactNode; label: string }[] = [
    {
      mode: "gantt",
      icon: <GanttChartIcon className="h-3.5 w-3.5" />,
      label: "Gantt",
    },
    { mode: "table", icon: <Table2 className="h-3.5 w-3.5" />, label: "Table" },
    {
      mode: "board",
      icon: <Columns3 className="h-3.5 w-3.5" />,
      label: "Board",
    },
    {
      mode: "card",
      icon: <LayoutGrid className="h-3.5 w-3.5" />,
      label: "Gallery",
    },
    {
      mode: "split",
      icon: <PanelRight className="h-3.5 w-3.5" />,
      label: "Split",
    },
    {
      mode: "calendar",
      icon: <CalendarDays className="h-3.5 w-3.5" />,
      label: "Calendar",
    },
    {
      mode: "timeline",
      icon: <Route className="h-3.5 w-3.5" />,
      label: "Timeline",
    },
    {
      mode: "milestones",
      icon: <Flag className="h-3.5 w-3.5" />,
      label: "Milestones",
    },
  ];

  const filteredViews = views.filter(
    (view) => view.mode !== "list" && enabledViews.includes(view.mode),
  );
  if (filteredViews.length <= 1) return <></>;

  const selectedIndex = filteredViews.findIndex(
    (view) => view.mode === currentView,
  );

  const selectViewAt = (index: number): void => {
    const nextView = filteredViews[index];
    if (!nextView) return;
    onViewChange(nextView.mode);
    viewButtonRefs.current[index]?.focus();
  };

  const handleViewKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ): void => {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % filteredViews.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + filteredViews.length) % filteredViews.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = filteredViews.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    selectViewAt(nextIndex);
  };

  return (
    <TooltipProvider>
      <div
        role="radiogroup"
        aria-label="Table views"
        className={cn(
          tabsListVariants({ variant: "default" }),
          "h-11 shrink-0 justify-start gap-0.5 sm:h-8",
        )}
      >
        {filteredViews.map((view, index) => (
          <Tooltip key={view.mode}>
            <TooltipTrigger asChild>
              <TableIconButton
                ref={(node) => {
                  viewButtonRefs.current[index] = node;
                }}
                type="button"
                size="sm"
                role="radio"
                aria-label={`${view.label} view`}
                aria-checked={currentView === view.mode}
                tabIndex={
                  selectedIndex >= 0
                    ? selectedIndex === index
                      ? 0
                      : -1
                    : index === 0
                      ? 0
                      : -1
                }
                onClick={() => selectViewAt(index)}
                onKeyDown={(event) => handleViewKeyDown(event, index)}
                className="h-full min-w-9 flex-none rounded-md p-0 text-muted-foreground hover:text-foreground aria-checked:border-border aria-checked:bg-background aria-checked:text-foreground aria-checked:shadow-sm sm:min-w-7"
              >
                {view.icon}
              </TableIconButton>
            </TooltipTrigger>
            <TooltipContent>{view.label} view</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

function FilterFields({
  filters,
  activeFilters,
  onFilterChange,
  presentation = "compact",
  unsupportedFields,
  unsupportedReason = "Not filterable on this table yet",
}: {
  filters: FilterConfig[];
  activeFilters: Record<string, FilterValue>;
  onFilterChange: (filters: Record<string, FilterValue>) => void;
  presentation?: "compact" | "sheet";
  /**
   * Fields the backing endpoint cannot filter in SQL. They are shown with the
   * reason instead of a working control — the same contract the desktop rule
   * builder honours. Rendering a live control here would let a touch user apply
   * a filter the server drops, and report an unfiltered page as the result.
   */
  unsupportedFields?: string[];
  unsupportedReason?: string;
}): ReactElement {
  const isSheet = presentation === "sheet";
  const unsupported = useMemo(
    () => new Set(unsupportedFields ?? []),
    [unsupportedFields],
  );
  const rowClassName = cn(
    "flex gap-3",
    isSheet
      ? "flex-col py-3 sm:flex-row sm:items-center sm:justify-between"
      : "items-center justify-between py-1",
  );
  const labelClassName = isSheet
    ? "text-sm font-medium text-foreground"
    : "text-xs text-muted-foreground";
  const controlClassName = isSheet
    ? "h-11 w-full text-sm sm:w-56"
    : "h-7 w-40 text-xs";
  const formatDateValue = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const renderDateButtonLabel = (value: string, fallback: string) => {
    if (!value) return fallback;
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return fallback;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderFilter = (filter: FilterConfig) => {
    if (unsupported.has(filter.id)) {
      return (
        <div key={filter.id} className={rowClassName}>
          <span className={cn(labelClassName, "text-muted-foreground")}>
            {filter.label}
          </span>
          <span
            className={cn(
              "text-xs text-muted-foreground",
              isSheet ? "w-full sm:w-56" : "w-40",
            )}
          >
            {unsupportedReason}
          </span>
        </div>
      );
    }

    if (filter.type === "select" && filter.options) {
      const currentValue =
        typeof activeFilters[filter.id] === "string"
          ? (activeFilters[filter.id] as string)
          : "";

      return (
        <div key={filter.id} className={rowClassName}>
          <span className={labelClassName}>{filter.label}</span>
          <Select
            value={
              currentValue ||
              (filter.allowClear === false ? filter.options[0]?.value : "all")
            }
            onValueChange={(nextValue) =>
              onFilterChange({
                ...activeFilters,
                [filter.id]: nextValue === "all" ? undefined : nextValue,
              })
            }
          >
            <SelectTrigger
              aria-label={`${filter.label} filter`}
              className={cn(controlClassName, "bg-background")}
            >
              <SelectValue
                placeholder={
                  filter.allowClear === false ? filter.placeholder : "All"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {filter.allowClear !== false && (
                <SelectItem value="all">All</SelectItem>
              )}
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (filter.type === "multiSelect" && filter.options) {
      const currentValues = Array.isArray(activeFilters[filter.id])
        ? (activeFilters[filter.id] as string[])
        : [];
      const selectedLabels = filter.options
        .filter((option) => currentValues.includes(option.value))
        .map((option) => option.label);
      const summary =
        selectedLabels.length === 0
          ? "All"
          : selectedLabels.length === 1
            ? selectedLabels[0]
            : `${selectedLabels.length} selected`;

      return (
        <div key={filter.id} className={rowClassName}>
          <span className={labelClassName}>{filter.label}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/* `control` is the shared input-like contract (see
                  form-control-styles). `outline` only draws a border for
                  role=combobox, so these triggers rendered as bare text beside
                  the bordered Select and Input filters — in the touch sheet,
                  which is the only filter UI on mobile, a date range then reads
                  as a label rather than something you can tap. */}
              <Button
                variant="control"
                className={cn(
                  controlClassName,
                  "justify-between px-2.5 text-left font-normal",
                )}
              >
                <span className="truncate">{summary}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {filter.options.map((option) => {
                const checked = currentValues.includes(option.value);
                return (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={checked}
                    onSelect={(event) => event.preventDefault()}
                    onCheckedChange={(nextChecked) => {
                      const nextValues = nextChecked
                        ? [...currentValues, option.value]
                        : currentValues.filter(
                            (value) => value !== option.value,
                          );
                      onFilterChange({
                        ...activeFilters,
                        [filter.id]:
                          nextValues.length > 0 ? nextValues : undefined,
                      });
                    }}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }

    if (filter.type === "date") {
      const currentValue =
        typeof activeFilters[filter.id] === "string"
          ? (activeFilters[filter.id] as string)
          : "";
      const selectedDate = currentValue
        ? new Date(currentValue + "T00:00:00")
        : undefined;

      return (
        <div key={filter.id} className={rowClassName}>
          <span className={labelClassName}>{filter.label}</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="control"
                className={cn(
                  controlClassName,
                  "justify-start text-left font-normal",
                  !currentValue && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {selectedDate
                  ? selectedDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) =>
                  onFilterChange({
                    ...activeFilters,
                    [filter.id]: date ? formatDateValue(date) : undefined,
                  })
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      );
    }

    if (filter.type === "dateRange") {
      const fromKey = `${filter.id}_from`;
      const toKey = `${filter.id}_to`;
      const fromValue =
        typeof activeFilters[fromKey] === "string"
          ? (activeFilters[fromKey] as string)
          : "";
      const toValue =
        typeof activeFilters[toKey] === "string"
          ? (activeFilters[toKey] as string)
          : "";
      const fromDate = fromValue
        ? new Date(`${fromValue}T00:00:00`)
        : undefined;
      const toDate = toValue ? new Date(`${toValue}T00:00:00`) : undefined;

      return (
        <div key={filter.id} className={rowClassName}>
          <span className={labelClassName}>{filter.label}</span>
          <div
            className={cn(
              "grid grid-cols-2 gap-1.5",
              isSheet ? "w-full sm:w-56" : "w-40",
            )}
          >
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="control"
                  className={cn(
                    isSheet
                      ? "h-11 justify-start px-3 text-left text-sm font-normal"
                      : "h-7 justify-start px-2 text-left text-xs font-normal",
                    !fromValue && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3 w-3" />
                  {renderDateButtonLabel(fromValue, "From")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={(date) =>
                    onFilterChange({
                      ...activeFilters,
                      [fromKey]: date ? formatDateValue(date) : undefined,
                    })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="control"
                  className={cn(
                    isSheet
                      ? "h-11 justify-start px-3 text-left text-sm font-normal"
                      : "h-7 justify-start px-2 text-left text-xs font-normal",
                    !toValue && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3 w-3" />
                  {renderDateButtonLabel(toValue, "To")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={(date) =>
                    onFilterChange({
                      ...activeFilters,
                      [toKey]: date ? formatDateValue(date) : undefined,
                    })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      );
    }

    if (filter.type === "number" || filter.type === "text") {
      return (
        <div key={filter.id} className={rowClassName}>
          <label htmlFor={`filter-${filter.id}`} className={labelClassName}>
            {filter.label}
          </label>
          {filter.type === "number" ? (
            <NumberInput
              id={`filter-${filter.id}`}
              className={cn(controlClassName, "shrink-0")}
              min="0"
              step="1"
              decimals={0}
              formatOnBlur={false}
              placeholder={filter.placeholder}
              value={
                typeof activeFilters[filter.id] === "string"
                  ? (activeFilters[filter.id] as string)
                  : ""
              }
              onChange={(event) =>
                onFilterChange({
                  ...activeFilters,
                  [filter.id]: event.target.value || undefined,
                })
              }
            />
          ) : (
            <Input
              id={`filter-${filter.id}`}
              type="text"
              className={cn(controlClassName, "shrink-0")}
              placeholder={filter.placeholder}
              value={
                typeof activeFilters[filter.id] === "string"
                  ? (activeFilters[filter.id] as string)
                  : ""
              }
              onChange={(event) =>
                onFilterChange({
                  ...activeFilters,
                  [filter.id]: event.target.value || undefined,
                })
              }
            />
          )}
        </div>
      );
    }

    if (filter.type === "boolean") {
      const checked = activeFilters[filter.id] === true;
      return (
        <label key={filter.id} className={cn(rowClassName, labelClassName)}>
          {filter.label}
          <Checkbox
            checked={checked}
            onCheckedChange={(nextChecked) =>
              onFilterChange({
                ...activeFilters,
                [filter.id]: nextChecked ? true : undefined,
              })
            }
          />
        </label>
      );
    }

    return null;
  };

  return <div className="space-y-2">{filters.map(renderFilter)}</div>;
}

export function FilterMenu({
  filters,
  activeFilters,
  onFilterChange,
  onClearFilters,
  filterQuery,
  onFilterQueryChange,
  unsupportedFilterFields,
  unsupportedFilterReason,
}: {
  filters: FilterConfig[];
  activeFilters: Record<string, FilterValue>;
  onFilterChange: (filters: Record<string, FilterValue>) => void;
  onClearFilters: () => void;
  filterQuery?: FilterQuery;
  onFilterQueryChange?: (query: FilterQuery) => void;
  unsupportedFilterFields?: string[];
  unsupportedFilterReason?: string;
}): ReactElement {
  const query = filterQuery ?? EMPTY_FILTER_QUERY;
  const isRuleMode = Boolean(onFilterQueryChange);
  const activeCount = isRuleMode
    ? countCompleteRules(query, filters)
    : Object.values(activeFilters).filter(
        (value) => value !== undefined && value !== "" && value !== null,
      ).length;

  return (
    <TableSettingsPopover
      tooltip="Filters"
      title="Filters"
      trigger={
        <TableIconButton
          className="relative h-8 w-8 rounded-md p-0 text-muted-foreground hover:text-foreground"
          aria-label="Filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeCount > 0 ? (
            <TableCountIndicator
              count={activeCount}
              className="absolute right-0 top-0"
            />
          ) : null}
        </TableIconButton>
      }
      className={isRuleMode ? "sm:w-[34rem]" : "sm:w-96"}
    >
      {activeCount > 0 && !isRuleMode ? (
        <div className="flex shrink-0 items-center justify-end pb-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[11px] text-muted-foreground hover:bg-transparent hover:text-foreground"
            onClick={onClearFilters}
          >
            Clear
          </Button>
        </div>
      ) : null}
      <div className="min-h-0 overflow-y-auto p-1">
        {filters.length > 0 ? (
          isRuleMode ? (
            <TableFilterBuilder
              fields={filters}
              query={query}
              onQueryChange={onFilterQueryChange!}
              unsupportedFields={unsupportedFilterFields}
              unsupportedReason={unsupportedFilterReason}
            />
          ) : (
            <FilterFields
              filters={filters}
              activeFilters={activeFilters}
              onFilterChange={onFilterChange}
              unsupportedFields={unsupportedFilterFields}
              unsupportedReason={unsupportedFilterReason}
            />
          )
        ) : null}
      </div>
    </TableSettingsPopover>
  );
}

export function GroupByMenu({
  options,
  value,
  onChange,
}: {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}): ReactElement {
  const activeOption = options.find((option) => option.value === value);
  const hasActiveGrouping = value !== (options[0]?.value ?? "none");

  return (
    <TableSettingsPopover
      tooltip="Grouping"
      title="Grouping"
      trigger={
        <TableIconButton
          className="relative h-8 w-8 rounded-md p-0 text-muted-foreground hover:text-foreground"
          aria-label={
            activeOption ? `Grouping: ${activeOption.label}` : "Grouping"
          }
        >
          <ListTree className="h-4 w-4" />
          {hasActiveGrouping ? (
            <TableCountIndicator count={1} className="absolute right-0 top-0" />
          ) : null}
        </TableIconButton>
      }
      className="sm:w-72"
    >
      <div className="min-h-0 overflow-y-auto p-1">
        <GroupByField options={options} value={value} onChange={onChange} />
      </div>
    </TableSettingsPopover>
  );
}

function GroupByField({
  options,
  value,
  onChange,
  presentation = "compact",
}: {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  presentation?: "compact" | "sheet";
}): ReactElement {
  const isSheet = presentation === "sheet";

  return (
    <div
      className={cn(
        "flex gap-3",
        isSheet
          ? "flex-col py-3 sm:flex-row sm:items-center sm:justify-between"
          : "items-center justify-between py-1",
      )}
    >
      <span
        className={cn(
          isSheet
            ? "text-sm font-medium text-foreground"
            : "text-xs text-muted-foreground",
        )}
      >
        Group by
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          aria-label="Group by"
          className={cn(
            "bg-background",
            isSheet ? "h-11 w-full text-sm sm:w-56" : "h-7 w-40 text-xs",
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function MobileSettingsRow({
  icon,
  label,
  value,
  onClick,
  disabled = false,
}: {
  icon: ReactNode;
  label: string;
  value?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}): ReactElement {
  return (
    <Button
      variant="ghost"
      className={cn(
        "h-auto min-h-12 w-full justify-start gap-3 rounded-none border-b border-border/70 px-4 py-3 text-left font-normal last:border-b-0",
        "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring",
        disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground">
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-base text-foreground">{label}</span>
      {value ? (
        <span className="shrink-0 text-base text-muted-foreground">
          {value}
        </span>
      ) : null}
      {onClick ? (
        <span className="text-xl leading-none text-muted-foreground/70">›</span>
      ) : null}
    </Button>
  );
}

function getFirstActiveFilterLabel(
  filters: FilterConfig[],
  activeFilters: Record<string, FilterValue>,
): string | undefined {
  const active = filters.find((filter) => {
    const value = activeFilters[filter.id];
    return value !== undefined && value !== "" && value !== null;
  });

  if (!active) return undefined;

  const value = activeFilters[active.id];
  if (typeof value === "string" && active.options) {
    return (
      active.options.find((option) => option.value === value)?.label ??
      active.label
    );
  }

  return active.label;
}

const DENSITY_OPTIONS: { value: TableDensity; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "default", label: "Default" },
  { value: "comfortable", label: "Comfortable" },
];

export function DensityToggle({
  density = "default",
  onDensityChange,
}: {
  density?: TableDensity;
  onDensityChange?: (density: TableDensity) => void;
}): ReactElement {
  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <TableIconButton
                className="h-8 w-8 shrink-0"
                aria-label="Row density"
              >
                <AlignJustify className="h-4 w-4" />
              </TableIconButton>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Row density</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Row density</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {DENSITY_OPTIONS.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={density === option.value}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={() => onDensityChange?.(option.value)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DensityOptions({
  density = "default",
  onDensityChange,
}: {
  density?: TableDensity;
  onDensityChange?: (density: TableDensity) => void;
}): ReactElement {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg bg-background p-1">
      {DENSITY_OPTIONS.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 rounded-md px-2 text-xs font-medium shadow-none",
            density === option.value
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
          onClick={() => onDensityChange?.(option.value)}
          aria-pressed={density === option.value}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export function orderColumnsForToggle(
  columns: ColumnConfig[],
  columnOrder: string[] | undefined,
  visibleColumns: string[],
): ColumnConfig[] {
  const columnById = new Map(columns.map((column) => [column.id, column]));
  const preferredOrder =
    columnOrder && columnOrder.length > 0 ? columnOrder : visibleColumns;
  const orderedIds = [
    ...preferredOrder.filter((id) => columnById.has(id)),
    ...columns
      .map((column) => column.id)
      .filter((id) => !preferredOrder.includes(id)),
  ];

  return orderedIds
    .map((id) => columnById.get(id))
    .filter((column): column is ColumnConfig => Boolean(column));
}

export function reorderColumnIds(
  orderedIds: string[],
  activeId: string,
  overId: string,
): string[] {
  const oldIndex = orderedIds.indexOf(activeId);
  const newIndex = orderedIds.indexOf(overId);

  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
    return orderedIds;
  }

  return arrayMove(orderedIds, oldIndex, newIndex);
}

export function visibleColumnsInOrder(
  orderedIds: string[],
  visibleColumns: string[],
): string[] {
  const visibleSet = new Set(visibleColumns);
  const orderedVisible = orderedIds.filter((id) => visibleSet.has(id));
  const missingVisible = visibleColumns.filter(
    (id) => !orderedIds.includes(id),
  );

  return [...orderedVisible, ...missingVisible];
}

/**
 * What the list is choosing among. The table toolbar chooses columns; the
 * executive dashboard reuses the same list to choose widgets, and its
 * headings and accessible names must say so (a screen reader announcing
 * "Hide Receivables column" on a dashboard is a lie).
 */
export interface ColumnVisibilityLabels {
  /** Heading over the shown group. Default "Shown in table". */
  shown: string;
  /** Heading over the hidden group. Default "Hidden in table". */
  hidden: string;
  /** The noun in per-row accessible names. Default "column". */
  unit: string;
}

const COLUMN_VISIBILITY_LABELS: ColumnVisibilityLabels = {
  shown: "Shown in table",
  hidden: "Hidden in table",
  unit: "column",
};

function ColumnVisibilityRow({
  column,
  visible,
  onVisibleChange,
  dragHandle,
  isDragging,
  innerRef,
  style,
  unit = COLUMN_VISIBILITY_LABELS.unit,
}: {
  column: ColumnConfig;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  dragHandle?: ReactNode;
  isDragging?: boolean;
  innerRef?: (node: HTMLElement | null) => void;
  style?: CSSProperties;
  unit?: string;
}): ReactElement {
  return (
    <div
      ref={innerRef}
      style={style}
      className={cn(
        "group flex min-h-8 items-center gap-2 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-muted/45",
        isDragging &&
          "relative z-10 bg-background shadow-sm ring-1 ring-border",
      )}
    >
      {dragHandle ?? <span aria-hidden className="h-6 w-6 shrink-0" />}
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm font-medium",
          visible ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {column.label}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={column.alwaysVisible}
        aria-pressed={visible}
        aria-label={
          visible
            ? `Hide ${column.label} ${unit}`
            : `Show ${column.label} ${unit}`
        }
        onClick={() => onVisibleChange(!visible)}
        className="h-6 w-6 shrink-0 rounded-sm text-muted-foreground/70 hover:bg-transparent hover:text-foreground disabled:opacity-40"
      >
        {visible ? (
          <Eye className="h-3.5 w-3.5" />
        ) : (
          <EyeOff className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}

function SortableColumnVisibilityRow({
  column,
  onVisibleChange,
  unit = COLUMN_VISIBILITY_LABELS.unit,
}: {
  column: ColumnConfig;
  onVisibleChange: (visible: boolean) => void;
  unit?: string;
}): ReactElement {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  return (
    <ColumnVisibilityRow
      column={column}
      visible
      onVisibleChange={onVisibleChange}
      unit={unit}
      isDragging={isDragging}
      innerRef={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      dragHandle={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground/70 hover:bg-transparent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label={`Drag ${column.label} ${unit}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </Button>
      }
    />
  );
}

/**
 * Group heading that carries its own bulk action inline (`Shown in table` /
 * `Hide all`). Keeping the action on the heading row is what removes the need
 * for a footer, so the popover spends its vertical space on columns.
 */
function ColumnGroupHeading({
  label,
  actionLabel,
  onAction,
  actionDisabled,
}: {
  label: string;
  actionLabel: string;
  onAction: () => void;
  actionDisabled: boolean;
}): ReactElement {
  return (
    <div className="flex items-center justify-between gap-3 pl-1.5">
      <LabelHeading>{label}</LabelHeading>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={actionDisabled}
        onClick={onAction}
        className="h-6 px-1.5 text-[11px] font-medium text-muted-foreground hover:bg-transparent hover:text-foreground disabled:opacity-40"
      >
        {actionLabel}
      </Button>
    </div>
  );
}

/**
 * Columns split into shown/hidden groups, each row toggled by an eye icon.
 * Only shown columns are draggable — the order of hidden columns is not
 * observable in the table, so exposing a handle there would be noise.
 *
 * A toggled column always lands on the boundary between the two groups:
 * shown -> it becomes the last visible column; hidden -> it becomes the first
 * hidden one, which keeps it in view for an immediate undo.
 */
/**
 * The one column chooser: checkbox rows, drag to reorder, shown/hidden groups.
 * Exported so saved-view editors (budget views) render this exact control
 * instead of an "Add column..." select and a stack of icon buttons
 * (owner correction 2026-09-16).
 */
export function ColumnVisibilityList({
  columns,
  visibleColumns,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
  reorderable = Boolean(onColumnOrderChange),
  className,
  labels = COLUMN_VISIBILITY_LABELS,
}: {
  columns: ColumnConfig[];
  visibleColumns: string[];
  onColumnVisibilityChange: (columns: string[]) => void;
  columnOrder?: string[];
  onColumnOrderChange?: (columns: string[]) => void;
  /**
   * Show drag handles. Defaults to whether `onColumnOrderChange` is wired, but
   * a caller that builds its layout from the ORDER of the visible list passed
   * to `onColumnVisibilityChange` (the executive dashboard's widget list) can
   * reorder without it and must opt in.
   */
  reorderable?: boolean;
  className?: string;
  /** Override when the list chooses something other than table columns. */
  labels?: ColumnVisibilityLabels;
}): ReactElement {
  const orderedColumns = orderColumnsForToggle(
    columns,
    columnOrder,
    visibleColumns,
  );
  const isShown = (column: ColumnConfig) =>
    Boolean(column.alwaysVisible) || visibleColumns.includes(column.id);
  const shownColumns = orderedColumns.filter(isShown);
  const hiddenColumns = orderedColumns.filter((column) => !isShown(column));
  const shownIds = shownColumns.map((column) => column.id);
  const hiddenIds = hiddenColumns.map((column) => column.id);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const commit = (nextOrder: string[], nextVisible: string[]) => {
    onColumnOrderChange?.(nextOrder);
    onColumnVisibilityChange(visibleColumnsInOrder(nextOrder, nextVisible));
  };

  const setColumnVisible = (column: ColumnConfig, visible: boolean) => {
    if (column.alwaysVisible) return;
    const without = (ids: string[]) => ids.filter((id) => id !== column.id);
    commit(
      [...without(shownIds), column.id, ...without(hiddenIds)],
      visible
        ? [...without(visibleColumns), column.id]
        : without(visibleColumns),
    );
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const nextShown = reorderColumnIds(
      shownIds,
      String(active.id),
      String(over.id),
    );
    commit([...nextShown, ...hiddenIds], visibleColumns);
  };

  const hideAll = () => {
    const locked = shownColumns
      .filter((column) => column.alwaysVisible)
      .map((column) => column.id);
    const unlocked = shownIds.filter((id) => !locked.includes(id));
    commit([...locked, ...unlocked, ...hiddenIds], locked);
  };

  const showAll = () => {
    commit([...shownIds, ...hiddenIds], [...shownIds, ...hiddenIds]);
  };

  return (
    <div className={cn("min-h-0 space-y-3 overflow-y-auto py-1", className)}>
      <div className="space-y-1">
        <ColumnGroupHeading
          label={labels.shown}
          actionLabel="Hide all"
          onAction={hideAll}
          actionDisabled={shownColumns.every((column) => column.alwaysVisible)}
        />
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={shownIds}
            strategy={verticalListSortingStrategy}
          >
            {/* A view that cannot apply a reordered list must not show a
                drag handle that appears to work. */}
            {shownColumns.map((column) => reorderable ? (
              <SortableColumnVisibilityRow
                key={column.id}
                column={column}
                unit={labels.unit}
                onVisibleChange={(visible) => setColumnVisible(column, visible)}
              />
            ) : (
              <ColumnVisibilityRow
                key={column.id}
                column={column}
                visible
                unit={labels.unit}
                onVisibleChange={(visible) => setColumnVisible(column, visible)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {hiddenColumns.length > 0 ? (
        <div className="space-y-1">
          <ColumnGroupHeading
            label={labels.hidden}
            actionLabel="Show all"
            onAction={showAll}
            actionDisabled={false}
          />
          {hiddenColumns.map((column) => (
            <ColumnVisibilityRow
              key={column.id}
              column={column}
              visible={false}
              unit={labels.unit}
              onVisibleChange={(visible) => setColumnVisible(column, visible)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ColumnToggle({
  columns,
  visibleColumns,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
}: {
  columns: ColumnConfig[];
  visibleColumns: string[];
  onColumnVisibilityChange: (columns: string[]) => void;
  columnOrder?: string[];
  onColumnOrderChange?: (columns: string[]) => void;
}): ReactElement {
  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <TableIconButton
                className="h-8 w-8 shrink-0"
                aria-label="Toggle columns"
              >
                <Columns3 className="h-4 w-4" />
              </TableIconButton>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Select which columns to display</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent
        align="end"
        collisionPadding={12}
        className="flex max-h-[var(--radix-dropdown-menu-content-available-height)] w-72 flex-col p-2"
      >
        <ColumnVisibilityList
          columns={columns}
          visibleColumns={visibleColumns}
          onColumnVisibilityChange={onColumnVisibilityChange}
          columnOrder={columnOrder}
          onColumnOrderChange={onColumnOrderChange}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The toolbar's row count. With rows checked it reads "N selected" so the
 * selection is announced in words, not only by checkbox state (DESIGN.md,
 * "Selected rows announce themselves").
 */
export function formatToolbarRowCount({
  selectedCount,
  filteredItems,
  totalItems,
  itemNoun,
}: {
  selectedCount: number;
  filteredItems: number;
  totalItems: number;
  itemNoun: string;
}): string {
  if (selectedCount > 0) return `${selectedCount} selected`;
  return filteredItems === totalItems
    ? `${totalItems} ${pluralize(itemNoun, totalItems)}`
    : `${filteredItems} of ${totalItems} ${pluralize(itemNoun, totalItems)}`;
}

/** Bulk actions appear only for selected rows and share the toolbar icon style. */
function ToolbarBulkAction({
  icon: Icon,
  verb,
  selectedCount,
  onClick,
  disabled = false,
}: {
  icon: LucideIcon;
  verb: string;
  selectedCount: number;
  onClick: () => void;
  disabled?: boolean;
}) {
  const label = `${verb} ${selectedCount} selected`;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <TableIconButton
            className="h-8 w-8 shrink-0"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
          >
            <Icon className="h-4 w-4" />
          </TableIconButton>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

type ViewSettingsSection =
  | "layout"
  | "columns"
  | "filter"
  | "sort"
  | "group"
  | "density";

const VIEW_LABELS: Record<ViewMode, string> = {
  gantt: "Gantt",
  table: "Table",
  board: "Board",
  card: "Gallery",
  list: "List",
  split: "Split",
  calendar: "Calendar",
  milestones: "Milestones",
  timeline: "Timeline",
};

function SettingsNavigationRow({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: typeof Table2;
  label: string;
  value?: string | number;
  onClick: () => void;
}): ReactElement {
  return (
    <Button
      type="button"
      variant="ghost"
      className="flex min-h-9 w-full items-center justify-start gap-2 rounded-md px-2 text-left text-sm text-foreground"
      onClick={onClick}
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {value !== undefined ? (
        <span className="max-w-28 truncate text-xs text-muted-foreground">
          {value}
        </span>
      ) : null}
      <ChevronRight
        className="h-4 w-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </Button>
  );
}

export function TableToolbar({
  totalItems,
  filteredItems,
  itemNoun = "row",
  selectedCount,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  currentView,
  onViewChange,
  enabledViews = ["table", "split", "board", "card"],
  filters = [],
  activeFilters,
  onFilterChange,
  onClearFilters,
  filterQuery,
  onFilterQueryChange,
  unsupportedFilterFields,
  unsupportedFilterReason,
  columns = [],
  visibleColumns,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
  columnWidths,
  onColumnWidthsChange,
  sortOptions = [],
  sortBy,
  sortDirection = "asc",
  onSortChange,
  groupByOptions,
  groupBy,
  onGroupByChange,
  onExport,
  onBulkDelete,
  onBulkEdit,
  selectedAction,
  mobilePanelActions,
  customActions,
  leadingActions,
  leftContent,
  density = "default",
  onDensityChange,
  features,
  savedViewsScope,
  savedViewsBuiltin,
  savedViewsDefaults,
  enableSearch,
  enableViews,
  enableFilters,
  enableColumnToggle,
  enableExport,
  enableBulkDelete,
  className,
}: TableToolbarProps): ReactElement {
  const { TableViewsMenu } = useTableHost();
  // Track which saved view is currently applied. Local to TableToolbar — the
  // backing presentation state (visibleColumns/sort/filters) is owned by the
  // page hook, so the menu just fires the existing setters to apply a view.
  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  // ── Filter mode ───────────────────────────────────────────────────────────
  // In rule mode the query is the single source of truth. The touch sheet still
  // renders one control per field (dense rule rows are not tappable), so it
  // reads a single-value projection of the query and merges edits back into it
  // — never a second, diverging filter state.
  const isRuleFilterMode = Boolean(onFilterQueryChange);
  const resolvedFilterQuery = filterQuery ?? EMPTY_FILTER_QUERY;
  const filterFieldTypeById = useMemo(
    () => new Map(filters.map((filter) => [filter.id, filter.type])),
    [filters],
  );
  const sheetActiveFilters = useMemo(
    () =>
      isRuleFilterMode
        ? singleValueViewOfQuery(resolvedFilterQuery).values
        : activeFilters,
    [activeFilters, isRuleFilterMode, resolvedFilterQuery],
  );
  const handleSheetFilterChange = useCallback(
    (next: Record<string, FilterValue>) => {
      if (!isRuleFilterMode || !onFilterQueryChange) {
        onFilterChange(next);
        return;
      }
      const current = singleValueViewOfQuery(resolvedFilterQuery).values;
      const touchedFields = new Set([
        ...Object.keys(current),
        ...Object.keys(next),
      ]);
      let query = resolvedFilterQuery;
      for (const field of touchedFields) {
        const before = current[field];
        const after = next[field];
        if (JSON.stringify(before ?? null) === JSON.stringify(after ?? null)) {
          continue;
        }
        query = mergeSingleValueIntoQuery(
          query,
          field,
          after,
          filterFieldTypeById.get(field) ?? "text",
        );
      }
      onFilterQueryChange(query);
    },
    [
      filterFieldTypeById,
      isRuleFilterMode,
      onFilterChange,
      onFilterQueryChange,
      resolvedFilterQuery,
    ],
  );
  const handleClearAllFilters = useCallback(() => {
    if (isRuleFilterMode && onFilterQueryChange) {
      onFilterQueryChange(EMPTY_FILTER_QUERY);
      return;
    }
    onClearFilters();
  }, [isRuleFilterMode, onClearFilters, onFilterQueryChange]);

  const savedViewsCurrentState: TableViewsMenuCurrentState = {
    visible_columns: visibleColumns,
    column_order: columnOrder ?? visibleColumns,
    column_widths: columnWidths ?? null,
    sort_by: sortBy ?? null,
    sort_direction: sortDirection,
    // A saved view persists a `filters` record. In rule mode the encoded query
    // rides along under a reserved key so a view round-trips negation,
    // multi-value, and AND/OR losslessly — the plain per-field entries stay for
    // views read by anything that only understands the old shape.
    filters: (isRuleFilterMode
      ? {
          ...singleValueViewOfQuery(resolvedFilterQuery).values,
          [SAVED_VIEW_QUERY_KEY]: encodeFilterQuery(resolvedFilterQuery),
        }
      : activeFilters) as Record<
      string,
      string | number | boolean | string[] | null
    >,
  };

  const applySavedView = (view: SavedTableView) => {
    if (view.visible_columns && view.visible_columns.length > 0) {
      onColumnVisibilityChange(view.visible_columns);
    }
    if (view.column_order && onColumnOrderChange) {
      onColumnOrderChange(view.column_order);
    }
    if (onColumnWidthsChange) {
      onColumnWidthsChange(view.column_widths ?? {});
    }
    if (view.sort_by && onSortChange) {
      onSortChange(view.sort_by, view.sort_direction ?? "asc");
    }
    if (view.filters) {
      const encodedQuery = view.filters[SAVED_VIEW_QUERY_KEY];
      if (
        isRuleFilterMode &&
        onFilterQueryChange &&
        typeof encodedQuery === "string"
      ) {
        onFilterQueryChange(decodeFilterQuery(encodedQuery));
      } else {
        const { [SAVED_VIEW_QUERY_KEY]: _query, ...legacyFilters } =
          view.filters;
        handleSheetFilterChange(legacyFilters as Record<string, FilterValue>);
      }
    } else {
      handleClearAllFilters();
    }
    setActiveViewId(view.id);
  };

  const resetSavedViewToDefaults = () => {
    if (savedViewsDefaults) {
      onColumnVisibilityChange(savedViewsDefaults.visibleColumns);
      if (onColumnOrderChange) {
        onColumnOrderChange(
          savedViewsDefaults.columnOrder ?? savedViewsDefaults.visibleColumns,
        );
      }
      if (onColumnWidthsChange) {
        onColumnWidthsChange(savedViewsDefaults.columnWidths ?? {});
      }
      if (savedViewsDefaults.sortBy && onSortChange) {
        onSortChange(
          savedViewsDefaults.sortBy,
          savedViewsDefaults.sortDirection,
        );
      }
      handleSheetFilterChange(savedViewsDefaults.filters);
    } else {
      handleClearAllFilters();
    }
    setActiveViewId(null);
  };
  // Resolve feature flags: new `features` object takes precedence,
  // legacy flat props are honoured for backwards-compatibility, default is enabled.
  const feat = {
    search: features?.search ?? enableSearch ?? true,
    views: features?.views ?? enableViews ?? true,
    filters: features?.filters ?? enableFilters ?? true,
    columnToggle: features?.columnToggle ?? enableColumnToggle ?? true,
    export: features?.export ?? enableExport ?? true,
    bulkDelete: features?.bulkDelete ?? enableBulkDelete ?? true,
    bulkEdit: features?.bulkEdit ?? true,
  };

  const [isMobile, setIsMobile] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileLayoutOpen, setMobileLayoutOpen] = useState(false);
  const [mobileGroupingOpen, setMobileGroupingOpen] = useState(false);
  const [mobileDisplayOpen, setMobileDisplayOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const [quickControlsOpen, setQuickControlsOpen] = useState(true);
  const [viewSettingsOpen, setViewSettingsOpen] = useState(false);
  const [viewSettingsSection, setViewSettingsSection] =
    useState<ViewSettingsSection | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const apply = (): void => setIsMobile(mediaQuery.matches);

    apply();
    mediaQuery.addEventListener("change", apply);
    return () => mediaQuery.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!mobileSearchOpen) return;
    mobileSearchInputRef.current?.focus();
  }, [mobileSearchOpen]);

  const activeFilterCount = isRuleFilterMode
    ? countCompleteRules(resolvedFilterQuery, filters)
    : Object.values(activeFilters).filter(
        (value) => value !== undefined && value !== "" && value !== null,
      ).length;
  const visibleColumnCount = columns.filter((column) =>
    visibleColumns.includes(column.id),
  ).length;
  const firstActiveFilterLabel = getFirstActiveFilterLabel(
    filters,
    sheetActiveFilters,
  );
  const activeSortLabel = sortOptions.find(
    (option) => option.id === sortBy,
  )?.label;
  const hasGroupingMenu = Boolean(
    onGroupByChange && groupByOptions && groupByOptions.length > 0,
  );
  const activeGroupByLabel = groupByOptions?.find(
    (option) => option.value === groupBy,
  )?.label;
  const hasViewSettings =
    Boolean(savedViewsScope) ||
    (feat.views && enabledViews.length > 1) ||
    (feat.columnToggle && columns.length > 0) ||
    (feat.filters && filters.length > 0) ||
    Boolean(onSortChange && sortOptions.length > 0) ||
    hasGroupingMenu ||
    Boolean(onDensityChange);
  const hasQuickControls =
    (feat.views && enabledViews.length > 1) ||
    hasGroupingMenu ||
    Boolean(feat.export && onExport);

  if (isMobile) {
    return (
      <div className={cn("py-2", className)}>
        <div className="flex w-full items-center justify-end gap-3">
          <div className="flex shrink-0 items-center gap-1.5">
            {/*
              Stays on the visible bar rather than moving into the settings
              sheet: these act on the data, not on how it is displayed, and a
              full-width settings row is the wrong shape for an icon action.
            */}
            {leadingActions}
            {customActions}

            <SidePanel open={mobilePanelOpen} onOpenChange={setMobilePanelOpen}>
              <SidePanelTrigger asChild>
                <TableIconButton
                  className="relative h-11 w-11 shrink-0 p-0"
                  aria-label="Open view settings"
                >
                  {/* Sliders, not ⋮: the ⋮ on a phone header is the page's own
                      overflow (HeaderActions); this opens the table's search,
                      filters and columns. Two identical glyphs side by side
                      read as one broken control (2026-09-21). */}
                  <SlidersHorizontal className="h-5 w-5" />
                  <TableCountIndicator
                    count={activeFilterCount}
                    className="absolute right-0 top-0"
                  />
                </TableIconButton>
              </SidePanelTrigger>
              <SidePanelContent size="full">
                <SidePanelHeader>
                  <SidePanelTitle>View settings</SidePanelTitle>
                </SidePanelHeader>
                <SidePanelBody className="space-y-4">
                  {savedViewsScope ? (
                    <div className="overflow-hidden rounded-2xl bg-background px-2 py-2">
                      <TableViewsMenu
                        scopeKey={savedViewsScope}
                        currentState={savedViewsCurrentState}
                        activeViewId={activeViewId}
                        builtinViews={savedViewsBuiltin}
                        onApplyView={applySavedView}
                        onResetToDefaults={resetSavedViewToDefaults}
                        onAutoApplyDefault={applySavedView}
                      />
                    </div>
                  ) : null}
                  <div className="overflow-hidden rounded-2xl bg-background">
                    {feat.views && enabledViews.length > 1 && (
                      <MobileSettingsRow
                        icon={<Table2 className="h-5 w-5" />}
                        label="Layout"
                        value={VIEW_LABELS[currentView]}
                        onClick={() => {
                          setMobilePanelOpen(false);
                          window.setTimeout(
                            () => setMobileLayoutOpen(true),
                            160,
                          );
                        }}
                      />
                    )}
                    {((feat.columnToggle && columns.length > 0) ||
                      onDensityChange) && (
                      <MobileSettingsRow
                        icon={<Columns3 className="h-5 w-5" />}
                        label={
                          onDensityChange
                            ? "Columns and density"
                            : "Property visibility"
                        }
                        value={
                          feat.columnToggle && columns.length > 0
                            ? visibleColumnCount
                            : undefined
                        }
                        onClick={() => {
                          setMobilePanelOpen(false);
                          window.setTimeout(
                            () => setMobileDisplayOpen(true),
                            160,
                          );
                        }}
                      />
                    )}
                    {feat.filters && filters.length > 0 ? (
                      <MobileSettingsRow
                        icon={<Filter className="h-5 w-5" />}
                        label="Filter"
                        value={
                          firstActiveFilterLabel ??
                          (activeFilterCount > 0
                            ? `${activeFilterCount}`
                            : "None")
                        }
                        onClick={() => {
                          setMobilePanelOpen(false);
                          window.setTimeout(
                            () => setMobileFilterOpen(true),
                            160,
                          );
                        }}
                      />
                    ) : null}
                    {hasGroupingMenu ? (
                      <MobileSettingsRow
                        icon={<ListTree className="h-5 w-5" />}
                        label="Grouping"
                        value={activeGroupByLabel ?? "None"}
                        onClick={() => {
                          setMobilePanelOpen(false);
                          window.setTimeout(
                            () => setMobileGroupingOpen(true),
                            160,
                          );
                        }}
                      />
                    ) : null}
                    {onSortChange && sortOptions.length > 0 ? (
                      <MobileSettingsRow
                        icon={<ArrowUpDown className="h-5 w-5" />}
                        label="Sort"
                        value={activeSortLabel ?? "Default"}
                        onClick={() => {
                          setMobilePanelOpen(false);
                          window.setTimeout(() => setMobileSortOpen(true), 160);
                        }}
                      />
                    ) : null}
                  </div>

                  {feat.search && (
                    <div className="overflow-hidden rounded-2xl bg-background">
                      <MobileSettingsRow
                        icon={<Search className="h-5 w-5" />}
                        label="Search"
                        value={searchValue ? "Active" : undefined}
                        onClick={() => {
                          setMobilePanelOpen(false);
                          window.setTimeout(
                            () => setMobileSearchOpen(true),
                            160,
                          );
                        }}
                      />
                    </div>
                  )}

                  {(feat.export && onExport) ||
                  mobilePanelActions ||
                  (selectedCount > 0 && feat.bulkEdit && onBulkEdit) ||
                  (selectedCount > 0 && feat.bulkDelete && onBulkDelete) ||
                  (selectedCount > 0 && selectedAction) ? (
                    <div className="overflow-hidden rounded-2xl bg-background">
                      {mobilePanelActions}
                      {feat.export && onExport ? (
                        <MobileSettingsRow
                          icon={<Download className="h-5 w-5" />}
                          label="Export"
                          onClick={onExport}
                        />
                      ) : null}
                      {selectedCount > 0 && feat.bulkEdit && onBulkEdit ? (
                        <MobileSettingsRow
                          icon={<PencilLine className="h-5 w-5" />}
                          label="Edit selected"
                          value={selectedCount}
                          onClick={() => {
                            setMobilePanelOpen(false);
                            onBulkEdit();
                          }}
                        />
                      ) : null}
                      {selectedCount > 0 && feat.bulkDelete && onBulkDelete ? (
                        <MobileSettingsRow
                          icon={<Trash2 className="h-5 w-5" />}
                          label="Delete selected"
                          value={selectedCount}
                          onClick={onBulkDelete}
                        />
                      ) : null}
                      {selectedCount > 0 && selectedAction ? (
                        <MobileSettingsRow
                          icon={<selectedAction.icon className="h-5 w-5" />}
                          label={`${selectedAction.verb} selected`}
                          value={selectedCount}
                          onClick={() => {
                            setMobilePanelOpen(false);
                            selectedAction.onClick();
                          }}
                          disabled={selectedAction.disabled}
                        />
                      ) : null}
                    </div>
                  ) : null}

                  <p className="px-1 text-xs text-muted-foreground">
                    {formatToolbarRowCount({
                      selectedCount,
                      filteredItems,
                      totalItems,
                      itemNoun,
                    })}
                  </p>
                </SidePanelBody>
              </SidePanelContent>
            </SidePanel>

            <Dialog open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
              <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Search</DialogTitle>
                </DialogHeader>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={mobileSearchInputRef}
                    value={searchValue}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-9 pl-8 pr-8 text-sm"
                    aria-label="Search table"
                  />
                  {searchValue ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-9 w-9"
                      onClick={() => onSearchChange("")}
                      aria-label="Clear search"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  ) : null}
                </div>
              </DialogContent>
            </Dialog>

            <SidePanel
              open={mobileLayoutOpen}
              onOpenChange={setMobileLayoutOpen}
            >
              <SidePanelContent size="full">
                <SidePanelHeader>
                  <SidePanelTitle>Layout</SidePanelTitle>
                </SidePanelHeader>
                <SidePanelBody>
                  <ViewSwitcher
                    currentView={currentView}
                    onViewChange={(view) => {
                      onViewChange(view);
                      setMobileLayoutOpen(false);
                    }}
                    enabledViews={enabledViews}
                  />
                </SidePanelBody>
              </SidePanelContent>
            </SidePanel>

            <SidePanel
              open={mobileFilterOpen}
              onOpenChange={setMobileFilterOpen}
            >
              <SidePanelContent size="full">
                <SidePanelHeader>
                  <div className="flex items-center justify-between gap-3">
                    <SidePanelTitle>Filter</SidePanelTitle>
                    {activeFilterCount > 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={handleClearAllFilters}
                      >
                        Clear
                      </Button>
                    ) : null}
                  </div>
                </SidePanelHeader>
                <SidePanelBody>
                  {filters.length > 0 ? (
                    <FilterFields
                      filters={filters}
                      activeFilters={sheetActiveFilters}
                      onFilterChange={handleSheetFilterChange}
                      presentation="sheet"
                      unsupportedFields={unsupportedFilterFields}
                      unsupportedReason={unsupportedFilterReason}
                    />
                  ) : null}
                </SidePanelBody>
              </SidePanelContent>
            </SidePanel>

            <SidePanel
              open={mobileGroupingOpen}
              onOpenChange={setMobileGroupingOpen}
            >
              <SidePanelContent size="full">
                <SidePanelHeader>
                  <SidePanelTitle>Grouping</SidePanelTitle>
                </SidePanelHeader>
                <SidePanelBody>
                  {onGroupByChange && groupByOptions ? (
                    <GroupByField
                      options={groupByOptions}
                      value={groupBy ?? groupByOptions[0]?.value ?? "none"}
                      onChange={onGroupByChange}
                      presentation="sheet"
                    />
                  ) : null}
                </SidePanelBody>
              </SidePanelContent>
            </SidePanel>

            <SidePanel
              open={mobileDisplayOpen}
              onOpenChange={setMobileDisplayOpen}
            >
              <SidePanelContent size="full">
                <SidePanelHeader>
                  <SidePanelTitle>
                    {onDensityChange
                      ? "Columns and density"
                      : "Property visibility"}
                  </SidePanelTitle>
                </SidePanelHeader>
                <SidePanelBody className="space-y-4">
                  {onDensityChange ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        Row density
                      </p>
                      <DensityOptions
                        density={density}
                        onDensityChange={onDensityChange}
                      />
                    </div>
                  ) : null}
                  {feat.columnToggle && columns.length > 0 ? (
                    <ColumnVisibilityList
                      columns={columns}
                      visibleColumns={visibleColumns}
                      onColumnVisibilityChange={onColumnVisibilityChange}
                      columnOrder={columnOrder}
                      onColumnOrderChange={onColumnOrderChange}
                    />
                  ) : null}
                </SidePanelBody>
              </SidePanelContent>
            </SidePanel>

            <SidePanel open={mobileSortOpen} onOpenChange={setMobileSortOpen}>
              <SidePanelContent size="full">
                <SidePanelHeader>
                  <SidePanelTitle>Sort</SidePanelTitle>
                </SidePanelHeader>
                <SidePanelBody className="space-y-4">
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-foreground"
                      htmlFor="mobile-table-sort-column"
                    >
                      Field
                    </label>
                    <Select
                      value={sortBy ?? undefined}
                      onValueChange={(nextSortBy) => {
                        if (!onSortChange) return;
                        onSortChange(nextSortBy, sortDirection);
                      }}
                    >
                      <SelectTrigger
                        id="mobile-table-sort-column"
                        className="h-10 w-full"
                      >
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Direction
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={
                          sortDirection === "asc" ? "default" : "outline"
                        }
                        onClick={() => {
                          if (!onSortChange || !sortBy) return;
                          onSortChange(sortBy, "asc");
                        }}
                      >
                        Ascending
                      </Button>
                      <Button
                        variant={
                          sortDirection === "desc" ? "default" : "outline"
                        }
                        onClick={() => {
                          if (!onSortChange || !sortBy) return;
                          onSortChange(sortBy, "desc");
                        }}
                      >
                        Descending
                      </Button>
                    </div>
                  </div>
                </SidePanelBody>
              </SidePanelContent>
            </SidePanel>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("py-0", className)}>
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {leftContent ? (
          <div className="shrink-0 pr-2">{leftContent}</div>
        ) : null}

        <div className="group/table-controls flex items-center gap-1 shrink-0">
          {leadingActions}

          {feat.search && (
            <ExpandingSearch
              value={searchValue}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
              // Matches the mobile input's aria-label above. Without it this
              // falls back to ExpandingSearch's generic "Search" default, so the
              // same control announced two different names depending on viewport
              // — dropped when ExpandableSearch was merged into ExpandingSearch
              // (9a13c7435d). Every other callsite passes a specific label; the
              // shared toolbar was the one that stopped.
              ariaLabel="Search table"
              triggerClassName={tableIconButtonClassName}
            />
          )}

          {hasQuickControls ? (
            <div
              className={cn(
                "shrink-0 overflow-hidden transition-[width,opacity] duration-150",
                quickControlsOpen
                  ? "pointer-events-none w-0 opacity-0 group-hover/table-controls:pointer-events-auto group-hover/table-controls:w-8 group-hover/table-controls:opacity-100 group-focus-within/table-controls:pointer-events-auto group-focus-within/table-controls:w-8 group-focus-within/table-controls:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:w-8 [@media(hover:none)]:opacity-100"
                  : "w-8 opacity-100",
              )}
            >
              <TableIconButton
                className="h-8 w-8 shrink-0"
                aria-label={
                  quickControlsOpen ? "Hide table tools" : "Show table tools"
                }
                aria-expanded={quickControlsOpen}
                onClick={() => setQuickControlsOpen((open) => !open)}
              >
                {quickControlsOpen ? (
                  <ChevronsRight className="h-4 w-4" />
                ) : (
                  <ChevronsLeft className="h-4 w-4" />
                )}
              </TableIconButton>
            </div>
          ) : null}

          {quickControlsOpen && feat.views ? (
            <ViewSwitcher
              currentView={currentView}
              onViewChange={onViewChange}
              enabledViews={enabledViews}
            />
          ) : null}

          {quickControlsOpen &&
          hasGroupingMenu &&
          groupByOptions &&
          onGroupByChange ? (
            <GroupByMenu
              options={groupByOptions}
              value={groupBy ?? groupByOptions[0]?.value ?? "none"}
              onChange={onGroupByChange}
            />
          ) : null}

          {quickControlsOpen && feat.export && onExport && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TableIconButton
                    className="h-8 w-8 shrink-0"
                    onClick={onExport}
                    aria-label="Export"
                  >
                    <Download />
                  </TableIconButton>
                </TooltipTrigger>
                <TooltipContent>Export</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {hasViewSettings ? (
            <TableSettingsPopover
              tooltip="View settings"
              title="View settings"
              open={viewSettingsOpen}
              onOpenChange={(open) => {
                setViewSettingsOpen(open);
                if (!open) setViewSettingsSection(null);
              }}
              trigger={
                <TableIconButton
                  className="relative h-8 w-8 shrink-0"
                  aria-label="View settings"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <TableCountIndicator
                    count={activeFilterCount}
                    className="absolute right-0 top-0"
                  />
                </TableIconButton>
              }
              className={
                viewSettingsSection === "filter" && isRuleFilterMode
                  ? "sm:w-[34rem]"
                  : undefined
              }
            >
              <div className="min-h-0 overflow-y-auto">
                <div className="flex h-9 items-center gap-2 px-2">
                  {viewSettingsSection ? (
                    <TableIconButton
                      className="h-7 w-7"
                      aria-label="Back to view settings"
                      onClick={() => setViewSettingsSection(null)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </TableIconButton>
                  ) : null}
                  <span className="text-sm font-semibold text-foreground">
                    {viewSettingsSection
                      ? {
                          layout: "Layout",
                          columns: "Property visibility",
                          filter: "Filter",
                          sort: "Sort",
                          group: "Group",
                          density: "Row density",
                        }[viewSettingsSection]
                      : "View settings"}
                  </span>
                </div>

                {!viewSettingsSection ? (
                  <div className="space-y-0.5 pb-1">
                    {savedViewsScope ? (
                      <div className="px-1 pb-2">
                        <TableViewsMenu
                          scopeKey={savedViewsScope}
                          currentState={savedViewsCurrentState}
                          activeViewId={activeViewId}
                          builtinViews={savedViewsBuiltin}
                          onApplyView={applySavedView}
                          onResetToDefaults={resetSavedViewToDefaults}
                          onAutoApplyDefault={applySavedView}
                        />
                      </div>
                    ) : null}
                    {feat.views && enabledViews.length > 1 ? (
                      <SettingsNavigationRow
                        icon={Table2}
                        label="Layout"
                        value={VIEW_LABELS[currentView]}
                        onClick={() => setViewSettingsSection("layout")}
                      />
                    ) : null}
                    {feat.columnToggle && columns.length > 0 ? (
                      <SettingsNavigationRow
                        icon={Eye}
                        label="Property visibility"
                        value={visibleColumnCount}
                        onClick={() => setViewSettingsSection("columns")}
                      />
                    ) : null}
                    {feat.filters && filters.length > 0 ? (
                      <SettingsNavigationRow
                        icon={Filter}
                        label="Filter"
                        value={activeFilterCount || undefined}
                        onClick={() => setViewSettingsSection("filter")}
                      />
                    ) : null}
                    {onSortChange && sortOptions.length > 0 ? (
                      <SettingsNavigationRow
                        icon={ArrowUpDown}
                        label="Sort"
                        value={activeSortLabel}
                        onClick={() => setViewSettingsSection("sort")}
                      />
                    ) : null}
                    {hasGroupingMenu ? (
                      <SettingsNavigationRow
                        icon={ListTree}
                        label="Group"
                        value={activeGroupByLabel}
                        onClick={() => setViewSettingsSection("group")}
                      />
                    ) : null}
                    {onDensityChange ? (
                      <SettingsNavigationRow
                        icon={AlignJustify}
                        label="Row density"
                        value={density}
                        onClick={() => setViewSettingsSection("density")}
                      />
                    ) : null}
                  </div>
                ) : null}

                {viewSettingsSection === "layout" ? (
                  <div className="p-2">
                    <ViewSwitcher
                      currentView={currentView}
                      onViewChange={onViewChange}
                      enabledViews={enabledViews}
                    />
                  </div>
                ) : null}
                {viewSettingsSection === "columns" ? (
                  <div className="p-1">
                    <div className="flex justify-end px-1 pb-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-[11px] font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
                        onClick={() => {
                          const resetOrder = columns.map((column) => column.id);
                          const defaultColumns = columns
                            .filter(
                              (column) =>
                                column.defaultVisible !== false ||
                                column.alwaysVisible,
                            )
                            .map((column) => column.id);
                          onColumnOrderChange?.(resetOrder);
                          onColumnVisibilityChange(
                            visibleColumnsInOrder(resetOrder, defaultColumns),
                          );
                        }}
                      >
                        Reset defaults
                      </Button>
                    </div>
                    <ColumnVisibilityList
                      columns={columns}
                      visibleColumns={visibleColumns}
                      onColumnVisibilityChange={onColumnVisibilityChange}
                      columnOrder={columnOrder}
                      onColumnOrderChange={onColumnOrderChange}
                    />
                  </div>
                ) : null}
                {viewSettingsSection === "filter" ? (
                  <div className="p-2">
                    {isRuleFilterMode ? (
                      <TableFilterBuilder
                        fields={filters}
                        query={resolvedFilterQuery}
                        onQueryChange={onFilterQueryChange!}
                        unsupportedFields={unsupportedFilterFields}
                        unsupportedReason={unsupportedFilterReason}
                      />
                    ) : (
                      <>
                        {activeFilterCount > 0 ? (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={handleClearAllFilters}
                          >
                            Clear filters
                          </Button>
                        ) : null}
                        <FilterFields
                          filters={filters}
                          activeFilters={activeFilters}
                          onFilterChange={onFilterChange}
                          unsupportedFields={unsupportedFilterFields}
                          unsupportedReason={unsupportedFilterReason}
                        />
                      </>
                    )}
                  </div>
                ) : null}
                {viewSettingsSection === "sort" && onSortChange ? (
                  <div className="space-y-3 p-2">
                    <Select
                      value={sortBy ?? undefined}
                      onValueChange={(value) =>
                        onSortChange(value, sortDirection)
                      }
                    >
                      <SelectTrigger aria-label="Sort by" className="w-full">
                        <SelectValue placeholder="Choose a column" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        size="xs"
                        variant={
                          sortDirection === "asc" ? "secondary" : "ghost"
                        }
                        disabled={!sortBy}
                        onClick={() => sortBy && onSortChange(sortBy, "asc")}
                      >
                        Ascending
                      </Button>
                      <Button
                        size="xs"
                        variant={
                          sortDirection === "desc" ? "secondary" : "ghost"
                        }
                        disabled={!sortBy}
                        onClick={() => sortBy && onSortChange(sortBy, "desc")}
                      >
                        Descending
                      </Button>
                    </div>
                  </div>
                ) : null}
                {viewSettingsSection === "group" &&
                groupByOptions &&
                onGroupByChange ? (
                  <div className="p-2">
                    <GroupByField
                      options={groupByOptions}
                      value={groupBy ?? groupByOptions[0]?.value ?? "none"}
                      onChange={onGroupByChange}
                    />
                  </div>
                ) : null}
                {viewSettingsSection === "density" ? (
                  <div className="p-2">
                    <DensityOptions
                      density={density}
                      onDensityChange={onDensityChange}
                    />
                  </div>
                ) : null}
              </div>
            </TableSettingsPopover>
          ) : null}

          {customActions}

          {selectedCount > 0 && feat.bulkEdit && onBulkEdit && (
            <ToolbarBulkAction
              icon={PencilLine}
              verb="Edit"
              selectedCount={selectedCount}
              onClick={onBulkEdit}
            />
          )}

          {selectedCount > 0 && feat.bulkDelete && onBulkDelete && (
            <ToolbarBulkAction
              icon={Trash2}
              verb="Delete"
              selectedCount={selectedCount}
              onClick={onBulkDelete}
            />
          )}
          {selectedCount > 0 && selectedAction && (
            <ToolbarBulkAction
              icon={selectedAction.icon}
              verb={selectedAction.verb}
              selectedCount={selectedCount}
              onClick={selectedAction.onClick}
              disabled={selectedAction.disabled}
            />
          )}
        </div>

        <span className="ml-auto shrink-0 pl-3 text-xs tabular-nums text-muted-foreground">
          {formatToolbarRowCount({
            selectedCount,
            filteredItems,
            totalItems,
            itemNoun,
          })}
        </span>
      </div>
    </div>
  );
}
