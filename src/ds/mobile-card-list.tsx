"use client";

import { isValidElement, type ReactNode } from "react";
import { ChevronRight, Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "../components/button";
import { SelectionCheckbox } from "./selection-checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";

/** Structural presentation contract: a host table may supply additional fields. */
export interface MobileCardColumn<T> {
  id: string;
  label: string;
  render: (item: T) => ReactNode;
}

/* ────────────────────────────────────────────────────────────────────────────
 * MobileCardList — renders table rows as touch-friendly cards on small screens.
 *
 * Shown below the `sm` breakpoint (< 640px); the desktop <Table> takes over at
 * ≥ sm. Each row becomes a card:
 *   - First column → the identity block (rendered as-authored, e.g. avatar + name)
 *   - Next 2-3 columns → a clean label / value metadata list
 *   - Row actions via a "…" menu (if provided), else a chevron for clickable rows
 *
 * Motion: intentionally NONE on entrance. Cards render instantly at full
 * opacity. An earlier version used a staggered fade/slide entrance (first via a
 * JS animation loop, then via CSS) and BOTH stranded rows at opacity:0 when the
 * animation was throttled — leaving most of the list invisible. Content must
 * never depend on an animation completing to be seen. The only motion here is
 * interaction-triggered (press / hover / focus), which can never hide a row.
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Whether a column's `render` produced anything worth giving a row to.
 * Columns signal "no value" by returning `null`, and a few return an empty
 * string or a placeholder dash.
 */
function hasRenderedValue(value: ReactNode): boolean {
  if (value === null || value === undefined || value === false || value === true) return false;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed !== "" && trimmed !== "—" && trimmed !== "-";
  }
  if (typeof value === "number") return true;
  if (Array.isArray(value)) return value.some((entry) => hasRenderedValue(entry));
  // A plain host element (`<span className=…>{null}</span>`) is a wrapper,
  // not a value: the submittal cards were headed by an empty span from the
  // Spec Section column (2026-09-22). Look through it. A component element
  // (an icon, a badge) is opaque and counts as a value.
  if (isValidElement<{ children?: ReactNode }>(value) && typeof value.type === "string") {
    return hasRenderedValue(value.props.children);
  }
  return true;
}

export interface MobileCardListProps<T> {
  items: T[];
  columns: MobileCardColumn<T>[];
  getRowId: (item: T) => string;
  activeRowId?: string | null;
  onRowClick?: (item: T) => void;
  /** Hide the click affordance (and skip the click) on rows this returns false for. Defaults to clickable whenever `onRowClick` is set. */
  allowRowClick?: (item: T) => boolean;
  selectedIds?: readonly string[];
  onSelectRow?: (id: string, checked: boolean) => void;
  isFetching?: boolean;
  /** Custom row actions renderer (same as the desktop table) */
  rowActions?: (item: T) => ReactNode;
  /** Default view handler — renders a simple "…" > View menu item when no custom rowActions */
  onView?: (item: T) => void;
  /** Specific wording when a row opens a named live surface. */
  viewLabel?: string;
  /** Default edit handler — renders a simple "…" > Edit menu item when no custom rowActions */
  onEdit?: (item: T) => void;
  /** Hide Edit on rows this returns false for. */
  allowEdit?: (item: T) => boolean;
  /** Default delete handler — renders a simple "…" > Delete menu when no custom rowActions */
  onDelete?: (item: T) => void;
  /** Hide Delete on rows this returns false for. */
  allowDelete?: (item: T) => boolean;
  hasRowActions: boolean;
}

export function MobileCardList<T>({
  items,
  columns,
  getRowId,
  activeRowId,
  onRowClick,
  allowRowClick,
  selectedIds,
  onSelectRow,
  isFetching,
  rowActions,
  onView,
  viewLabel,
  onEdit,
  allowEdit,
  onDelete,
  allowDelete,
  hasRowActions,
}: MobileCardListProps<T>) {
  return (
    <div
      className={cn(
        "sm:hidden",
        isFetching && "opacity-70 transition-opacity",
      )}
    >
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const rowId = getRowId(item);
          const isActive = activeRowId === rowId;
          const isSelected = selectedIds?.includes(rowId) ?? false;
          const isClickable =
            Boolean(onRowClick) && (!allowRowClick || allowRowClick(item));

          // The identity is the first LABELLED column that renders a value for
          // this row; a control column (empty label — an expander, a checkbox)
          // headed the prime-contract and submittal cards with a blank line
          // and a chevron (2026-09-22). Its affordance is the card tap. The
          // next 2-3 labelled columns become metadata rows.
          const labelled = columns.filter((col) => col.label.trim() !== "");
          const rendered = labelled.map((col) => ({ col, value: col.render(item) }));
          const titleIndex = rendered.findIndex(({ value }) => hasRenderedValue(value));
          const titleCol = titleIndex === -1 ? labelled[0] : labelled[titleIndex];
          // A column that renders nothing for this row contributes nothing —
          // a label with no value beside it is noise, not information.
          const visibleDetails = rendered
            .filter((_, index) => index !== (titleIndex === -1 ? 0 : titleIndex))
            .slice(0, 3)
            .filter(({ value }) => hasRenderedValue(value));

          return (
            <div
              key={rowId}
              role={isClickable ? "button" : undefined}
              tabIndex={isClickable ? 0 : undefined}
              className={cn(
                "rounded-2xl bg-card px-4 py-4 shadow-sm",
                "transition-[background-color,box-shadow,transform] duration-200",
                isClickable &&
                  "cursor-pointer hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] active:bg-muted/40",
                (isActive || isSelected) && "ring-2 ring-primary/60",
              )}
              onClick={isClickable ? () => onRowClick?.(item) : undefined}
              onKeyDown={
                isClickable
                  ? (event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      onRowClick?.(item);
                    }
                  : undefined
              }
            >
              {/* Identity row: title (as authored) + actions/chevron */}
              <div className="flex min-w-0 items-center gap-3">
                {onSelectRow ? (
                  <div
                    className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <SelectionCheckbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onSelectRow(rowId, checked)}
                      aria-label="Select row"
                    />
                  </div>
                ) : null}
                <div
                  // Hover-reveal affordances (the desktop columns' inline-edit
                  // pencils, `opacity-0 group-hover:opacity-100`) can never be
                  // hovered on touch. They stay invisible but still take up
                  // room, so drop them from the card entirely.
                  className="min-w-0 flex-1 text-[15px] font-semibold leading-tight text-foreground [&_p]:truncate [&_a.opacity-0]:hidden [&_button.opacity-0]:hidden"
                >
                  {titleCol?.render(item)}
                </div>

                {hasRowActions ? (
                  <div
                    // 44px minimum lives here and ONLY here. Applying it to
                    // every button in the card inflated each metadata row to
                    // 44px, because the columns are shared with the desktop
                    // table and render inline-edit controls as buttons.
                    className="-mr-1.5 shrink-0 [&_button]:min-h-11 [&_button]:min-w-11"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    {rowActions ? (
                      rowActions(item)
                    ) : onView ||
                      (onEdit && (allowEdit?.(item) ?? true)) ||
                      (onDelete && (allowDelete?.(item) ?? true)) ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(item)}>
                              <Eye className="mr-2 h-4 w-4" />
                              {viewLabel ?? "View"}
                            </DropdownMenuItem>
                          )}
                          {onView && (onEdit || onDelete) ? (
                            <DropdownMenuSeparator />
                          ) : null}
                          {onEdit && (allowEdit?.(item) ?? true) && (
                            <DropdownMenuItem onClick={() => onEdit(item)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {onEdit &&
                          (allowEdit?.(item) ?? true) &&
                          onDelete &&
                          (allowDelete?.(item) ?? true) ? (
                            <DropdownMenuSeparator />
                          ) : null}
                          {onDelete && (allowDelete?.(item) ?? true) && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => onDelete(item)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                ) : isClickable ? (
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/40" />
                ) : null}
              </div>

              {/* Metadata: quiet label on the left, the value carries the
                  weight on the right. Labels recede (low contrast, no shouting
                  uppercase) so the values read as the content and the block
                  stops looking like a shrunken table. Labels never wrap; long
                  values truncate. */}
              {visibleDetails.length > 0 && (
                <div className="mt-3.5 space-y-2.5">
                  {visibleDetails.map(({ col, value }) => (
                    <div
                      key={col.id}
                      className="flex min-w-0 items-center justify-between gap-4"
                    >
                      <span className="shrink-0 whitespace-nowrap text-xs font-normal text-muted-foreground">
                        {col.label}
                      </span>
                      <span
                        // `[&>*]:w-auto` is what makes the value sit on the
                        // right. The columns are shared with the desktop
                        // table, where a cell's control is `w-full` so it
                        // fills its <td>; left alone here it fills the card
                        // row too and the value reads as left-aligned.
                        className="flex min-w-0 flex-1 justify-end truncate text-right text-sm font-medium text-foreground [&>*]:w-auto [&>*]:max-w-full [&_*]:truncate"
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
