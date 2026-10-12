import * as React from "react";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { TooltipProvider } from "../src/components/tooltip";
import { ViewSwitcher } from "../src/tables/table-toolbar";
import { PageTabs } from "../src/layout/page-tabs";
import { TableHostProvider, type TableHost } from "../src/tables/table-host";
import {
  pruneSelectionToRows,
  resolveBulkDeleteTargets,
  UnifiedTablePage,
  type UnifiedTablePageProps,
  type TableColumn,
} from "../src/tables/unified-table-page";

type RecordRow = { id: string; name: string; status: string };
const records: RecordRow[] = [
  { id: "b", name: "Bravo", status: "Draft" },
  { id: "a", name: "Alpha", status: "Approved" },
];
const columns: TableColumn<RecordRow>[] = [
  {
    id: "name",
    label: "Name",
    render: (row) => row.name,
    sortValue: (row) => row.name,
    sortable: true,
    filterValue: (row) => row.name,
  },
  {
    id: "status",
    label: "Status",
    render: (row) => row.status,
    sortValue: (row) => row.status,
    filterValue: (row) => row.status,
  },
];
function makeHost(): TableHost {
  return {
    PageHeader: ({ title, titleContent, actions }) => (
      <header>
        {titleContent ?? <h1>{title}</h1>}
        {actions}
      </header>
    ),
    PageTabs: (props) => (
      <PageTabs {...props} pathname="/records" onNavigate={vi.fn()} />
    ),
    HeaderActions: ({ children }) => <>{children}</>,
    SectionRuleHeading: ({ label, className }) => (
      <h2 className={className}>{label}</h2>
    ),
    BulkEditDialog: () => null,
    TableViewsMenu: () => null,
    useTableSidePanelController: () => ({
      width: 560,
      collapsed: false,
      onToggleCollapsed: vi.fn(),
      onResizeStart: vi.fn(),
    }),
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
    emptyState: {
      title: "No records",
      description: "Nothing recorded yet",
      filteredDescription: "No matching records",
      isFiltered: false,
    },
    toolbar: {
      totalItems: 2,
      filteredItems: 2,
      searchValue: "",
      onSearchChange: vi.fn(),
    },
    data: { items: records, isLoading: false },
    table: { columns, getRowId: (row) => row.id },
    features: { enableColumnReorder: false, enableRowReorder: false },
  };
}
function mount(value = props(), host = makeHost()) {
  return render(
    <TooltipProvider>
      <TableHostProvider host={host}>
        <UnifiedTablePage {...value} />
      </TableHostProvider>
    </TooltipProvider>,
  );
}
beforeEach(() => {
  window.localStorage.clear();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 1440,
  });
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("portable unified table", () => {
  it("keeps custom data actions reachable in the mobile toolbar", () => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: true, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })));
    const onAction = vi.fn();
    const value = props();
    value.toolbar.customActions = <button onClick={onAction}>Pricing actions</button>;
    mount(value);
    fireEvent.click(screen.getByRole("button", { name: "Pricing actions" }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("requires explicit host integration instead of silently dropping application services", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<UnifiedTablePage {...props()} />)).toThrow(
      "requires TableHostProvider",
    );
  });
  it("sorts real rendered rows with the canonical column control", () => {
    mount();
    const rows = () =>
      screen
        .getAllByRole("row")
        .slice(1)
        .map((row) => within(row).getAllByRole("cell")[1].textContent);
    expect(rows()).toEqual(["Bravo", "Alpha"]);
    fireEvent.click(screen.getByRole("button", { name: /Name/ }));
    expect(rows()).toEqual(["Alpha", "Bravo"]);
  });
  it("filters rows before select-all and returns only visible row IDs to the host", () => {
    const value = props();
    const selectAll = vi.fn();
    value.toolbar.filterQuery = {
      conjunction: "and",
      rules: [{ field: "status", operator: "is", values: ["Approved"] }],
    };
    value.toolbar.onFilterQueryChange = vi.fn();
    value.toolbar.filters = [
      {
        id: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "Approved", label: "Approved" },
          { value: "Draft", label: "Draft" },
        ],
      },
    ];
    value.selection = {
      selectedIds: [],
      onSelectAll: selectAll,
      onSelectRow: vi.fn(),
    };
    mount(value);
    expect(screen.queryByRole("cell", { name: "Bravo" })).toBeNull();
    expect(screen.getByRole("cell", { name: "Alpha" })).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    expect(selectAll).toHaveBeenCalledWith(true, ["a"]);
  });
  it("isolates selection from row activation and respects row permissions", () => {
    const value = props(); const activate = vi.fn(); const select = vi.fn();
    value.table.onRowClick = activate;
    value.table.allowRowClick = (row) => row.id === "a";
    value.selection = {
      selectedIds: [],
      onSelectAll: vi.fn(),
      onSelectRow: select,
    };
    mount(value);
    fireEvent.click(
      within(
        screen.getByRole("cell", { name: "Bravo" }).closest("tr")!,
      ).getByRole("checkbox", { name: "Select row" }),
    );
    expect(select).toHaveBeenCalledWith("b", true);
    expect(activate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("cell", { name: "Bravo" }));
    expect(activate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("cell", { name: "Alpha" }));
    expect(activate).toHaveBeenCalledWith(records[1]);
  });
  it("reports rejected inline edits through the host and retains the accepted cell", async () => {
    const host = makeHost();
    const value = props();
    const rejected = vi.fn().mockRejectedValue(new Error("Record is locked"));
    value.table.columns = [
      {
        ...columns[0],
        editable: true,
        editValue: (row) => row.name,
        onEdit: rejected,
      },
    ];
    mount(value, host);
    fireEvent.click(
      within(screen.getByRole("cell", { name: "Alpha" })).getByRole("button", {
        name: "Edit Name",
      }),
    );
    const input = screen.getByDisplayValue("Alpha");
    fireEvent.change(input, { target: { value: "Changed" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await vi.waitFor(() =>
      expect(host.toast.error).toHaveBeenCalledWith(
        "Cell update issue",
        expect.objectContaining({ description: "Record is locked" }),
      ),
    );
    expect(screen.getByRole("cell", { name: "Alpha" })).toBeTruthy();
  });
  it("preserves custom row view wording and domain delete copy", async () => {
    const value = props();
    value.table.onView = vi.fn();
    value.table.viewLabel = "View live page";
    value.table.onDelete = vi.fn();
    value.table.deleteCopy = {
      noun: "page",
      description: "Removes the app page while keeping the source file.",
    };
    mount(value);
    fireEvent.keyDown(
      screen.getAllByRole("button", { name: "Row actions" })[0],
      { key: "Enter" },
    );
    await vi.waitFor(() =>
      expect(
        screen.getByRole("menuitem", { name: "View live page" }),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(screen.getByRole("alertdialog").textContent).toContain(
      "Delete page?",
    );
    expect(screen.getByRole("alertdialog").textContent).toContain(
      "Removes the app page while keeping the source file.",
    );
  });
  it("batches only selected visible rows allowed by the delete predicate", () => {
    const value = props();
    const batch = vi.fn();
    const single = vi.fn();
    value.table.onDelete = single;
    value.table.onDeleteBatch = batch;
    value.table.allowDelete = (row) => row.id === "a";
    value.table.deleteCopy = {
      noun: "page",
      description: "Remove app pages only.",
    };
    value.selection = {
      selectedIds: ["a", "b", "hidden"],
      onSelectAll: vi.fn(),
      onSelectRow: vi.fn(),
    };
    mount(value);
    fireEvent.click(screen.getByRole("button", { name: "Delete 3 selected" }));
    const dialog = screen.getByRole("alertdialog");
    expect(dialog.textContent).toContain("Delete 1 page?");
    expect(dialog.textContent).toContain("Remove app pages only.");
    expect(dialog.textContent).toContain(
      "2 other selected pages can't be deleted and will be skipped.",
    );
    expect(
      within(dialog).queryByRole("button", { name: "Delete 3 pages" }),
    ).toBeNull();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete 1 page" }),
    );
    expect(batch).toHaveBeenCalledExactlyOnceWith([records[1]]);
    expect(single).not.toHaveBeenCalled();
  });
  it("offers no delete when none of the selected rows can be deleted", () => {
    const value = props();
    const single = vi.fn();
    value.table.onDelete = single;
    value.table.allowDelete = () => false;
    value.selection = {
      selectedIds: ["a", "b"],
      onSelectAll: vi.fn(),
      onSelectRow: vi.fn(),
    };
    mount(value);
    fireEvent.click(screen.getByRole("button", { name: "Delete 2 selected" }));
    const dialog = screen.getByRole("alertdialog");
    expect(dialog.textContent).toContain("No items to delete");
    expect(dialog.textContent).toContain(
      "None of the 2 selected items can be deleted.",
    );
    expect(within(dialog).queryByRole("button", { name: /^Delete/ })).toBeNull();
    expect(single).not.toHaveBeenCalled();
  });
  it("drops a row deleted from its own menu from the internal selection", async () => {
    const value = props();
    const remove = vi.fn();
    value.table.onDelete = remove;
    const view = mount(value);
    const selectRow = (name: string) =>
      fireEvent.click(
        within(
          screen.getByRole("cell", { name }).closest("tr")!,
        ).getByRole("checkbox", { name: "Select row" }),
      );
    selectRow("Bravo");
    expect(
      screen.getByRole("button", { name: "Delete 1 selected" }),
    ).toBeTruthy();
    // The owner deleted Bravo; its next render no longer carries the row.
    view.rerender(
      <TooltipProvider>
        <TableHostProvider host={makeHost()}>
          <UnifiedTablePage
            {...value}
            data={{ items: [records[1]], isLoading: false }}
          />
        </TableHostProvider>
      </TooltipProvider>,
    );
    await vi.waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /Delete \d+ selected/ }),
      ).toBeNull(),
    );
    selectRow("Alpha");
    fireEvent.click(screen.getByRole("button", { name: "Delete 1 selected" }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Delete 1 item",
      }),
    );
    expect(remove).toHaveBeenCalledExactlyOnceWith(records[1]);
  });
  it("keeps the internal selection while a load or refetch has no rows yet", async () => {
    const value = props();
    value.table.onDelete = vi.fn();
    const view = mount(value);
    fireEvent.click(
      within(
        screen.getByRole("cell", { name: "Bravo" }).closest("tr")!,
      ).getByRole("checkbox", { name: "Select row" }),
    );
    const rerender = (data: UnifiedTablePageProps<RecordRow>["data"]) =>
      view.rerender(
        <TooltipProvider>
          <TableHostProvider host={makeHost()}>
            <UnifiedTablePage {...value} data={data} />
          </TableHostProvider>
        </TooltipProvider>,
      );
    rerender({ items: [], isLoading: true });
    rerender({ items: records, isLoading: false });
    rerender({ items: [], isLoading: false, isFetching: true });
    rerender({ items: records, isLoading: false, isFetching: false });
    expect(
      screen.getByRole("button", { name: "Delete 1 selected" }),
    ).toBeTruthy();
  });
  it("owns no application aliases or network endpoints", () => {
    for (const file of readdirSync(path.resolve("src/tables")).filter((file) =>
      /\.(tsx?|css)$/.test(file),
    )) {
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

  it("shows labeled layout choices directly with touch-sized targets", () => {
    const change = vi.fn();
    render(
      <ViewSwitcher
        currentView="split"
        display="labels"
        enabledViews={["table", "split", "board"]}
        onViewChange={change}
      />,
    );

    const group = screen.getByRole("radiogroup", { name: "Table views" });
    const selected = within(group).getByRole("radio", { name: "Split view" });
    const board = within(group).getByRole("radio", { name: "Board view" });
    expect(selected.getAttribute("aria-checked")).toBe("true");
    expect(board.textContent).toContain("Board");
    expect(board.classList.contains("h-11")).toBe(true);
    expect(board.classList.contains("w-full")).toBe(true);
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.queryByRole("button", { name: "Change view, Split" })).toBeNull();

    fireEvent.click(board);
    expect(change).toHaveBeenCalledWith("board");
  });
});

describe("draft price table behavior", () => {
  it("keeps numeric editable triggers right-aligned with a hover border", () => {
    const value = props();
    value.table.columns = [
      {
        id: "price",
        label: "Price",
        align: "right",
        render: (row) => row.status,
        editable: true,
        editValue: (row) => row.status,
      },
    ];
    mount(value);

    const trigger = screen
      .getAllByRole("button", { name: "Edit Price" })
      .find((button) => button.classList.contains("text-right"));
    expect(trigger).toBeTruthy();
    expect(trigger?.classList.contains("text-right")).toBe(true);
    expect(trigger?.classList.contains("hover:border-border")).toBe(true);
    expect(trigger?.classList.contains("border-transparent")).toBe(true);
  });

  it("moves between visible editable rows, skips locked rows, and resets with Escape", async () => {
    const edit = vi.fn();
    const revert = vi.fn();
    const value = props();
    value.data.items = [
      records[0],
      { id: "locked", name: "Locked", status: "7" },
      records[1],
    ];
    value.table.controlledInlineEditing = true;
    value.table.highlightEditingRow = true;
    value.table.columns = [
      columns[0],
      {
        id: "price",
        label: "Price",
        render: (row) => row.status,
        editable: true,
        editValue: (row) => row.status,
        editNavigation: true,
        isEditable: (row) => row.id !== "locked",
        onEdit: edit,
        onRevert: revert,
      },
    ];
    mount(value);
    fireEvent.click(screen.getAllByRole("button", { name: "Edit Price" })[2]);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "290" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    await vi.waitFor(() =>
      expect(screen.getByRole("textbox")).toHaveProperty("value", "Approved"),
    );
    expect(edit).toHaveBeenCalledTimes(1);
    expect(edit).toHaveBeenCalledWith(records[0], "290");
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(revert).toHaveBeenCalledWith(records[1]);
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("shows group edit status even collapsed and excludes collapsed rows from navigation", async () => {
    const value = props();
    value.table.grouping = {
      getGroupValue: (row) => row.status,
      collapsible: true,
      indentItems: true,
      getGroupStatus: () => "1 edited",
    };
    mount(value);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Collapse Draft" })[1],
    );
    expect(
      screen.getAllByRole("button", { name: "Expand Draft" })[1].textContent,
    ).toContain("1 edited");
    expect(screen.queryByRole("cell", { name: "Bravo" })).toBeNull();
  });

  it("keeps mobile rows when their group heading is suppressed", () => {
    const value = props();
    value.table.grouping = {
      getGroupValue: (row) => row.status,
      getGroupLabel: (groupValue) => groupValue,
      shouldRenderGroupHeader: (groupValue) => groupValue !== "Draft",
      indentItems: true,
    };
    const { container } = mount(value);

    const mobileGroups = [...container.querySelectorAll("div")].find(
      (element) =>
        element.className.includes("sm:hidden") &&
        element.className.includes("space-y-3"),
    );
    expect(mobileGroups).toBeTruthy();
    const mobileCards = [
      ...(mobileGroups?.querySelectorAll('[class*="rounded-2xl"]') ?? []),
    ];
    expect(mobileCards.some((card) => card.textContent?.includes("Bravo"))).toBe(
      true,
    );
  });

  it("uses the domain value after reset instead of reopening a stale cached draft", async () => {
    const host = makeHost();
    const value = props();
    value.table.controlledInlineEditing = true;
    value.table.columns = [
      columns[0],
      {
        id: "price",
        label: "Price",
        render: (row) => row.status,
        editable: true,
        editValue: (row) => row.status,
        onEdit: vi.fn(),
      },
    ];
    const view = mount(value, host);
    fireEvent.click(screen.getAllByRole("button", { name: "Edit Price" })[2]);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "290" } });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    await vi.waitFor(() => expect(screen.queryByRole("textbox")).toBeNull());
    value.data = {
      items: [{ ...records[0], status: "275" }, records[1]],
      isLoading: false,
    };
    view.rerender(
      <TooltipProvider>
        <TableHostProvider host={host}>
          <UnifiedTablePage {...value} />
        </TableHostProvider>
      </TooltipProvider>,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Edit Price" })[2]);
    expect(screen.getByRole("textbox")).toHaveProperty("value", "275");
  });
});

describe("selection helpers", () => {
  const getRowId = (row: RecordRow) => row.id;
  it("prunes ids that left the rows and keeps the same array when nothing did", () => {
    const kept = ["a", "b"];
    expect(pruneSelectionToRows(kept, records, getRowId)).toBe(kept);
    expect(pruneSelectionToRows(["a", "gone"], records, getRowId)).toEqual([
      "a",
    ]);
    expect(pruneSelectionToRows(["a"], [], getRowId)).toEqual([]);
  });
  it("resolves bulk-delete targets as visible rows the predicate allows", () => {
    expect(
      resolveBulkDeleteTargets(
        ["a", "b", "off-page"],
        records,
        getRowId,
        (row) => row.id !== "b",
      ),
    ).toEqual({ items: [records[1]], skippedCount: 2 });
    expect(resolveBulkDeleteTargets(["b"], records, getRowId)).toEqual({
      items: [records[0]],
      skippedCount: 0,
    });
  });
});
