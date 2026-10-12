/**
 * Column order after a visibility change.
 *
 * Before the user (or a saved view) sets an order, the order tracks the
 * visible columns. After that, hidden ids that are already in the order stay
 * there so a saved view can put them back in the same place when they are
 * shown again.
 */
export function nextColumnOrderAfterVisibilityChange(input: {
  previousOrder: readonly string[];
  visibleColumns: readonly string[];
  knownColumnIds: readonly string[];
  userManaged: boolean;
}): string[] {
  if (!input.userManaged) {
    return [...input.visibleColumns];
  }

  const known = new Set(input.knownColumnIds);
  const preserved = input.previousOrder.filter((id) => known.has(id));
  const preservedSet = new Set(preserved);
  const additions = input.visibleColumns.filter((id) => !preservedSet.has(id));
  return [...preserved, ...additions];
}
