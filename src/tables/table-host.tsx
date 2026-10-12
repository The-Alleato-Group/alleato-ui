"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import type { PageTab, PageTabsProps as PortablePageTabsProps } from "../layout/page-tabs";

export interface HeaderMenuItem {
  id: string;
  label: string;
  /** A lucide component, or an already-rendered icon node. */
  icon?: LucideIcon | React.ReactNode;
  onSelect?: () => void;
  href?: string;
  /** The href is a file to save (an export endpoint), not a page. */
  download?: boolean;
  disabled?: boolean;
  destructive?: boolean;
  /** Omit the item entirely (e.g. a permission the viewer lacks). */
  hidden?: boolean;
}

export interface HeaderAction {
  id: string;
  /** Accessible name and tooltip. Never rendered as visible text. */
  label: string;
  /**
   * A lucide component, or a rendered element when the caller is a client
   * component. A Server Component caller must leave this unset — a rendered
   * icon element created there and threaded into a client component can break
   * the RSC/Flight boundary (confirmed live on the Meetings page, 2026-09-23)
   * — and instead let its client-component target attach the icon itself.
   */
  icon?: LucideIcon | React.ReactNode;
  onSelect?: () => void;
  href?: string;
  /** The href is a file to save (an export endpoint), not a page. */
  download?: boolean | string;
  /** When present the action opens a menu instead of acting directly. */
  items?: HeaderMenuItem[];
  /** Menu body as JSX (DropdownMenu items, submenus) when `items` is too flat. */
  menu?: React.ReactNode;
  /** Toggle state for actions that open/close something (aria-pressed). */
  pressed?: boolean;
  /**
   * Wrap the header-rendered trigger in the action's own popover/dialog when a
   * dropdown menu is not the right surface. The trigger's look stays owned here.
   */
  wrap?: (trigger: React.ReactElement) => React.ReactNode;
  disabled?: boolean;
  hidden?: boolean;
  testId?: string;
}

export interface HeaderPrimaryAction {
  id: string;
  /** The business verb, rendered as the header's only visible text button. */
  label: string;
  icon?: LucideIcon | React.ReactNode;
  onSelect?: () => void;
  href?: string;
  disabled?: boolean;
  hidden?: boolean;
  testId?: string;
}

export type SavedViewFilterValue =
  | string
  | number
  | boolean
  | string[]
  | null;

export interface SavedTableView {
  id: string;
  scope_key: string;
  name: string;
  is_default: boolean;
  visible_columns: string[] | null;
  column_order: string[] | null;
  column_widths: Record<string, number> | null;
  sort_by: string | null;
  sort_direction: "asc" | "desc" | null;
  filters: Record<string, SavedViewFilterValue> | null;
  created_at: string;
  updated_at: string;
}

export interface TableViewsMenuCurrentState {
  visible_columns: string[];
  column_order?: string[] | null;
  column_widths?: Record<string, number> | null;
  sort_by: string | null;
  sort_direction: "asc" | "desc";
  filters: Record<string, SavedViewFilterValue>;
}

export interface TableViewsMenuProps {
  scopeKey: string;
  currentState: TableViewsMenuCurrentState;
  activeViewId: string | null;
  /** Shared views this table offers before any user-saved view. Ids must start with `builtin:`. */
  builtinViews?: readonly SavedTableView[];
  onApplyView: (view: SavedTableView) => void;
  /** Called when the user picks "Reset to defaults" — parent should restore default presentation. */
  onResetToDefaults: () => void;
  /** Called whenever a default view should auto-apply (e.g. on first load). */
  onAutoApplyDefault?: (view: SavedTableView) => void;
}

export interface BulkEditFieldOption {
  value: string;
  label: string;
}

export type BulkEditValue = string | null;

export type BulkEditIntent = "unchanged" | "set" | "clear";

export interface BulkEditSelectionItem {
  id: string;
  label: string;
  context?: string | null;
}

export interface BulkEditField<T = unknown> {
  id: string;
  label: string;
  type: "text" | "select";
  options?: BulkEditFieldOption[];
  searchable?: boolean;
  inputType?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  /** Select fields may expose an explicit Clear option. Empty text never clears. */
  allowClear?: boolean;
  /** Plain-text replacement must opt into its destructive consequence. */
  destructiveReplacement: boolean;
  /** Retained by the table contract for consumers that need record-value access. */
  getValue: (item: T) => string | number | null | undefined;
}

export interface BulkEditDialogProps<T = unknown> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  /** @deprecated The normal form intentionally does not render selection copy. */
  itemNoun?: string;
  /** @deprecated The normal form intentionally does not render selection context. */
  selectedItems?: BulkEditSelectionItem[];
  /** @deprecated The normal form intentionally does not render selection context. */
  selectionContextNoun?: string;
  /** @deprecated The normal form intentionally does not render current values. */
  fieldCurrentValues?: Record<
    string,
    Array<string | number | null | undefined>
  >;
  fields: BulkEditField<T>[];
  /** Applies every changed field. Throws to preserve the draft. */
  onApply: (changes: Record<string, BulkEditValue>) => void | Promise<void>;
}

export type TablePaginationBehavior = "pages" | "scroll";

export interface UnifiedTablePreferences {
  perPage?: number;
  paginationBehavior?: TablePaginationBehavior;
}

export type TableSidePanelBodyLayout = "standard" | "full-bleed";

export type TableSidePanelMode = "overlay" | "inline" | "mobile";

export type TableSidePanelSize = "standard" | "wide";

export interface TableSidePanelControllerOptions {
  enabled?: boolean;
  size?: TableSidePanelSize;
  storageKey?: string;
}

export interface TableSidePanelController {
  width: number;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onResizeStart: React.MouseEventHandler<HTMLDivElement>;
}

export interface PageHeaderProps {
  // Content
  title: string;
  titleContent?: React.ReactNode;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;

  // Layout options
  variant?: "default" | "executive" | "compact" | "budget" | "workspace";
  headerLayout?: "default" | "balanced";
  actions?: React.ReactNode;
  actionsAlignment?: "start" | "center" | "end";
  mobileActionsInline?: boolean;
  /**
   * The ⋮ overflow trigger, and ONLY that. On mobile it renders on the TITLE
   * line, right-aligned; every other action stays in the action row below.
   * On desktop it rejoins the end of the action row.
   *
   * Deliberately a separate slot from `actions`: `mobileActionsInline` hoists
   * the WHOLE action row onto the title line, which is a different thing and
   * not what this rule asks for. DESIGN.md.
   */
  overflowAction?: React.ReactNode;
  className?: string;
  titleClassName?: string;

  // Navigation
  breadcrumbs?: Array<{ label: string; href?: string }>;
  tabs?: PageTab[];

  // Project context
  showProjectName?: boolean;
  preHeading?: {
    project?: string;
    client?: string;
  };

  // Status
  statusBadge?: React.ReactNode;

  // Export functionality
  showExportButton?: boolean;
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  exportLabel?: string;
}

export interface TableFailureContext {
  area: string;
  operation: string;
  error: unknown;
  userVisibleFallback: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}
export interface TableHost {
  PageHeader: React.ComponentType<PageHeaderProps>;
  PageTabs: React.ComponentType<Omit<PortablePageTabsProps, "pathname" | "search" | "onNavigate">>;
  HeaderActions: React.ComponentType<{ primary?: HeaderPrimaryAction; actions?: HeaderAction[]; overflow?: HeaderMenuItem[]; overflowMenu?: React.ReactNode; children?: React.ReactNode; className?: string }>;
  SectionRuleHeading: React.ComponentType<{ label: string; className?: string }>;
  BulkEditDialog: <T>(props: BulkEditDialogProps<T>) => React.ReactNode;
  TableViewsMenu: React.ComponentType<TableViewsMenuProps>;
  useTableSidePanelController: (options?: TableSidePanelControllerOptions) => TableSidePanelController;
  readUnifiedTablePreferences: () => UnifiedTablePreferences;
  saveUnifiedTablePreferences: (updates: UnifiedTablePreferences) => void;
  storage: Pick<Storage, "getItem" | "setItem">;
  reportNonCriticalFailure: (context: TableFailureContext) => void;
  toast: {
    success: (message: string, options?: { id?: string; description?: string }) => unknown;
    error: (message: string, options?: { id?: string; description?: string }) => unknown;
  };
}
const TableHostContext = React.createContext<TableHost | null>(null);

/** Keeps application routing, identity, persistence and reporting outside table presentation. */
export function TableHostProvider({ host, children }: { host: TableHost; children: React.ReactNode }) {
  return <TableHostContext.Provider value={host}>{children}</TableHostContext.Provider>;
}

/** Rejects missing integrations before a table can silently lose a host behavior. */
export function useTableHost(): TableHost {
  const host = React.useContext(TableHostContext);
  if (!host) throw new Error("UnifiedTablePage requires TableHostProvider with navigation, preferences and reporting adapters.");
  return host;
}

