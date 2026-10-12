import * as React from "react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PageContainer } from "../src/layout/page-container";
import { WorkspaceGutterProvider } from "../src/layout/workspace-gutter-context";
import { useTablePageShellOwnsLayout } from "../src/layout/table-page-layout-context";
import { PageShellFrame } from "../src/layout/page-shell-frame";
import { PageTabs } from "../src/layout/page-tabs";
import { MobileCardList } from "../src/ds/mobile-card-list";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
});

describe("portable page layout ownership", () => {
  it("keeps the host workspace as the single gutter owner at every breakpoint", () => {
    const { container } = render(
      <WorkspaceGutterProvider>
        <PageShellFrame variant="detail" header={<h1>Record</h1>}>
          <span>Details</span>
        </PageShellFrame>
      </WorkspaceGutterProvider>,
    );
    const root = container.firstElementChild!;
    expect(root.className.split(/\s+/).filter((name) => /(^|:)px-(?!0\b)/.test(name))).toEqual([]);
    expect(root.className).toContain("pb-4");
  });

  it("shares table-shell ownership with nested consumers without leaking to other pages", () => {
    function Ownership() { return <span>{String(useTablePageShellOwnsLayout())}</span>; }
    const { rerender } = render(<PageShellFrame variant="table"><Ownership /></PageShellFrame>);
    expect(screen.getByText("true")).toBeTruthy();
    rerender(<PageShellFrame variant="detail"><Ownership /></PageShellFrame>);
    expect(screen.getByText("false")).toBeTruthy();
  });

  it("resets form scroll on host navigation and cancels delayed work on unmount", () => {
    vi.useFakeTimers();
    const scroll = vi.mocked(window.scrollTo);
    const { rerender, unmount } = render(
      <PageShellFrame variant="form" scrollResetKey="/new"><span>Form</span></PageShellFrame>,
    );
    expect(scroll).toHaveBeenCalled();
    scroll.mockClear();
    rerender(<PageShellFrame variant="form" scrollResetKey="/other"><span>Form</span></PageShellFrame>);
    expect(scroll).toHaveBeenCalled();
    unmount();
    scroll.mockClear();
    vi.runAllTimers();
    expect(scroll).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("leaves detail-page scroll alone and permits a standalone container", () => {
    render(<PageShellFrame variant="detail"><span>Details</span></PageShellFrame>);
    expect(window.scrollTo).not.toHaveBeenCalled();
    cleanup();
    const { container } = render(<PageContainer>Standalone</PageContainer>);
    expect(container.firstElementChild!.className).toContain("lg:px-8");
  });
});

describe("tabs with host-supplied routing", () => {
  it("selects the exact query tab and calls the host when another tab is chosen", () => {
    const navigate = vi.fn();
    render(<PageTabs pathname="/records" search="status=active" onNavigate={navigate} tabs={[
      { label: "All", href: "/records" },
      { label: "Active", href: "/records?status=active", count: 2 },
    ]} />);
    expect(screen.getByRole("button", { name: "Active" }).getAttribute("aria-current")).toBe("page");
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(navigate).toHaveBeenCalledWith("/records");
  });

  it("lets explicit selection win over a matching path with unrelated query state", () => {
    render(<PageTabs pathname="/records" search="detail=42" onNavigate={vi.fn()} tabs={[
      { label: "All", href: "/records" },
      { label: "Board", href: "/records?view=board", isActive: true },
    ]} />);
    expect(screen.getByRole("button", { name: "Board" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("button", { name: "All" }).hasAttribute("aria-current")).toBe(false);
  });

  it("recognizes nested destinations inside a menu tab", () => {
    render(<PageTabs pathname="/reports/cost/42" onNavigate={vi.fn()} tabs={[
      { label: "Reports", href: "/reports", items: [{ label: "Costs", href: "/reports/cost" }] },
    ]} />);
    expect(screen.getByRole("button", { name: "Reports" }).getAttribute("aria-current")).toBe("page");
  });

  it("title-cases page tabs and menu triggers while keeping small words lowercase", () => {
    render(<PageTabs pathname="/records" onNavigate={vi.fn()} tabs={[
      { label: "supplier prices", href: "/records" },
      { label: "cost of goods", href: "/costs" },
      { label: "all of accounting", href: "/accounting", items: [
        { label: "accounts payable", href: "/accounting/ap" },
      ] },
    ]} />);

    expect(screen.getByRole("button", { name: "Supplier Prices" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cost of Goods" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "All of Accounting" })).toBeTruthy();
  });
});

describe("portable mobile cards", () => {
  const item = { id: "1", name: "Warehouse", status: "Active" };
  const columns = [
    { id: "control", label: "", render: () => <span>Control</span> },
    { id: "empty", label: "Empty", render: () => <span>{null}</span> },
    { id: "name", label: "Name", render: (row: typeof item) => row.name },
    { id: "status", label: "Status", render: (row: typeof item) => row.status },
  ];

  it("finds the first populated identity and omits empty metadata", () => {
    render(<MobileCardList items={[item]} columns={columns} getRowId={(row) => row.id} hasRowActions={false} />);
    expect(screen.getByText("Warehouse")).toBeTruthy();
    expect(screen.getByText("Status")).toBeTruthy();
    expect(screen.queryByText("Empty")).toBeNull();
    expect(screen.queryByText("Control")).toBeNull();
  });

  it("selects a row without activating its navigation", () => {
    const select = vi.fn(); const open = vi.fn();
    render(<MobileCardList items={[item]} columns={columns} getRowId={(row) => row.id}
      hasRowActions={false} selectedIds={[]} onSelectRow={select} onRowClick={open} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select row" }));
    expect(select).toHaveBeenCalledWith("1", true);
    expect(open).not.toHaveBeenCalled();
  });

  it("honors the host's row-click predicate and keeps allowed rows keyboard reachable", () => {
    const open = vi.fn();
    const { rerender } = render(<MobileCardList items={[item]} columns={columns} getRowId={(row) => row.id}
      hasRowActions={false} onRowClick={open} allowRowClick={() => false} />);
    expect(screen.queryByRole("button")).toBeNull();
    fireEvent.click(screen.getByText("Warehouse"));
    expect(open).not.toHaveBeenCalled();
    rerender(<MobileCardList items={[item]} columns={columns} getRowId={(row) => row.id}
      hasRowActions={false} onRowClick={open} allowRowClick={() => true} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
    expect(open).toHaveBeenCalledWith(item);
  });

  it.each([
    { editAllowed: true, deleteAllowed: false, action: "Edit" },
    { editAllowed: false, deleteAllowed: true, action: "Delete" },
  ])("exposes only the permitted $action callback without opening the row", async ({ editAllowed, deleteAllowed, action }) => {
    const open = vi.fn(); const edit = vi.fn(); const remove = vi.fn();
    render(<MobileCardList items={[item]} columns={columns} getRowId={(row) => row.id}
      hasRowActions onRowClick={open} onEdit={edit} onDelete={remove}
      allowEdit={(row) => row.id === item.id && editAllowed}
      allowDelete={(row) => row.id === item.id && deleteAllowed} />);
    const trigger = document.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]')!;
    expect(trigger).toBeTruthy();
    fireEvent.keyDown(trigger, { key: "Enter" });
    const allowedAction = await screen.findByRole("menuitem", { name: action });
    expect(screen.queryByRole("menuitem", { name: action === "Edit" ? "Delete" : "Edit" })).toBeNull();
    expect(open).not.toHaveBeenCalled();
    fireEvent.click(allowedAction);
    expect(action === "Edit" ? edit : remove).toHaveBeenCalledWith(item);
    expect(action === "Edit" ? remove : edit).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  });

  it("omits the actions trigger when every available operation is denied", () => {
    const edit = vi.fn(); const remove = vi.fn();
    render(<MobileCardList items={[item]} columns={columns} getRowId={(row) => row.id}
      hasRowActions onEdit={edit} onDelete={remove} allowEdit={() => false} allowDelete={() => false} />);
    expect(document.querySelector('button[aria-haspopup="menu"]')).toBeNull();
    expect(screen.queryByRole("menuitem")).toBeNull();
    expect(edit).not.toHaveBeenCalled(); expect(remove).not.toHaveBeenCalled();
  });

  it("isolates custom action clicks and keyboard activation from row navigation", () => {
    const open = vi.fn(); const action = vi.fn();
    render(<MobileCardList items={[item]} columns={columns} getRowId={(row) => row.id}
      hasRowActions onRowClick={open}
      rowActions={(row) => <button onClick={() => action(row)}>Inspect record</button>} />);
    const button = screen.getByRole("button", { name: "Inspect record" });
    fireEvent.keyDown(button, { key: "Enter" });
    fireEvent.keyDown(button, { key: " " });
    expect(open).not.toHaveBeenCalled();
    fireEvent.click(button);
    expect(action).toHaveBeenCalledWith(item);
    expect(open).not.toHaveBeenCalled();
  });
});

it("keeps the new portable exports independent of app aliases, routing and network clients", () => {
  for (const name of ["layout/page-container", "layout/page-tabs", "layout/page-shell-frame",
    "layout/workspace-gutter-context", "layout/table-page-layout-context", "ds/mobile-card-list"]) {
    const source = readFileSync(path.resolve(__dirname, `../src/${name}.tsx`), "utf8");
    expect(source).not.toMatch(/from ["'](?:@\/|next\/navigation)/);
    expect(source).not.toMatch(/\b(?:apiFetch|fetch|useCurrentUserProfile)\(/);
  }
});
