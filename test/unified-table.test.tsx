import * as React from "react";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { TooltipProvider } from "../src/components/tooltip";
import { ViewSwitcher } from "../src/tables/table-toolbar";
import { PageTabs } from "../src/layout/page-tabs";
import { TableHostProvider, type TableHost } from "../src/tables/table-host";
import { UnifiedTablePage, type UnifiedTablePageProps, type TableColumn } from "../src/tables/unified-table-page";

type RecordRow = { id: string; name: string; status: string };
const records: RecordRow[] = [
  { id: "b", name: "Bravo", status: "Draft" },
  { id: "a", name: "Alpha", status: "Approved" },
];
const columns: TableColumn<RecordRow>[] = [
  { id: "name", label: "Name", render: row => row.name, sortValue: row => row.name, sortable: true, filterValue: row => row.name },
  { id: "status", label: "Status", render: row => row.status, sortValue: row => row.status, filterValue: row => row.status },
];
function makeHost(): TableHost {
  return {
    PageHeader: ({ title, titleContent, actions }) => <header>{titleContent ?? <h1>{title}</h1>}{actions}</header>,
    PageTabs: props => <PageTabs {...props} pathname="/records" onNavigate={vi.fn()} />,
    HeaderActions: ({ children }) => <>{children}</>,
    SectionRuleHeading: ({ label, className }) => <h2 className={className}>{label}</h2>,
    BulkEditDialog: () => null,
    TableViewsMenu: () => null,
    useTableSidePanelController: () => ({ width: 560, collapsed: false, onToggleCollapsed: vi.fn(), onResizeStart: vi.fn() }),
    readUnifiedTablePreferences: () => ({}),
    saveUnifiedTablePreferences: vi.fn(),
    storage: window.localStorage,
    reportNonCriticalFailure: vi.fn(),
    toast: { success: vi.fn(), error: vi.fn() },
  };
}
function props(): UnifiedTablePageProps<RecordRow> {
  return {
    header: { title: "Records" },
    emptyState: { title: "No records", description: "Nothing recorded yet", filteredDescription: "No matching records", isFiltered: false },
    toolbar: { totalItems: 2, filteredItems: 2, searchValue: "", onSearchChange: vi.fn() },
    data: { items: records, isLoading: false },
    table: { columns, getRowId: row => row.id },
    features: { enableColumnReorder: false, enableRowReorder: false },
  };
}
function mount(value = props(), host = makeHost()) {
  return render(<TooltipProvider><TableHostProvider host={host}><UnifiedTablePage {...value} /></TableHostProvider></TooltipProvider>);
}
beforeEach(() => {
  window.localStorage.clear();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1440 });
  vi.stubGlobal("matchMedia", vi.fn((query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("portable unified table", () => {
  it("requires explicit host integration instead of silently dropping application services", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<UnifiedTablePage {...props()} />)).toThrow("requires TableHostProvider");
  });
  it("sorts real rendered rows with the canonical column control", () => {
    mount();
    const rows = () => screen.getAllByRole("row").slice(1).map(row => within(row).getAllByRole("cell")[1].textContent);
    expect(rows()).toEqual(["Bravo", "Alpha"]);
    fireEvent.click(screen.getByRole("button", { name: /Name/ }));
    expect(rows()).toEqual(["Alpha", "Bravo"]);
  });
  it("filters rows before select-all and returns only visible row IDs to the host", () => {
    const value = props(); const selectAll = vi.fn();
    value.toolbar.filterQuery = { conjunction: "and", rules: [{ field: "status", operator: "is", values: ["Approved"] }] };
    value.toolbar.onFilterQueryChange = vi.fn();
    value.toolbar.filters = [{ id: "status", label: "Status", type: "select", options: [{ value: "Approved", label: "Approved" }, { value: "Draft", label: "Draft" }] }];
    value.selection = { selectedIds: [], onSelectAll: selectAll, onSelectRow: vi.fn() };
    mount(value);
    expect(screen.queryByRole("cell", { name: "Bravo" })).toBeNull();
    expect(screen.getByRole("cell", { name: "Alpha" })).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    expect(selectAll).toHaveBeenCalledWith(true, ["a"]);
  });
  it("isolates selection from row activation and respects row permissions", () => {
    const value = props(); const activate = vi.fn(); const select = vi.fn();
    value.table.onRowClick = activate;
    value.table.allowRowClick = row => row.id === "a";
    value.selection = { selectedIds: [], onSelectAll: vi.fn(), onSelectRow: select };
    mount(value);
    fireEvent.click(within(screen.getByRole("cell", { name: "Bravo" }).closest("tr")!).getByRole("checkbox", { name: "Select row" }));
    expect(select).toHaveBeenCalledWith("b", true);
    expect(activate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("cell", { name: "Bravo" }));
    expect(activate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("cell", { name: "Alpha" }));
    expect(activate).toHaveBeenCalledWith(records[1]);
  });
  it("reports rejected inline edits through the host and retains the accepted cell", async () => {
    const host = makeHost(); const value = props(); const rejected = vi.fn().mockRejectedValue(new Error("Record is locked"));
    value.table.columns = [{ ...columns[0], editable: true, editValue: row => row.name, onEdit: rejected }];
    mount(value, host);
    fireEvent.click(within(screen.getByRole("cell", { name: "Alpha" })).getByRole("button", { name: "Edit Name" }));
    const input = screen.getByDisplayValue("Alpha");
    fireEvent.change(input, { target: { value: "Changed" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await vi.waitFor(() => expect(host.toast.error).toHaveBeenCalledWith("Cell update issue", expect.objectContaining({ description: "Record is locked" })));
    expect(screen.getByRole("cell", { name: "Alpha" })).toBeTruthy();
  });
  it("preserves custom row view wording and domain delete copy", async () => {
    const value = props();
    value.table.onView = vi.fn();
    value.table.viewLabel = "View live page";
    value.table.onDelete = vi.fn();
    value.table.deleteCopy = { noun: "page", description: "Removes the app page while keeping the source file." };
    mount(value);
    fireEvent.keyDown(screen.getAllByRole("button", { name: "Row actions" })[0], { key: "Enter" });
    await vi.waitFor(() => expect(screen.getByRole("menuitem", { name: "View live page" })).toBeTruthy());
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(screen.getByRole("alertdialog").textContent).toContain("Delete page?");
    expect(screen.getByRole("alertdialog").textContent).toContain("Removes the app page while keeping the source file.");
  });
  it("batches only selected visible rows allowed by the delete predicate", () => {
    const value = props(); const batch = vi.fn(); const single = vi.fn();
    value.table.onDelete = single; value.table.onDeleteBatch = batch;
    value.table.allowDelete = row => row.id === "a";
    value.table.deleteCopy = { noun: "page", description: "Remove app pages only." };
    value.selection = { selectedIds: ["a", "b", "hidden"], onSelectAll: vi.fn(), onSelectRow: vi.fn() };
    mount(value);
    fireEvent.click(screen.getByRole("button", { name: "Delete 3 selected" }));
    const dialog = screen.getByRole("alertdialog");
    expect(dialog.textContent).toContain("Remove app pages only.");
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete 3 pages" }));
    expect(batch).toHaveBeenCalledExactlyOnceWith([records[1]]);
    expect(single).not.toHaveBeenCalled();
  });
  it("owns no application aliases or network endpoints", () => {
    for (const file of readdirSync(path.resolve("src/tables")).filter(file => /\.(tsx?|css)$/.test(file))) {
      const source = readFileSync(path.resolve("src/tables", file), "utf8");
      expect(source).not.toMatch(/from\s+["']@\//);
      expect(source).not.toMatch(/(?:fetch|apiFetch)\s*\(|["']\/api\//);
    }
  });

  it.each([undefined, ["name", "status"]])("owns one select-all beside the split title (%s)", splitColumns => {
    const value = props();
    value.toolbar.currentView = "split";
    value.table.splitColumns = splitColumns;
    const selectAll = vi.fn();
    value.selection = { selectedIds: [], onSelectAll: selectAll, onSelectRow: vi.fn() };
    mount(value);
    const checkbox = screen.getByRole("checkbox", { name: "Select all rows" });
    expect(screen.getByRole("heading", { name: "Records", level: 2 }).parentElement?.contains(checkbox)).toBe(true);
    expect(document.querySelector("table thead [role=checkbox]")).toBeNull();
    fireEvent.click(checkbox);
    expect(selectAll).toHaveBeenCalledWith(true, ["b", "a"]);
  });
});


describe("mobile view disclosure", () => {
  it("shows only enabled views in the menu and preserves the host callback", async () => {
    const change = vi.fn();
    render(<ViewSwitcher currentView="split" enabledViews={["table", "split", "board"]} onViewChange={change} />);
    fireEvent.keyDown(screen.getByRole("button", {name:"Change view, Split"}), {key:"Enter"});
    const board = await screen.findByRole("menuitemradio", {name:"Board"});
    expect(screen.queryByRole("menuitemradio", {name:"Gallery"})).toBeNull();
    expect(screen.getByRole("menuitemradio", {name:"Split"}).getAttribute("aria-checked")).toBe("true");
    fireEvent.click(board);
    expect(change).toHaveBeenCalledWith("board");
  });
});
