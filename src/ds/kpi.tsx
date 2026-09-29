"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "../lib/utils";
import { chartCardSurfaceClassName } from "./chart-card";

// ---------------------------------------------------------------------------
// KpiBlock — one metric, four optional slots.
//
// Anatomy (fixed order, every slot after the value is optional):
//
//   EYEBROW LABEL          ← always
//   24px value             ← always
//   [↑ 18.4%]              ← delta
//   vs $209k last month    ← context
//   ▁▃▅▂▆▄█                ← trend
//   ▓▓▓▓░░░░               ← progress
//
// Sizes come from the (since-deleted) premium examples rather than
// being invented here: `md` is `.pyramid-kpi` (24px value, 20/24 padding) and
// `lg` is `.bento-cell` (28px value, 24 padding). Matching the reference is the
// point — do not retune these by eye.
// ---------------------------------------------------------------------------

type KpiSize = "sm" | "md" | "lg";

/**
 * Legacy size names kept so the ~30 existing call sites keep compiling.
 * `prominent` and `compact` were already aliases before this component was
 * restyled; they stay aliases rather than becoming a fourth and fifth scale.
 */
type KpiSizeAlias = "small" | "medium" | "large" | "prominent" | "compact";

const SIZE_ALIASES: Record<KpiSizeAlias, KpiSize> = {
  small: "sm",
  compact: "sm",
  medium: "md",
  large: "lg",
  prominent: "lg",
};

function resolveSize(size: KpiSize | KpiSizeAlias): KpiSize {
  return size in SIZE_ALIASES
    ? SIZE_ALIASES[size as KpiSizeAlias]
    : (size as KpiSize);
}

interface KpiBlockProps {
  label: string;
  value: string;
  /** Change chip beside the value. Text carries its own qualifier when useful. */
  delta?: {
    value: string;
    positive: boolean;
  };
  /** One quiet line under the value: a comparison, a target, a freshness stamp. */
  context?: string;
  /**
   * Mini bar chart. Values are plotted relative to the largest entry, so the
   * caller passes raw numbers and does not normalise. The final bar is the
   * current period and is drawn in the accent; earlier bars are its tint.
   */
  trend?: number[];
  size?: KpiSize | KpiSizeAlias;
  href?: string;
  progress?: {
    value: number; // 0–100
    tone?: "neutral" | "warning" | "danger";
  };
  /**
   * Lineage under the figure: source, freshness, trust status. Rendered last,
   * below context, trend and progress, so the value stays the thing read first.
   */
  footer?: React.ReactNode;
}

export type { KpiBlockProps, KpiSize };

// Each size steps down one notch below `sm` (phones): two metrics share a
// 390px row there, and "$8,703,961.03" at text-2xl bold does not fit half of
// it — the prime contract page clipped its own contract total (owner,
// 2026-09-21: "the KPI cards should have smaller text and display 2 per row").
const VALUE_SIZE: Record<KpiSize, string> = {
  sm: "text-base sm:text-xl",
  md: "text-lg sm:text-2xl",
  lg: "text-xl sm:text-[28px]",
};

const CONTEXT_SIZE: Record<KpiSize, string> = {
  sm: "text-[10px]",
  md: "text-[11px]",
  lg: "text-xs",
};

// The eyebrow and the internal gaps have to shrink WITH the value, not stay
// fixed while only the value changes. Holding them constant collapsed `sm` to a
// 10px label above an 18px value — a 1.8x ratio, against 2.4x at md and 2.8x at
// lg — so it read as a form field rather than as a metric in the same family.
const LABEL_SIZE: Record<KpiSize, string> = {
  sm: "text-[9px]",
  md: "text-[10px]",
  lg: "text-[10px]",
};

const VALUE_GAP: Record<KpiSize, string> = {
  sm: "mt-1",
  md: "mt-2",
  lg: "mt-2",
};

const CONTEXT_GAP: Record<KpiSize, string> = {
  sm: "mt-1",
  md: "mt-1.5",
  lg: "mt-1.5",
};

export function KpiBlock({
  label,
  value,
  delta,
  context,
  trend,
  size = "md",
  href,
  progress,
  footer,
}: KpiBlockProps) {
  const s = resolveSize(size);

  const content = (
    <>
      <span
        className={cn(
          // Sentence case: a label is never all caps (owner, 2026-09-23).
          "block font-bold text-muted-foreground",
          LABEL_SIZE[s],
        )}
      >
        {label}
      </span>

      {/* Value and delta share one row, delta pinned to the right — the delta
          is a qualifier on the value, not a second line of the card. It used
          to stack below at full width, which read as its own row rather than
          "the value, annotated" (owner correction 2026-09-11). */}
      <div
        className={cn(
          "flex items-baseline justify-between gap-2",
          VALUE_GAP[s],
        )}
      >
        <span
          className={cn(
            // `whitespace-nowrap` keeps a formatted figure whole: "$17,160,726"
            // broken across lines is unreadable.
            "block font-bold leading-none whitespace-nowrap text-foreground",
            VALUE_SIZE[s],
          )}
        >
          {value}
        </span>

        {delta && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded px-[7px] py-0.5 text-[11px] font-semibold",
              // Semantic tokens, not raw palette classes. This component shipped
              // with `bg-green-50 text-green-600`, which is a hardcoded-colour
              // violation and does not follow the theme.
              delta.positive
                ? "bg-success-surface text-success"
                : "bg-destructive-surface text-destructive",
            )}
          >
            <span aria-hidden>{delta.positive ? "↑" : "↓"}</span>
            {delta.value}
          </span>
        )}
      </div>

      {context && (
        <span
          className={cn(
            "block text-muted-foreground",
            CONTEXT_GAP[s],
            CONTEXT_SIZE[s],
          )}
        >
          {context}
        </span>
      )}

      {trend && trend.length > 0 && <KpiTrend values={trend} />}

      {progress !== undefined && (
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-border">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              progress.tone === "danger"
                ? "bg-destructive"
                : progress.tone === "warning"
                  ? "bg-warning"
                  : "bg-primary",
            )}
            style={{ width: `${Math.min(100, Math.max(0, progress.value))}%` }}
          />
        </div>
      )}

      {footer !== undefined && footer !== null && (
        <div className="mt-3">{footer}</div>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="group block">
        {content}
      </Link>
    );
  }

  return <div>{content}</div>;
}

// ---------------------------------------------------------------------------
// KpiTrend — the mini bar chart. Decorative in the accessibility tree: the
// figure it summarises is already the block's value, so a screen reader
// announcing every bar would be noise.
// ---------------------------------------------------------------------------

function KpiTrend({ values }: { values: number[] }) {
  const max = Math.max(...values, 0);
  return (
    <div className="mt-3 flex h-10 items-end gap-1" aria-hidden>
      {values.map((v, i) => {
        const isCurrent = i === values.length - 1;
        // A zero-height bar reads as a rendering bug rather than as "no
        // activity", so every bar keeps a visible floor.
        const pct = max > 0 ? Math.max(6, (v / max) * 100) : 6;
        return (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-t-sm",
              isCurrent ? "bg-primary" : "bg-border",
            )}
            style={{ height: `${pct}%` }}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KpiStrip — inline label/value pairs. Not a card; used in dense headers.
// ---------------------------------------------------------------------------

export function KpiStrip({
  metrics,
  density = "default",
}: {
  metrics: Pick<KpiBlockProps, "label" | "value">[];
  density?: "default" | "compact";
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center",
        density === "compact"
          ? "gap-x-3 gap-y-1 py-0 text-xs"
          : "gap-x-4 gap-y-2 py-2 text-sm",
      )}
    >
      {metrics.map((metric, i) => (
        <span
          className={cn(
            "flex items-center",
            density === "compact" ? "gap-3" : "gap-4",
          )}
          key={metric.label}
        >
          {i > 0 && (
            <span className="hidden h-3 w-px bg-border sm:block" aria-hidden />
          )}
          <span className="flex items-baseline gap-1.5">
            <span className="text-muted-foreground">{metric.label}</span>
            <span className="font-semibold tabular-nums text-foreground">
              {metric.value}
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KpiRow — the container. `surface` is the only structural difference between
// the two reference layouts:
//
//   flush   hairline dividers, square corners, no shadow. Sits inside a page
//           card or directly under a header that already owns the edge.
//   raised  rounded, own hairline border and shadow. Stands alone on the page.
//
// The reference uses shadow-md; DESIGN.md caps shadows at shadow-sm, and the
// design system wins over the example.
// ---------------------------------------------------------------------------

const ITEM_PADDING: Record<KpiSize, string> = {
  sm: "p-3 sm:p-4",
  md: "p-4 sm:px-6 sm:py-5",
  lg: "p-4 sm:p-6",
};

export function KpiRow({
  metrics,
  size = "md",
  surface = "raised",
  bare = false,
  mobileColumns = 2,
}: {
  metrics: KpiBlockProps[];
  size?: KpiSize | KpiSizeAlias;
  surface?: "flush" | "raised";
  /** @deprecated Pass `surface="flush"` instead. Kept for existing call sites. */
  bare?: boolean;
  /**
   * Phones show two metrics per row (owner, 2026-09-21); pass 1 only when a
   * metric genuinely cannot be read at half width.
   */
  mobileColumns?: 1 | 2;
}) {
  const s = resolveSize(size);
  const resolvedSurface = bare ? "flush" : surface;

  const grid = (
    <div
      className={cn(
        // The column count follows metrics.length at EVERY size. `large` used to
        // hardcode xl:grid-cols-4 regardless, so a 5-metric row wrapped its last
        // metric onto a second line and rendered an empty cell — which, because
        // the grid paints `gap-px bg-border` behind `bg-card` items, showed up as
        // a large grey rectangle rather than as blank space.
        "grid gap-px bg-border",
        mobileColumns === 2 && metrics.length >= 2
          ? "grid-cols-2"
          : "grid-cols-1",
        // Only go two-up once there are at least two metrics. `sm:grid-cols-2`
        // applied unconditionally, so a single-metric row rendered an empty
        // second cell — and because the grid paints `gap-px bg-border` behind
        // `bg-card` items, that empty cell showed up as a grey rectangle rather
        // than as blank space.
        metrics.length >= 2 && "sm:grid-cols-2",
        metrics.length === 8 && "lg:grid-cols-4",
        metrics.length === 7 && "lg:grid-cols-4",
        metrics.length === 6 && "lg:grid-cols-3 xl:grid-cols-3",
        metrics.length === 5 && "xl:grid-cols-5",
        metrics.length === 4 && "xl:grid-cols-4",
        metrics.length === 3 && "xl:grid-cols-3",
      )}
    >
      {metrics.map((metric, i) => (
        <div key={i} className={cn("min-w-0 bg-card", ITEM_PADDING[s])}>
          <KpiBlock {...metric} size={metric.size ?? s} />
        </div>
      ))}
    </div>
  );

  if (resolvedSurface === "flush") return grid;

  return (
    /* The raised shell is a real bounded surface, not a decorative wrapper: it
       is what separates a standalone KPI row from the page behind it, and the
       hairline is what the 1px grid gap reads against. `flush` is the variant
       for callers that do not want it. The surface is ChartCard's, so a KPI
       row and a chart card on the same dashboard carry one identical lift
       (owner decision 2026-09-17). */
    <div className={cn("overflow-hidden", chartCardSurfaceClassName)}>
      {grid}
    </div>
  );
}
