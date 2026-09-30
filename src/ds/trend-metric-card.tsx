"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  LineChart,
  Table2,
} from "lucide-react";

import { Separator } from "../components/separator";
import { Skeleton } from "../components/skeleton";
import { ToggleGroup, ToggleGroupItem } from "../components/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/select";
import { chartCardSurfaceClassName } from "./chart-card";
import {
  TREND_ACCENTS,
  TREND_SERIES_COLORS,
  TREND_SERIES_ORDER,
  type TrendAccent,
  type TrendSeriesColor,
} from "./trend-metric-accent";
import {
  formatChange,
  formatExact,
  formatPointDate,
  formatShort,
} from "./trend-metric-format";
import { HEADER_BAND } from "./trend-metric-layout";
import type { TrendChartSeries } from "./trend-metric-chart";
import { formatPercent } from "../lib/format";
import { cn } from "../lib/utils";

export type { TrendAccent, TrendSeriesColor };

/* =============================================================================
   TREND METRIC CARD
   =============================================================================
   One headline number with its own trend, and a switch between reading that
   trend as a shape (line) or as discrete periods (bars).

   The two views answer different questions, which is the whole reason both
   exist: the line answers "which way is this going", the bars answer "how did
   this day compare to that one". Offering both is not decoration -- it is the
   cheapest way to serve both readers without shipping two cards.

   The plot owns the right three-fifths of the card and bleeds to its edges; the
   headline owns the left. A wash of the accent colour fades in from the right
   so the number and the shape read as one object, not a figure beside a chart.

   The accent is a VERDICT, not a direction. Which colour the card wears is
   decided from the data and `goodWhenUp`: a rising payables balance is red, a
   rising cash balance is green, a flat one is grey. Every coloured element --
   stroke, wash, header percentage, footer delta -- reads from that one verdict.

   Peak / low / avg in the footer are DERIVED from `data`, never passed in. A
   footer that can disagree with the chart above it is worse than no footer.
   ========================================================================== */

export type TrendPoint = {
  /** ISO date (YYYY-MM-DD), a YYYY-MM posting period, or any Date-parseable string. */
  date: string;
  value: number;
};

/** A named series. The first one on a card is the primary: it drives the numbers. */
export type TrendSeries = {
  name: string;
  data: TrendPoint[];
  /** Fixed palette slot. Unset series take the next free one in order. */
  color?: TrendSeriesColor;
};

export type TrendMetricView = "line" | "bar" | "table";

export type TrendRangeOption = {
  label: string;
  value: string;
  /**
   * Trailing points this range keeps. When set and the card is uncontrolled
   * (`range` omitted) the card slices the series itself, so a page can offer
   * "last 6 months" over a 12-month series without a second fetch. Omit on the
   * widest option.
   */
  points?: number;
};

/**
 * How a point value reads. "number" counts things and can carry a `unit` noun;
 * "currency" is money and never does -- "$2.1M orders" is not a sentence.
 */
export type TrendValueFormat = "number" | "currency" | "percent";

export interface TrendMetricCardProps {
  /** Short noun phrase, e.g. "Total orders". */
  label: string;
  /** Preformatted headline value, e.g. "3.15K". */
  value: string;
  /** The series, ordered oldest -> newest. Ignored when `series` is given. */
  data?: TrendPoint[];
  /** Several named series on one plot; the first is primary. Takes precedence over `data`. */
  series?: TrendSeries[];
  /** Noun for the tooltip, e.g. "orders". Singularized at 1. `number` only. */
  unit?: string;
  /** Counts or money. Defaults to counts. */
  format?: TrendValueFormat;
  /**
   * What the footer's period-over-period change is measured against, e.g.
   * "today" (default) for a daily series, "vs prior month" for a monthly one.
   * A monthly series labelled "today" is simply wrong.
   *
   * `null` hides that read-out entirely. Use it when the card already carries a
   * `delta` over a different span -- a green "+20.3% vs the prior quarter"
   * beside a red "-$2.56M vs prior month" is two true numbers arranged to look
   * like a contradiction.
   */
  changeLabel?: string | null;
  /**
   * Header percentage, when the caller measures it over a span the card cannot
   * see. Omit to let the card show the change across the visible range.
   */
  delta?: { value: number; direction: "up" | "down" };
  /** Whether a rising value is favorable. Defaults to true. */
  goodWhenUp?: boolean;
  /** Force the verdict colour. Only for a series whose direction has no valence. */
  accent?: TrendAccent;
  /** Range picker options. Omitting this omits the picker. */
  ranges?: readonly TrendRangeOption[];
  /** Controlled range. Leave unset and the card slices by `points` itself. */
  range?: string;
  onRangeChange?: (range: string) => void;
  /** Controlled view. Leave unset to let the card own its toggle. */
  view?: TrendMetricView;
  defaultView?: TrendMetricView;
  onViewChange?: (view: TrendMetricView) => void;
  /** Ordered display modes exposed by the toggle. */
  views?: TrendMetricView[];
  /** Keeps the KPI subordinate when the chart and raw values are the focus. */
  valueSize?: "default" | "compact";
  /**
   * Which datum the tooltip rests on when nobody is hovering.
   * "peak" (default) anchors the eye to the high point.
   * "latest" suits an operational card where recency beats magnitude.
   * "none" leaves the chart silent until hovered.
   */
  restingPoint?: "peak" | "latest" | "none";
  /** Peak / low / avg in the footer. On by default. */
  showStats?: boolean;
  /** Skeleton in the card's own shape while the series loads. */
  loading?: boolean;
  /**
   * Why there is no series. Shown in place of the chart so a failed read never
   * masquerades as an empty ledger.
   */
  error?: string | null;
  className?: string;
}

/**
 * Deferred because it is the only part of this card that needs `recharts`.
 * The card's own markup — title, value, delta, toggle, table view — is
 * unaffected and still server-renders; the chart renders nothing until its box
 * is measured, so there is nothing to lose by loading it on the client. The
 * placeholder fills the same box the chart will.
 */
const TrendChart = dynamic(
  () => import("./trend-metric-chart").then((m) => m.TrendChart),
  { ssr: false, loading: () => <div className="h-full w-full" /> },
);

const DEFAULT_VIEWS: TrendMetricView[] = ["line", "bar"];

/** Below this much movement across the range the trend is "flat" -- no verdict. */
const FLAT_THRESHOLD_PCT = 0.5;

const VIEW_LABELS: Record<TrendMetricView, string> = {
  line: "Line chart",
  bar: "Bar chart",
  table: "Raw data table",
};

const VIEW_ICONS: Record<TrendMetricView, React.ComponentType<{ className?: string }>> = {
  line: LineChart,
  bar: BarChart3,
  table: Table2,
};

const sliceWindow = (points: TrendPoint[], keep?: number) =>
  keep && keep < points.length ? points.slice(-keep) : points;

function TrendDataTable({
  series,
  unit,
  format,
}: {
  series: TrendChartSeries[];
  unit?: string;
  format: TrendValueFormat;
}) {
  const primary = series[0];
  const isMulti = series.length > 1;
  const byDate = series.map(
    (entry) => new Map(entry.data.map((point) => [point.date, point.value])),
  );
  return (
    <div
      className="h-full overflow-auto px-4 pb-4 @2xl:px-6"
      style={{ paddingTop: HEADER_BAND }}
    >
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-medium">
              Period
            </th>
            {isMulti ? (
              series.map((entry) => (
                <th
                  key={entry.name}
                  scope="col"
                  className="py-2 pl-3 text-right font-medium"
                >
                  {entry.name}
                </th>
              ))
            ) : (
              <th scope="col" className="py-2 text-right font-medium">
                Value
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {[...primary.data].reverse().map((point) => (
            <tr
              key={point.date}
              className="border-b border-border/70 last:border-0"
            >
              <td className="py-2 pr-3 text-muted-foreground">
                {formatPointDate(point.date)}
              </td>
              {series.map((entry, index) => {
                const value = byDate[index].get(point.date);
                return (
                  <td
                    key={entry.name}
                    className="py-2 pl-3 text-right font-medium tabular-nums text-foreground"
                  >
                    {value === undefined ? null : formatExact(value, format, unit)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TrendMetricSkeleton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "@container relative flex min-h-112 min-w-0 flex-col overflow-hidden",
        chartCardSurfaceClassName,
        className,
      )}
      aria-busy="true"
      aria-label={`${label}, loading`}
    >
      <div className="flex flex-1 flex-col px-6 pt-6 @2xl:px-8 @2xl:pt-7">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="mt-8 h-14 w-48 rounded-lg" />
        <Skeleton className="mt-auto h-24 w-full rounded-lg opacity-50" />
      </div>
      <Separator />
      <div className="px-6 py-4 @2xl:px-8">
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  );
}

export function TrendMetricCard({
  label,
  value,
  data,
  series,
  unit,
  format = "number",
  changeLabel = "today",
  delta,
  goodWhenUp = true,
  accent,
  ranges,
  range,
  onRangeChange,
  view,
  defaultView = "line",
  onViewChange,
  views = DEFAULT_VIEWS,
  valueSize = "default",
  restingPoint = "peak",
  showStats = true,
  loading = false,
  error = null,
  className,
}: TrendMetricCardProps) {
  const gradientId = React.useId().replace(/:/g, "");
  const [internalView, setInternalView] =
    React.useState<TrendMetricView>(defaultView);
  const activeView = view ?? internalView;

  // Uncontrolled ranges start on the last option -- callers list them
  // narrowest to widest, and the widest window is the honest default.
  const [internalRange, setInternalRange] = React.useState<string | undefined>(
    () => ranges?.[ranges.length - 1]?.value,
  );
  const activeRange = range ?? internalRange;
  const activeRangeOption = ranges?.find((option) => option.value === activeRange);

  const handleViewChange = (next: string) => {
    // Radix emits "" when the pressed item is pressed again. A metric card is
    // always showing one of its views, so a deselect is not a valid state.
    if (next !== "line" && next !== "bar" && next !== "table") return;
    if (view === undefined) setInternalView(next);
    onViewChange?.(next);
  };

  const handleRangeChange = (next: string) => {
    if (range === undefined) setInternalRange(next);
    onRangeChange?.(next);
  };

  // Normalise to a list of series, then cut each to the chosen window. Slicing
  // only applies when the card owns the range; a controlled caller has already
  // fetched the window it wants.
  const visibleSeries = React.useMemo<TrendChartSeries[]>(() => {
    const base: TrendSeries[] = series?.length
      ? series
      : [{ name: label, data: data ?? [] }];
    const keep = range === undefined ? activeRangeOption?.points : undefined;
    let nextFree = 0;
    return base.map((entry) => ({
      name: entry.name,
      data: sliceWindow(entry.data, keep),
      color: entry.color
        ? TREND_SERIES_COLORS[entry.color]
        : TREND_SERIES_COLORS[
            TREND_SERIES_ORDER[nextFree++ % TREND_SERIES_ORDER.length]
          ],
    }));
  }, [series, data, label, range, activeRangeOption]);

  const primary = visibleSeries[0];
  const isMulti = visibleSeries.length > 1;

  // Every number on the card derives from the primary series so the card
  // stays coherent and follows the range picker. Props remain the override.
  const stats = React.useMemo(() => {
    const points = primary.data;
    if (points.length === 0) return null;
    let peakIndex = 0;
    let low = points[0].value;
    let total = 0;
    points.forEach((point, index) => {
      if (point.value > points[peakIndex].value) peakIndex = index;
      if (point.value < low) low = point.value;
      total += point.value;
    });
    const first = points[0];
    const latest = points[points.length - 1];
    const previous = points.length > 1 ? points[points.length - 2] : null;
    const net = latest.value - first.value;
    return {
      peakIndex,
      peak: points[peakIndex].value,
      low,
      average:
        format === "percent"
          ? Math.round((total / points.length) * 10) / 10
          : Math.round(total / points.length),
      change: previous ? latest.value - previous.value : null,
      net,
      pct: first.value !== 0 ? (net / Math.abs(first.value)) * 100 : 0,
    };
  }, [primary, format]);

  if (loading) {
    return <TrendMetricSkeleton label={label} className={className} />;
  }

  if (error || stats === null) {
    return (
      <div
        className={cn(
          "@container flex min-h-112 min-w-0 flex-col p-6",
          chartCardSurfaceClassName,
          className,
        )}
      >
        <p className="text-base font-semibold text-foreground">{label}</p>
        <p
          className={cn(
            "mt-2 text-sm",
            error ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {error ?? "No data for this range yet."}
        </p>
      </div>
    );
  }

  // The verdict. Direction comes from the caller's `delta` when they measured
  // one, else from first -> last of the visible window; below the flat
  // threshold there is no direction and therefore no colour.
  const trend: "up" | "down" | "flat" = delta
    ? delta.direction
    : stats.change === null || Math.abs(stats.pct) < FLAT_THRESHOLD_PCT
      ? "flat"
      : stats.net >= 0
        ? "up"
        : "down";
  const favorable = trend === "flat" ? null : (trend === "up") === goodWhenUp;
  const resolvedAccent: TrendAccent =
    accent ?? (favorable === null ? "neutral" : favorable ? "success" : "destructive");
  const accentTokens = TREND_ACCENTS[resolvedAccent];
  const TrendIcon =
    trend === "flat" ? ArrowRight : trend === "down" ? ArrowDown : ArrowUp;

  // A single series wears the verdict colour; several keep their own so the
  // legend can tell them apart.
  const chartSeries: TrendChartSeries[] = isMulti
    ? visibleSeries
    : [{ ...primary, color: accentTokens.stroke }];

  const headerChange =
    delta
      ? formatPercent(delta.value)
      : stats.change === null
        ? null
        : format === "percent"
          ? `${stats.net >= 0 ? "+" : ""}${formatChange(stats.net, "percent")}`
          : formatPercent(Math.abs(stats.pct));

  const restingIndex =
    restingPoint === "none"
      ? undefined
      : restingPoint === "latest"
        ? primary.data.length - 1
        : stats.peakIndex;

  const footerChangeClassName =
    stats.change === null || stats.change === 0
      ? "text-muted-foreground"
      : stats.change > 0 === goodWhenUp
        ? "text-success"
        : "text-destructive";

  return (
    <div
      className={cn(
        "@container relative flex min-h-112 min-w-0 flex-col overflow-hidden",
        valueSize === "compact" && "min-h-96",
        chartCardSurfaceClassName,
        className,
      )}
    >
      <div className="relative flex-1">
        {/* Plot region -- the right three-fifths at card widths, everything
            below it on a phone. Sits under the content layer. */}
        <div className="absolute inset-y-0 right-0 z-0 w-full @lg:w-3/5">
          {activeView !== "table" ? (
            <>
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to left, ${accentTokens.wash}, transparent 75%)`,
                }}
              />
              <div
                aria-hidden
                className="viz-dot-grid absolute inset-0 opacity-50"
                style={{
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent, black 55%)",
                  maskImage: "linear-gradient(to right, transparent, black 55%)",
                }}
              />
              <TrendChart
                view={activeView}
                series={chartSeries}
                unit={unit}
                format={format}
                gradientId={gradientId}
                peakIndex={stats.peakIndex}
                restingIndex={restingIndex}
              />
            </>
          ) : (
            <TrendDataTable series={chartSeries} unit={unit} format={format} />
          )}
        </div>

        {/* Content layer -- above the plot, but only where it has ink. */}
        <div className="pointer-events-none relative z-10 flex h-full flex-col px-6 pt-6 pb-10 @2xl:px-8 @2xl:pt-7 @4xl:px-10">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="pointer-events-auto flex items-center gap-3">
              <span className="text-base font-semibold tracking-tight text-foreground @3xl:text-lg">
                {label}
              </span>
              <ToggleGroup
                type="single"
                value={activeView}
                onValueChange={handleViewChange}
                variant="outline"
                aria-label={`${label} display`}
                className="bg-muted/40"
              >
                {views.map((display) => {
                  const Icon = VIEW_ICONS[display];
                  return (
                    <ToggleGroupItem
                      key={display}
                      value={display}
                      aria-label={VIEW_LABELS[display]}
                    >
                      <Icon className="h-4 w-4" />
                    </ToggleGroupItem>
                  );
                })}
              </ToggleGroup>
            </div>

            <div className="pointer-events-auto flex items-center gap-3 text-sm">
              {headerChange ? (
                <span
                  className={cn(
                    "flex items-center gap-1 font-medium tabular-nums",
                    accentTokens.textClassName,
                  )}
                  title={
                    delta
                      ? undefined
                      : `Change across ${activeRangeOption?.label.toLowerCase() ?? "the visible range"}`
                  }
                >
                  <TrendIcon className="h-4 w-4" strokeWidth={2.5} />
                  {headerChange}
                </span>
              ) : null}

              {ranges && ranges.length > 0 ? (
                <Select value={activeRange} onValueChange={handleRangeChange}>
                  <SelectTrigger
                    className="h-8 w-auto gap-1 border-0 bg-transparent px-1 text-sm text-muted-foreground shadow-none focus:ring-0"
                    aria-label={`${label} date range`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {ranges.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>
          </div>

          {isMulti ? (
            <ul
              aria-label="Series"
              className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1"
            >
              {chartSeries.map((entry) => (
                <li
                  key={entry.name}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <span
                    aria-hidden
                    className="size-2 rounded-full"
                    style={{ background: entry.color }}
                  />
                  {entry.name}
                </li>
              ))}
            </ul>
          ) : null}

          <p
            className={cn(
              "mt-8 font-medium leading-none tracking-tight tabular-nums text-foreground",
              valueSize === "compact"
                ? "text-3xl @2xl:text-4xl @4xl:text-5xl"
                : "text-5xl @2xl:text-6xl @4xl:text-7xl @6xl:text-8xl",
            )}
          >
            {value}
          </p>
        </div>
      </div>

      <Separator />

      {/* Footer -- opaque so the plot ends cleanly; every number here is
          derived from `data`. */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-card px-6 py-4 text-sm @2xl:px-8 @4xl:px-10">
        {changeLabel === null ? (
          <span />
        ) : (
          <p className="text-muted-foreground">
            {stats.change === null ? (
              <span className="tabular-nums">
                {formatShort(primary.data[0].value, format)} {changeLabel}
              </span>
            ) : (
              <>
                <span
                  className={cn("font-semibold tabular-nums", footerChangeClassName)}
                >
                  {stats.change >= 0 ? "+" : ""}
                  {formatChange(stats.change, format)}
                </span>{" "}
                {changeLabel}
              </>
            )}
          </p>
        )}
        {showStats ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground @max-lg:w-full @max-lg:justify-between">
            <span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatShort(stats.peak, format)}
              </span>{" "}
              peak
            </span>
            <span aria-hidden>·</span>
            <span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatShort(stats.low, format)}
              </span>{" "}
              low
            </span>
            <span aria-hidden>·</span>
            <span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatShort(stats.average, format)}
              </span>{" "}
              avg
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
