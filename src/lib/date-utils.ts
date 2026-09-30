const ISO_DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Parse calendar-only values as local days, preserving their displayed date. */
export function parseDisplayDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  return new Date(ISO_DATE_ONLY_PATTERN.test(value) ? `${value}T00:00:00` : value);
}
