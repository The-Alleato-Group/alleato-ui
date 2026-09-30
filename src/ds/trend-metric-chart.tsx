/**
 * The plotted trend, and the only module here that imports `recharts`.
 *
 * `trend-metric-card.tsx` loads it through `next/dynamic` with `ssr: false`,
 * which keeps recharts out of the first load of `/executive`, `/accounting`
 * and `/financial-dashboard`. Nothing is lost by deferring it: `useMeasuredSize`
 * below already returns null until the element has a real box, so the chart
 * renders nothing on the server or on the first client frame either way.
 */
"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ReferenceDot,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CHART_HOVER_OVERLAY } from "../components/chart-tokens";
import { HEADER_BAND } from "./trend-metric-layout";
import {
  formatExact,
  formatPointDate,
} from "./trend-metric-format";

import type {
  TrendMetricView,
  TrendPoint,
  TrendValueFormat,
} from "./trend-metric-card";

/**
 * Element size, measured. Returns null until the element has a real box.
 *
 * This exists instead of <ResponsiveContainer> because of a genuine recharts
 * 2.15.4 bug. `<Tooltip defaultIndex>` is read in componentDidMount via
 * `this.state.tooltipTicks.length` (generateCategoricalChart.js:1576) -- that
 * guard validates the index but never the array. `tooltipTicks` is only
 * populated by updateStateOfAxisMapsOffsetAndStackGroups, which returns null
 * outright when the chart has zero width or height (:814). ResponsiveContainer
 * paints its child at width 0 on the first frame, before its ResizeObserver
 * reports, so the two together throw
 * "Cannot read properties of undefined (reading 'length')" on mount.
 *
 * Measuring first and passing explicit width/height means the chart is never
 * mounted at zero size, so the resting tooltip cannot hit that path.
 */
export function useMeasuredSize<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const [size, setSize] = React.useState<{
    width: number;
    height: number;
  } | null>(null);

  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const apply = (width: number, height: number) => {
      if (width <= 0 || height <= 0) return;
      setSize((previous) =>
        previous?.width === width && previous?.height === height
          ? previous
          : { width, height },
      );
    };

    // Measure synchronously first. ResizeObserver's initial callback is not
    // guaranteed to arrive promptly -- a tab that is not compositing (hidden,
    // backgrounded, inside a collapsed accordion or an inactive tab panel) can
    // defer it indefinitely, which would leave the chart permanently blank
    // rather than merely late. Layout is already resolved by the time a layout
    // effect runs, so read it directly and treat the observer as the update
    // channel, not the source of the first value.
    const box = element.getBoundingClientRect();
    apply(box.width, box.height);

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) apply(rect.width, rect.height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}

/** One plotted line or bar group, already coloured by the card. */
export type TrendChartSeries = {
  name: string;
  data: TrendPoint[];
  color: string;
};

/**
 * Recharts wants one row per x value with a key per series. Series keys are
 * positional (`s0`, `s1`, ...) rather than the series name so that a name with
 * a dot or bracket in it cannot be read as a path.
 */
type ChartRow = { date: string } & Record<`s${number}`, number | undefined>;

const seriesKey = (index: number): `s${number}` => `s${index}`;

function toRows(series: TrendChartSeries[]): ChartRow[] {
  const rows = new Map<string, ChartRow>();
  series.forEach((entry, index) => {
    for (const point of entry.data) {
      const row = rows.get(point.date) ?? { date: point.date };
      row[seriesKey(index)] = point.value;
      rows.set(point.date, row);
    }
  });
  // ISO dates and YYYY-MM periods both sort correctly as strings; a caller
  // passing a free-form date already accepted chart order = input order.
  return [...rows.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

type TooltipPayloadEntry = {
  dataKey?: string | number;
  value?: number;
  payload?: ChartRow;
};

function TrendTooltip({
  active,
  payload,
  series,
  unit,
  format = "number",
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  series: TrendChartSeries[];
  unit?: string;
  format?: TrendValueFormat;
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  if (series.length === 1) {
    const value = row[seriesKey(0)];
    if (value === undefined) return null;
    return (
      <div className="pointer-events-none rounded-lg bg-popover px-3 py-2 shadow-sm">
        <p className="text-sm font-semibold tabular-nums text-popover-foreground">
          {formatExact(value, format, unit)}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatPointDate(row.date)}
        </p>
      </div>
    );
  }

  return (
    <div className="pointer-events-none rounded-lg bg-popover px-3 py-2 shadow-sm">
      <p className="text-xs text-muted-foreground">{formatPointDate(row.date)}</p>
      <ul className="mt-1 space-y-0.5">
        {series.map((entry, index) => {
          const value = row[seriesKey(index)];
          if (value === undefined) return null;
          return (
            <li
              key={entry.name}
              className="flex items-center gap-2 text-sm text-popover-foreground"
            >
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ background: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="ml-auto font-semibold tabular-nums">
                {formatExact(value, format, unit)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Both views share the same axes, tooltip and resting point so that switching
 * between them moves nothing except the mark. A reader comparing the two should
 * never have to re-orient.
 */
export function TrendChart({
  view,
  series,
  unit,
  format,
  gradientId,
  peakIndex,
  restingIndex,
}: {
  view: Exclude<TrendMetricView, "table">;
  series: TrendChartSeries[];
  unit?: string;
  format: TrendValueFormat;
  gradientId: string;
  /** Index into the PRIMARY series' data of its high point. */
  peakIndex: number;
  restingIndex?: number;
}) {
  const [ref, size] = useMeasuredSize<HTMLDivElement>();
  const rows = React.useMemo(() => toRows(series), [series]);
  const primary = series[0];
  const isMulti = series.length > 1;

  const sharedTooltip = (
    <Tooltip
      cursor={view === "bar" ? { fill: CHART_HOVER_OVERLAY } : false}
      defaultIndex={restingIndex}
      isAnimationActive={false}
      wrapperStyle={{ outline: "none", zIndex: 10 }}
      content={<TrendTooltip series={series} unit={unit} format={format} />}
    />
  );
  // Headroom so the peak never collides with the top edge or the tooltip.
  // The floor is zero unless the series dips below it -- a balance that goes
  // negative must still be drawn, not clipped at the axis.
  const sharedAxes = (
    <>
      <XAxis dataKey="date" hide />
      <YAxis
        hide
        domain={[(min: number) => Math.min(0, min), "dataMax"]}
      />
    </>
  );
  const peakPoint = primary?.data[peakIndex];

  const chart =
    size === null ? null : view === "line" ? (
      <AreaChart
        data={rows}
        width={size.width}
        height={size.height}
        margin={{ top: HEADER_BAND, right: 0, bottom: 0, left: 0 }}
      >
        <defs>
          {series.map((entry, index) => (
            <linearGradient
              key={entry.name}
              id={`${gradientId}-area-${index}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={entry.color} stopOpacity={isMulti ? 0.18 : 0.35} />
              <stop offset="100%" stopColor={entry.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        {sharedAxes}
        {sharedTooltip}
        {series.map((entry, index) => (
          <Area
            key={entry.name}
            type="monotone"
            dataKey={seriesKey(index)}
            name={entry.name}
            stroke={entry.color}
            strokeWidth={2}
            fill={`url(#${gradientId}-area-${index})`}
            dot={false}
            activeDot={{ r: 4, fill: entry.color, stroke: "none" }}
            isAnimationActive={false}
            connectNulls
          />
        ))}
        {peakPoint ? (
          <ReferenceDot
            x={peakPoint.date}
            y={peakPoint.value}
            r={5}
            fill={primary.color}
            stroke="none"
            isFront
          />
        ) : null}
      </AreaChart>
    ) : (
      <BarChart
        data={rows}
        width={size.width}
        height={size.height}
        margin={{ top: HEADER_BAND, right: 0, bottom: 0, left: 0 }}
        barCategoryGap="18%"
        barGap={2}
      >
        <defs>
          {series.map((entry, index) => (
            <React.Fragment key={entry.name}>
              <linearGradient
                id={`${gradientId}-bar-${index}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
                <stop offset="100%" stopColor={entry.color} stopOpacity={0.45} />
              </linearGradient>
              <linearGradient
                id={`${gradientId}-bar-${index}-peak`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                <stop offset="100%" stopColor={entry.color} stopOpacity={0.65} />
              </linearGradient>
            </React.Fragment>
          ))}
        </defs>
        {sharedAxes}
        {sharedTooltip}
        {series.map((entry, index) => (
          <Bar
            key={entry.name}
            dataKey={seriesKey(index)}
            name={entry.name}
            radius={[6, 6, 0, 0]}
            // A three-point series would otherwise render three slabs a quarter
            // of the chart wide, which reads as a diagram rather than data. At
            // thirty points the bars are already narrower than this and the cap
            // never binds.
            maxBarSize={72}
            isAnimationActive={false}
          >
            {rows.map((row) => (
              <Cell
                key={row.date}
                fill={`url(#${gradientId}-bar-${index}${
                  index === 0 && row.date === peakPoint?.date ? "-peak" : ""
                })`}
              />
            ))}
          </Bar>
        ))}
      </BarChart>
    );

  return (
    <div ref={ref} className="h-full w-full">
      {chart}
    </div>
  );
}
