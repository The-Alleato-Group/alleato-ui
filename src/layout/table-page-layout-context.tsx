"use client";

import * as React from "react";

/**
 * Declares that a PageShell table owns the page gutter and vertical rhythm.
 *
 * UnifiedTablePage can also stand on its own, where it owns a PageContainer.
 * When the two were nested, both added the standard inset and bottom rhythm,
 * producing the inconsistent extra padding reported across table routes. This
 * context gives that ownership to the outer shell once, rather than asking each
 * table route to remember a local `containerPadding: false` exception.
 */
const TablePageLayoutContext = React.createContext(false);

export function TablePageLayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TablePageLayoutContext.Provider value={true}>
      {children}
    </TablePageLayoutContext.Provider>
  );
}

/** True when an ancestor PageShell already owns a table page's outer layout. */
export function useTablePageShellOwnsLayout(): boolean {
  return React.useContext(TablePageLayoutContext);
}
