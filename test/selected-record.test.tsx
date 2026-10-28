import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TooltipProvider } from "../src/components/tooltip";
import { PageTabs } from "../src/layout/page-tabs";
import { TableHostProvider, type TableHost } from "../src/tables/table-host";
import { UnifiedTablePage, type UnifiedTablePageProps } from "../src/tables/unified-table-page";

type Row = { id: string; summary: string; status: string; creator: string };
const selected: Row = { id: "selected", summary: "Target work summary", status: "Submitted for review", creator: "Sam Rivera" };
const visible: Row = { id: "visible", summary: "Other visible work", status: "Visible draft", creator: "Alex Lee" };
function host(): TableHost {
  return {
    PageHeader: ({ title, actions }) => <header><h1>{title}</h1>{actions}</header>,
    PageTabs: props => <PageTabs {...props} pathname="/records" onNavigate={vi.fn()} />,
    HeaderActions: ({ children }) => <>{children}</>,
    SectionRuleHeading: ({ label }) => <h2>{label}</h2>,
    BulkEditDialog: () => null, TableViewsMenu: () => null,
    useTableSidePanelController: () => ({ width: 560, collapsed: false, onToggleCollapsed: vi.fn(), onResizeStart: vi.fn() }),
    readUnifiedTablePreferences: () => ({}), saveUnifiedTablePreferences: vi.fn(),
    storage: window.localStorage, reportNonCriticalFailure: vi.fn(), toast: { success: vi.fn(), error: vi.fn() },
  };
}
function mount(view: "table" | "card" | "split", record: Row | null = selected, activeId: string | null = selected.id, items: Row[] = [visible], state: { isLoading?: boolean; error?: Error } = {}) {
  const edit = vi.fn(); const visibleItems = vi.fn(); const select = vi.fn(); const selectAll = vi.fn();
  const props: UnifiedTablePageProps<Row> = {
    header: { title: "Daily logs" },
    toolbar: { totalItems: 2, filteredItems: items.length, searchValue: "Other", onSearchChange: vi.fn(), currentView: view },
    data: { items, isLoading: false, ...state, onVisibleItemsChange: visibleItems },
    table: {
      columns: [
        { id: "summary", label: "Summary", render: row => row.summary },
        { id: "status", label: "Status", render: row => row.status },
        { id: "creator", label: "Created by", render: row => row.creator },
      ],
      getRowId: row => row.id, activeRowId: activeId, selectedRecord: record,
    },
    sidePanel: { title: "Selected daily log", onClose: vi.fn(), headerActions: <button onClick={() => edit(activeId)}>Edit selected</button>, body: <p>Entered sections for selected record</p> },
    selection: { selectedIds: [visible.id], onSelectRow: select, onSelectAll: selectAll },
    emptyState: { title: "No logs", description: "No logs", filteredDescription: "No matching logs", isFiltered: true },
    features: { enableColumnReorder: false, enableRowReorder: false },
  };
  render(<TooltipProvider><TableHostProvider host={host()}><UnifiedTablePage {...props} /></TableHostProvider></TooltipProvider>);
  return { edit, visibleItems, select, selectAll };
}
beforeEach(() => {
  window.localStorage.clear();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  vi.stubGlobal("matchMedia", vi.fn((query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("independent selected record in the real shared table", () => {
  it.each([["table", 1440], ["table", 390], ["split", 1440], ["split", 390]] as const)("retains selected fields, sections and Edit with zero filtered rows in %s at %i", async (view, width) => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
    const result = mount(view, selected, selected.id, []);
    expect(await screen.findByText(selected.summary)).toBeTruthy();
    expect(screen.getByText(selected.status)).toBeTruthy();
    expect(screen.getByText(selected.creator)).toBeTruthy();
    expect(screen.getByText("Entered sections for selected record")).toBeTruthy();
    expect(screen.getByText("No matching logs")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Edit selected" }));
    expect(result.edit).toHaveBeenCalledExactlyOnceWith(selected.id);
    await vi.waitFor(() => expect(result.visibleItems).toHaveBeenLastCalledWith([], expect.anything()));
    expect(screen.queryByRole("checkbox", { name: "Select row" })).toBeNull();
  });

  it.each([{ isLoading: true }, { error: new Error("List unavailable") }])("preserves split loading/error semantics instead of revealing an independent detail: %j", state => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1440 });
    mount("split", selected, selected.id, [], state);
    expect(screen.queryByText(selected.summary)).toBeNull();
    expect(screen.queryByText("Entered sections for selected record")).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit selected" })).toBeNull();
    if (state.error) expect(screen.getByText("List unavailable")).toBeTruthy();
  });

  it.each([
    ["table", 1440], ["table", 390], ["card", 1440], ["card", 390], ["split", 1440], ["split", 390],
  ] as const)("renders canonical fields and body in %s at %i without inserting the record into filtered results", async (view, width) => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
    const result = mount(view);
    expect(await screen.findByText(selected.summary)).toBeTruthy();
    expect(screen.getByText(selected.status)).toBeTruthy();
    expect(screen.getByText(selected.creator)).toBeTruthy();
    expect(screen.getByText("Entered sections for selected record")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Edit selected" }));
    expect(result.edit).toHaveBeenCalledExactlyOnceWith(selected.id);
    await vi.waitFor(() => expect(result.visibleItems).toHaveBeenLastCalledWith([visible], expect.anything()));
    expect(result.select).not.toHaveBeenCalled();
    expect(result.selectAll).not.toHaveBeenCalled();
  });

  it.each([
    ["table", { ...selected, id: "different" }], ["split", { ...selected, id: "different" }],
    ["table", null], ["split", null], ["table", {} as Row], ["split", {} as Row],
  ] as const)("rejects invalid selected input in %s and never uses the first visible row as its detail: %j", (view, record) => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1440 });
    mount(view, record);
    expect(screen.queryByText(selected.summary)).toBeNull();
    expect(screen.queryByText("Entered sections for selected record")).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit selected" })).toBeNull();
    if (view === "split") expect(screen.getByText("Select a row")).toBeTruthy();
    else expect(document.querySelector("[data-table-side-panel]")).toBeNull();
  });

  it("keeps checkbox select-all restricted to the filtered grid", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1440 });
    const result = mount("table");
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    expect(result.selectAll).toHaveBeenCalledExactlyOnceWith(false, [visible.id]);
  });

  it("prefers the current visible record over a stale independent copy with the same ID", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1440 });
    mount("table", { ...visible, summary: "Stale independent copy" }, visible.id);
    expect(screen.queryByText("Stale independent copy")).toBeNull();
    expect(screen.getByText("Entered sections for selected record")).toBeTruthy();
  });

  it.each([null, "missing"])("does not render supplied record without a matching active ID: %s", activeId => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1440 });
    mount("split", selected, activeId);
    expect(screen.queryByText(selected.summary)).toBeNull();
    expect(screen.queryByText("Entered sections for selected record")).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit selected" })).toBeNull();
  });
});
