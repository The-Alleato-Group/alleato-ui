const SPREADSHEET_FORMULA_START = /^[=+\-@\t\r]/;
// A plain decimal number such as -81492.31 or -1.5e-7. Spreadsheets read it as
// a number, never as a formula, so it needs no text marker.
const PLAIN_NUMBER = /^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;

/**
 * Excel and similar tools evaluate a cell that starts with =, +, -, @, tab, or
 * carriage return even when the CSV field is quoted. A leading apostrophe is
 * the text marker those tools hide, so the exported meeting material stays text.
 * Negative numbers are left alone: an apostrophe would turn them into text and
 * drop them from SUM.
 */
export function neutralizeSpreadsheetFormula(value: string): string {
  if (PLAIN_NUMBER.test(value)) return value;
  return SPREADSHEET_FORMULA_START.test(value) ? `'${value}` : value;
}

export function escapeUnifiedTableCsvCell(value: string): string {
  return `"${neutralizeSpreadsheetFormula(value).replace(/"/g, '""')}"`;
}
