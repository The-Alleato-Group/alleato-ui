"use client";

import * as React from "react";

/**
 * Marks the subtree as living inside a workspace shell that already owns the
 * horizontal gutter between the nav rail and the page.
 *
 * Without this, every page nested in a workspace shell pays for the gutter
 * twice: once from the shell's own grid gap, and again from the `PageContainer`
 * that `PageShell` renders (`px-4 sm:px-6 lg:px-8`). That stacked 64-104px was
 * the "way too much space between the content and the left navigation" reported
 * on 2026-08-24. The earlier fix threaded `containerPaddingClassName="px-0"`
 * through each page one at a time, which is a callsite patch for a shared
 * primitive defect and silently breaks again on the next page somebody adds.
 *
 * `PageContainer` reads this and drops its own horizontal padding, so the shell
 * is the single owner of the gutter and no page has to know about it.
 */
const WorkspaceGutterContext = React.createContext(false);

export function WorkspaceGutterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceGutterContext.Provider value={true}>
      {children}
    </WorkspaceGutterContext.Provider>
  );
}

/** True when an ancestor workspace shell already supplies the page gutter. */
export function useWorkspaceOwnsGutter(): boolean {
  return React.useContext(WorkspaceGutterContext);
}
