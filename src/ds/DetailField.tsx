import * as React from "react";
import { formatCurrency, formatDate } from "../lib/format";
import { cn } from "../lib/utils";
import { LabelHeading } from "../layout/headings";

// ---------------------------------------------------------------------------
// DetailField — a single label + value pair for read-only detail views
// ---------------------------------------------------------------------------

export interface DetailFieldProps {
  label: string;
  children?: React.ReactNode;
  /** Backward-compatible alias for children. Prefer children for new usage. */
  value?: React.ReactNode;
  /** Render a primitive value as currency. */
  currency?: boolean;
  /** Render a primitive value as a date. */
  date?: boolean;
  /** Span multiple columns in a DetailFieldGrid. */
  span?: 1 | 2 | 3;
  /**
   * Text to render when the value is empty. There is no default: an empty
   * field renders nothing (noise gate — a dash is not a value). Pass this only
   * when a caller genuinely needs a placeholder glyph, e.g. a printed PDF.
   */
  emptyPlaceholder?: string;
  /**
   * Keep the label row visible when the value is empty. Off by default so an
   * unanswered field disappears instead of rendering an empty gutter. Turn on
   * only where a fixed row count carries meaning (side-by-side comparisons).
   */
  keepWhenEmpty?: boolean;
  /**
   * Drop the label column and give the value the full width. Use when the
   * surrounding container already names the field (e.g. a SidebarPanel whose
   * heading is the field name), so the label would only repeat itself.
   */
  hideLabel?: boolean;
  /**
   * Prose values are body copy: regular weight on a 24px line, capped at a
   * 70ch measure. Use for paragraphs, findings, and long editable text.
   * Label placement is the same as `standard` — every field stacks.
   */
  layout?: "standard" | "prose";
  className?: string;
}

// Spans follow the SAME container thresholds as DetailFieldGrid's column
// count below. A span keyed to the viewport in a grid keyed to its container
// spans into a column that does not exist: `lg:col-span-3` inside a 2-column
// grid created an implicit 0px third track, and the next field was placed in
// it as a one-letter-per-line ladder (2026-09-20). `span={3}` means "the full
// row" wherever the grid has more than one column.
const spanClass: Record<1 | 2 | 3, string> = {
  1: "",
  2: "@[28rem]/detail-grid:col-span-2",
  3: "@[28rem]/detail-grid:col-span-full",
};

/**
 * Values the product treats as "no answer". Upstream sources spell absence a
 * dozen ways — a literal dash from a CSV import, the string "null" from a JSON
 * column, an empty array from a join. All of them are empty, not values.
 * Noise gate: an empty field renders nothing.
 */
const EMPTY_VALUE_STRINGS = new Set([
  "",
  "-",
  "\u2013",
  "\u2014",
  "null",
  "undefined",
  "n/a",
  "N/A",
]);

function isEmptyValue(value: React.ReactNode): boolean {
  if (value === null || value === undefined || value === false) return true;
  if (typeof value === "string") {
    return (
      EMPTY_VALUE_STRINGS.has(value.trim().toLowerCase()) ||
      EMPTY_VALUE_STRINGS.has(value.trim())
    );
  }
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function formatDetailValue({
  value,
  currency,
  date,
}: {
  value: React.ReactNode;
  currency?: boolean;
  date?: boolean;
}): React.ReactNode {
  if (currency && (typeof value === "number" || typeof value === "string")) {
    return formatCurrency(value);
  }

  if (date && (typeof value === "string" || value instanceof Date)) {
    return formatDate(value);
  }

  return value;
}

export function DetailField({
  label,
  children,
  value,
  currency,
  date,
  span = 1,
  emptyPlaceholder,
  keepWhenEmpty = false,
  hideLabel = false,
  layout = "standard",
  className,
}: DetailFieldProps) {
  const rawValue = children ?? value;
  const isEmpty = isEmptyValue(rawValue);

  // An empty field renders nothing at all. Callers that need the row to hold
  // its place opt in with keepWhenEmpty, or supply an explicit placeholder.
  if (isEmpty && !keepWhenEmpty && !emptyPlaceholder) return null;

  const displayValue = isEmpty
    ? emptyPlaceholder
    : formatDetailValue({ value: rawValue, currency, date });

  return (
    <div
      className={cn(
        "@container/detail-field min-w-0",
        spanClass[span],
        className,
      )}
    >
      <div
        className={cn(
          // The label sits ON TOP of its value, at every width and in every
          // layout (owner, 2026-09-23, against the prime contract mockup:
          // "the property label is stacked instead of displayed
          // horizontally").
          //
          // This deleted a label-width negotiation that had produced three
          // separate bugs in a month, because a stacked label has no width to
          // negotiate: a `shrink-0` label took the whole row on a ~200px card
          // and left the value one character wide (/executive, 2026-08-24); a
          // `span={3}` row sized its own 9rem gutter while its one-column
          // neighbours got 7rem, so Description started 36px right of the
          // column above it (prime contract, 2026-09-20); and a 7rem column
          // wrapped every two-word label onto two lines on a phone
          // (2026-09-21). The grid no longer publishes `--detail-label-col`
          // and the field no longer reads one.
          "flex min-w-0 flex-col gap-1",
        )}
      >
        {hideLabel ? null : (
          // The label is the heading ladder's micro-label (12/16, medium,
          // muted, sentence case) and the value is 14/20 medium near-ink. Both
          // at 12-14px regular read as the same gray; the weight and ink step
          // is what makes a field scannable (owner, 2026-09-20). Never all
          // caps (owner, 2026-09-23).
          <LabelHeading className="min-w-0">{label}</LabelHeading>
        )}
        <div
          className={cn(
            // `min-w-0` is load-bearing: a grid track's default `min-width:auto`
            // floors the column at its content's min-content width, so without
            // this the inner `truncate` on an inline-edit trigger clips against
            // a box sized to its own text rather than against the column. That
            // is how "Plumbing" rendered as "Plum..." with ~200px of empty
            // gutter beside it. Case law: DESIGN.md.
            //
            // Values are LEFT-aligned against the label column at every width
            // (#99). The previous flush-right treatment needed a pile of child
            // selectors to drag an inline-edit trigger into line with its plain
            // neighbour; left-aligned needs none, because the trigger already
            // left-aligns its own label.
            "min-w-0 break-words text-sm text-foreground",
            // Prose is body copy: regular weight on a 24px line, and the value
            // column — the layout cell, not the text — caps the measure at
            // 70ch so a full-width grid does not stretch a paragraph across
            // 1200px (DESIGN.md section 3). Everything else is a value: medium
            // weight so it stands off its label.
            layout === "prose"
              ? "max-w-[70ch] font-normal leading-6"
              : "font-medium leading-5",
          )}
        >
          {isEmpty ? (
            <span className="text-muted-foreground/50">{displayValue}</span>
          ) : (
            displayValue
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DetailFieldGrid — responsive grid layout for DetailField groups
// ---------------------------------------------------------------------------

export interface DetailFieldGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  /** Backward-compatible alias for columns. Prefer columns for new usage. */
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

// Column count follows the GRID'S OWN width, not the viewport — the same
// rule DetailField applies to its label column (DESIGN.md section 15).
//
// A viewport breakpoint cannot know what else is on the row. At a 1280px
// viewport beside a 360px financial rail the grid is ~736px wide; three
// viewport-driven columns gave each field 245px, of which the 7rem label
// took 112 and the pencil 22, leaving ~78px for the value — "Approved"
// broke into "Approve / d" (2026-09-20). Each column must hold a label and
// a readable value: two columns from 36rem (18rem each), three from 56rem,
// four from 76rem. `columns` is the ceiling, never a promise.
// Thresholds are ~14rem of container per column, recalibrated for the stacked
// label (2026-09-23). They used to be ~18rem, because a cell had to fit a 9rem
// label AND its value on one line; a stacked cell only has to fit the value.
// The numbers come from the measured page, not from the mockup's arithmetic:
// at the reference 1280px the prime contract's field grid measures 686px
// (42.9rem), and the design shows three columns there. A 46rem threshold —
// derived from the card's outer width — still fell back to two.
const colClass: Record<1 | 2 | 3 | 4, string> = {
  1: "",
  2: "@[28rem]/detail-grid:grid-cols-2",
  3: "@[28rem]/detail-grid:grid-cols-2 @[42rem]/detail-grid:grid-cols-3",
  4: "@[28rem]/detail-grid:grid-cols-2 @[42rem]/detail-grid:grid-cols-3 @[58rem]/detail-grid:grid-cols-4",
};

export function DetailFieldGrid({
  children,
  columns,
  cols,
  className,
}: DetailFieldGridProps) {
  const resolvedColumns = columns ?? cols ?? 3;

  return (
    <div className="@container/detail-grid min-w-0">
      <div
        className={cn(
          "grid grid-cols-1 gap-x-8 gap-y-6",
          colClass[resolvedColumns],
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
