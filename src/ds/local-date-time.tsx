"use client";

import * as React from "react";
import { format, isThisWeek, isToday, isYesterday } from "date-fns";

import { useHasHydrated } from "../hooks/use-has-hydrated";
import { parseDisplayDate } from "../lib/date-utils";

/**
 * The one owner of viewer-local date/time text.
 *
 * WHY THIS EXISTS (2026-09-22, /meetings/<id>, React #418 x3): a client
 * component formatted `meeting.date` with date-fns `format(..., "h:mm a")`
 * during server rendering. Vercel runs in UTC, the viewer was in New York, so
 * the server wrote "11:30 AM" and the client computed "7:30 AM" for the same
 * text node. React logged a hydration mismatch and re-rendered the subtree,
 * and `npm run verify:browser` refused the page as completion evidence.
 *
 * The contract: the server (and the hydration pass) render a `<time>` with the
 * ISO value in `dateTime` and NO text; the first post-hydration render fills
 * in the viewer-local label. Attributes are identical on both sides, so there
 * is nothing to mismatch. Client-only renders (navigation, re-renders) skip
 * the gate and show the label immediately.
 *
 * Never format a time of day inline in a "use client" component --
 * `design-system/require-local-date-time` fails the commit. Pass the value and
 * the date-fns pattern here, or use one of the named formatters below for the
 * relative "today / yesterday / weekday" list styles.
 */

export type LocalDateTimeFormatter = (date: Date) => string;

export function parseLocalDateTime(
  value: string | Date | number | null | undefined,
): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed =
    typeof value === "number" ? new Date(value) : parseDisplayDate(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Team chat conversation list: clock time today, "Yesterday", else `M/d`.
 */
export function formatConversationTime(date: Date): string {
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "M/d");
}

/**
 * Email inbox list: clock time today, "Yesterday", weekday this week, else
 * `MMM d`.
 */
export function formatInboxListTime(date: Date): string {
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  if (isThisWeek(date)) return format(date, "EEE");
  return format(date, "MMM d");
}

/** Anything a timestamp arrives as. */
export type LocalDateTimeValue = string | Date | number | null | undefined;

/** A calendar-only value is a day, so its machine-readable attribute has no zone. */
function dateTimeAttribute(value: LocalDateTimeValue, date: Date | null): string | undefined {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return date?.toISOString();
}

interface LocalDateTimeBaseProps {
  value: LocalDateTimeValue;
  /**
   * Copy for a missing or unparseable value. Defaults to rendering nothing
   * (DESIGN.md: an empty value renders nothing, never a placeholder).
   */
  emptyLabel?: string;
  className?: string;
  render?: never;
}

interface LocalDateTimePatternProps extends LocalDateTimeBaseProps {
  /** A date-fns pattern, e.g. `"MMM d, h:mm a"`. */
  format: string;
  formatter?: never;
}

interface LocalDateTimeFormatterProps extends LocalDateTimeBaseProps {
  format?: never;
  /** A named formatter from this module, or a pure `(date) => string`. */
  formatter: LocalDateTimeFormatter;
}

/**
 * For a page that already owns a formatter taking the RAW value -- a local
 * `formatDateTime(value: string | null)`, a relative "3h ago" helper -- so its
 * output stays exactly as it was: `<LocalDateTime value={row.created_at}
 * render={formatDateTime} />`. A missing value (null, undefined, "") is passed
 * straight through on the server, because the helper's "Never" / "—" copy does
 * not depend on the zone; any real value waits for hydration like the other
 * forms. Client components only: a function cannot cross from a server
 * component, so a server page uses `format` instead.
 */
interface LocalDateTimeRenderProps<V extends LocalDateTimeValue> {
  value: V;
  render: (value: V) => React.ReactNode;
  className?: string;
  format?: never;
  formatter?: never;
  emptyLabel?: never;
}

export type LocalDateTimeProps<
  V extends LocalDateTimeValue = LocalDateTimeValue,
> =
  | LocalDateTimePatternProps
  | LocalDateTimeFormatterProps
  | LocalDateTimeRenderProps<V>;

function isRenderProps<V extends LocalDateTimeValue>(
  props: LocalDateTimeProps<V>,
): props is LocalDateTimeRenderProps<V> {
  return typeof props.render === "function";
}

export function LocalDateTime<V extends LocalDateTimeValue>(
  props: LocalDateTimeProps<V>,
): React.ReactElement | null {
  const hasHydrated = useHasHydrated();

  if (isRenderProps(props)) {
    const { value, render, className } = props;
    if (value === null || value === undefined || value === "") {
      return <>{render(value)}</>;
    }
    const date = parseLocalDateTime(value);
    const label = hasHydrated ? render(value) : null;
    return (
      <time
        dateTime={dateTimeAttribute(value, date)}
        className={className}
        aria-hidden={label === null ? true : undefined}
      >
        {label}
      </time>
    );
  }

  const {
    value,
    format: pattern,
    formatter,
    emptyLabel = "",
    className,
  } = props;
  const date = parseLocalDateTime(value);

  if (!date) {
    return emptyLabel ? <span className={className}>{emptyLabel}</span> : null;
  }

  const label = hasHydrated
    ? formatter
      ? formatter(date)
      : format(date, pattern)
    : null;

  return (
    <time
      dateTime={dateTimeAttribute(value, date)}
      className={className}
      // Screen readers get nothing useful from an empty <time>; the label
      // arrives on the next render.
      aria-hidden={label === null ? true : undefined}
    >
      {label}
    </time>
  );
}
