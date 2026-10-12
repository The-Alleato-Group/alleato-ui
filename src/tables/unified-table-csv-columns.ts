/**
 * Columns the auto-built CSV writes: a column marked `csvOmitWhenEmpty` is left
 * out when its value is blank in every exported row, so an export never carries
 * a column of blanks for a field no row has recorded.
 */
export function selectUnifiedTableCsvColumns<
  T,
  C extends { csvValue?: (item: T) => string; csvOmitWhenEmpty?: boolean },
>(columns: readonly C[], items: readonly T[]): C[] {
  return columns.filter(
    (column) =>
      Boolean(column.csvValue) &&
      (!column.csvOmitWhenEmpty ||
        items.some((item) => (column.csvValue?.(item) ?? "") !== "")),
  );
}
