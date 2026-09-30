import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

/**
 * Format a number as currency (USD).
 *
 * An absent value formats to "" — never a dash. A rendered dash is a placeholder
 * glyph (DESIGN.md), and `formatWholeCurrency` / `formatPercent`
 * below already return "" for the same input. A computed zero still formats
 * to "$0.00": it proves the calculation ran (DESIGN.md).
 */
export function formatCurrency(
  value: number | string | null | undefined,
): string {
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";
  // By default Intl prints -0, and any negative that rounds to zero cents, as
  // "-$0.00" (credit memo "Less Retainage -$0.00", 2026-09-28 walkthrough).
  // signDisplay "negative" drops the sign only when the rounded value is zero,
  // using Intl's own rounding (so -0.005 still prints "-$0.01").
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    signDisplay: "negative",
  }).format(num);
}

/**
 * Exact money, no cents.
 *
 * `formatCurrency` renders cents, which is right for an invoice line and wrong
 * for a seven-figure total: "$3,933,851.00" spends three characters telling the
 * reader about a precision that revenue at this scale does not have. Use this
 * wherever a whole figure is the honest unit.
 */
export function formatWholeCurrency(
  value: number | string | null | undefined,
): string {
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    signDisplay: "negative",
  }).format(num);
}

/**
 * Money at a glance: compact above a million, exact below it.
 *
 * A headline "$17,160,726" truncates to "$17,160..." in a six-across stat row
 * or a chart footer, which is a number the reader cannot actually read.
 * Millions get compact notation and the exact figure stays one hover away.
 * Below a million the full figure fits, and "$0.8M" would throw away precision
 * for nothing.
 */
export function formatCompactCurrency(
  value: number | string | null | undefined,
): string {
  // Empty renders nothing, per the convention note below -- formatCurrency's
  // "-" is a 680-call-site holdout, not the rule, and a new helper does not
  // inherit that debt.
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";
  if (Math.abs(num) < 1_000_000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    // `minimumFractionDigits` is NOT optional here. Under compact notation ICU
    // derives the minimum from the maximum, and it does so differently across
    // ICU versions: ICU 78 resolves min=2 from max=2 ($6.60M) where other
    // versions resolve min=0 ($6.6M). These helpers run in "use client"
    // components, so SSR (the runner's Node ICU) and the browser can disagree
    // on the same number -- that is a hydration mismatch, and it is what
    // `deals-client.tsx` worked around by dropping compact notation entirely.
    // Pin the minimum so the runtime cannot choose. See the stability test in
    // `__tests__/compact-currency-icu-stability.test.ts`.
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format a date value with a named style or a custom date-fns format string.
 *
 * Named styles:
 *   "short"   → "Apr 20, 2026"    (default)
 *   "long"    → "April 20, 2026"
 *   "numeric" → "04/20/2026"
 *   "relative"→ "2 days ago"
 *
 * Custom format string (date-fns tokens):
 *   e.g. "MMM d" → "Apr 20"
 *
 * Returns "--" for null/undefined/invalid dates.
 *
 * @example
 * formatDate(record.start_date)              // "Apr 20, 2026"
 * formatDate(record.start_date, "long")      // "April 20, 2026"
 * formatDate(record.start_date, "numeric")   // "04/20/2026"
 * formatDate(record.start_date, "relative")  // "2 days ago"
 * formatDate(record.start_date, "MMM d")     // "Apr 20"
 */
export function formatDate(
  value: string | Date | null | undefined,
  styleOrFormat:
    | "short"
    | "long"
    | "numeric"
    | "relative"
    | (string & Record<never, never>) = "short",
): string {
  if (!value) return "--";
  // ISO date-only strings (YYYY-MM-DD) must be parsed as local midnight, not UTC.
  // new Date("YYYY-MM-DD") and parseISO in date-fns v4 both treat them as UTC,
  // which shifts the displayed date by -1 day in US timezones.
  const date =
    typeof value === "string"
      ? /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(value + "T00:00:00")
        : parseISO(value)
      : value;
  if (!isValid(date)) {
    const fallback = typeof value === "string" ? new Date(value) : value;
    if (!isValid(fallback)) return "--";
    return _applyStyle(fallback, styleOrFormat);
  }
  return _applyStyle(date, styleOrFormat);
}

function _applyStyle(date: Date, styleOrFormat: string): string {
  try {
    switch (styleOrFormat) {
      case "short":
        return format(date, "MMM d, yyyy");
      case "long":
        return format(date, "MMMM d, yyyy");
      case "numeric":
        return format(date, "MM/dd/yyyy");
      case "relative":
        return formatDistanceToNow(date, { addSuffix: true });
      default:
        return format(date, styleOrFormat);
    }
  } catch {
    return "--";
  }
}

/**
 * Format a number with optional decimal places
 */
export function formatNumber(
  value: number | string | null | undefined,
  decimals: number = 0,
): string {
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format a number as percentage
 */
export function formatPercent(
  value: number | string | null | undefined,
  decimals: number = 1,
): string {
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";
  return `${num.toFixed(decimals)}%`;
}

/**
 * Formats North American phone numbers for display without changing numbers
 * that cannot be recognized safely (for example, international numbers).
 */
export function formatPhoneNumber(value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (
    !trimmed ||
    trimmed === "{}" ||
    trimmed === "[]" ||
    trimmed.toLowerCase() === "null" ||
    trimmed.toLowerCase() === "undefined"
  ) {
    return "";
  }

  const extensionMatch = trimmed.match(/(?:ext\.?|x)\s*(\d+)\s*$/i);
  const withoutExtension = extensionMatch
    ? trimmed.slice(0, extensionMatch.index).trim()
    : trimmed;
  const digits = withoutExtension.replace(/\D/g, "");
  const normalizedDigits =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;

  if (normalizedDigits.length !== 10) return trimmed;

  const formatted = `(${normalizedDigits.slice(0, 3)}) ${normalizedDigits.slice(3, 6)}-${normalizedDigits.slice(6)}`;
  return extensionMatch ? `${formatted} x${extensionMatch[1]}` : formatted;
}

/**
 * Normalizes a phone value at persistence boundaries.
 *
 * North American numbers use the same canonical representation users see in
 * the interface. Values that cannot be identified safely are trimmed and
 * preserved so international and incomplete numbers are never corrupted.
 */
export function normalizePhoneNumber(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  return formatPhoneNumber(trimmed) || null;
}

/**
 * NOTE: an empty value returns "" from these helpers, not a dash -- rendering
 * nothing is the product rule (DESIGN.md), and a helper that returns "-"
 * defeats it everywhere it is used, invisibly to the no-empty-value-dash lint
 * rule (which can only see literals in JSX).
 *
 * formatCurrency is the deliberate holdout: 680 call sites, so changing what a
 * missing money value looks like across the whole app is its own change with
 * its own visual proof, not a rider on this one.
 */

/**
 * Format an array as comma-separated string
 */
export function formatArray(value: string[] | null | undefined): string {
  if (!value || !Array.isArray(value) || value.length === 0) return "";
  return value.join(", ");
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(
  value: string | null | undefined,
  maxLength: number = 50,
): string {
  if (!value) return "";
  if (value.length <= maxLength) return value;
  return `${value.substring(0, maxLength)}...`;
}
