/**
 * Value and date formatting for `TrendMetricCard`.
 *
 * Split out so the card and its lazily-loaded chart can share it without the
 * card importing the chart — the chart is what carries `recharts`, and a value
 * edge back into it would put the library in the card's first load again.
 */
import {
  formatCompactCurrency,
  formatWholeCurrency,
  formatNumber,
  formatPercent,
} from "../lib/format";

import type { TrendValueFormat } from "./trend-metric-card";
import { parseDisplayDate } from "../lib/date-utils";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_ONLY = /^\d{4}-\d{2}$/;

const dateParts = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/**
 * A date-only string is rendered in UTC, everything else in local time.
 *
 * `new Date("2025-04-05")` parses as UTC midnight, but Intl formats in the
 * viewer's zone -- so west of Greenwich that renders as "04 Apr". A calendar
 * day carries no time of day, so there is nothing to convert: read it back in
 * the same zone it was written in. A full timestamp genuinely has an instant,
 * and is left to localize normally.
 */
const dateOnlyParts = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const monthOnlyParts = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "05 Apr, 2025" for a day, "Jul 2026" for a posting period. */
/**
 * Exact value, for the tooltip -- the one place a reader has asked for detail.
 */
export function formatExact(value: number, format: TrendValueFormat, unit?: string) {
  if (format === "currency") return formatWholeCurrency(value);
  if (format === "percent") return formatPercent(value);
  const noun = unit ? (value === 1 ? unit.replace(/s$/, "") : unit) : null;
  return noun ? `${formatNumber(value)} ${noun}` : formatNumber(value);
}

/**
 * Short value, for the footer -- three of these share one row, so a full
 * "$3,933,851" crowds out the labels that say what the numbers are.
 */
export function formatShort(value: number, format: TrendValueFormat) {
  if (format === "currency") return formatCompactCurrency(value);
  if (format === "percent") return formatPercent(value);
  return formatNumber(value);
}

export function formatChange(value: number, format: TrendValueFormat) {
  return format === "percent"
    ? `${value.toFixed(1)} pts`
    : formatShort(value, format);
}

export function formatPointDate(iso: string): string {
  const parsed = DATE_ONLY.test(iso)
    ? new Date(`${iso}T00:00:00Z`)
    : MONTH_ONLY.test(iso)
      ? new Date(`${iso}-01T00:00:00Z`)
      : parseDisplayDate(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  // An accounting period is a month, not a day. Naming a day inside it would
  // invent precision the number does not have.
  if (MONTH_ONLY.test(iso)) {
    const parts = monthOnlyParts.formatToParts(parsed);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? "";
    return `${get("month")} ${get("year")}`;
  }
  const formatter = DATE_ONLY.test(iso) ? dateOnlyParts : dateParts;
  const parts = formatter.formatToParts(parsed);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("day")} ${get("month")}, ${get("year")}`;
}
