import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SplitPageWorkspaceRailHeader, SplitPageWorkspaceRowContent, SplitPageWorkspaceRowSelection } from "../src/components/split-page-workspace";

afterEach(cleanup);

describe("workspace title selection", () => {
  it("places select-all with the title and preserves the host's callback", () => {
    const change = vi.fn();
    render(<SplitPageWorkspaceRailHeader title="Tasks" actions={<button>Search</button>}
      selection={{ checked: false, onCheckedChange: change, "aria-label": "Select all visible tasks" }} />);
    const checkbox = screen.getByRole("checkbox", { name: "Select all visible tasks" });
    const titleGroup = screen.getByRole("heading", { name: "Tasks" }).parentElement!;
    expect(titleGroup.contains(checkbox)).toBe(true);
    expect(titleGroup.contains(screen.getByRole("button", { name: "Search" }))).toBe(false);
    expect(checkbox.closest("label")?.className).toContain("opacity-0");
    fireEvent.click(checkbox);
    expect(change).toHaveBeenCalledWith(true);
  });

  it("keeps partial selection visible and permits clearing it", () => {
    const change = vi.fn();
    render(<SplitPageWorkspaceRailHeader title="Tasks"
      selection={{ checked: "indeterminate", onCheckedChange: change, "aria-label": "Select all tasks" }} />);
    const checkbox = screen.getByRole("checkbox", { name: "Select all tasks" });
    expect(checkbox.getAttribute("aria-checked")).toBe("mixed");
    expect(checkbox.closest("label")?.className).not.toContain("opacity-0");
    fireEvent.click(checkbox);
    expect(change).toHaveBeenCalledWith(true);
  });

  it("keeps keyboard focus and non-hover devices discoverable, and disables an empty selection", () => {
    render(<SplitPageWorkspaceRailHeader title="Tasks"
      selection={{ checked: false, disabled: true, onCheckedChange: vi.fn(), "aria-label": "Select all tasks" }} />);
    const checkbox = screen.getByRole("checkbox", { name: "Select all tasks" });
    expect(checkbox.hasAttribute("disabled")).toBe(true);
    const classes = checkbox.closest("label")?.className;
    expect(classes).toContain("focus-within:opacity-100");
    expect(classes).toContain("group-hover/title:opacity-100");
    expect(classes).toContain("[@media(hover:none)]:opacity-100");
    expect(classes).toContain("size-11");
  });
});


describe("mobile rail hierarchy", () => {
  it("keeps long primary context readable and row selection independent", () => {
    const activate = vi.fn();
    const select = vi.fn();
    render(<div><SplitPageWorkspaceRowSelection checked={false} onCheckedChange={select} aria-label="Select task" />
      <button onClick={activate}><SplitPageWorkspaceRowContent title="Review the revised training room scope and confirm the remaining estimates"
        metadata={[{key:"project",label:"Radial Brownsburg training room",primary:true},{key:"owner",label:"Andrew Cannon"},{key:"source",label:"Daily Deep Read",desktopOnly:true}]} /></button></div>);
    fireEvent.click(screen.getByRole("checkbox",{name:"Select task"}));
    expect(select).toHaveBeenCalledWith(true);
    expect(activate).not.toHaveBeenCalled();
    expect(screen.getByText("Radial Brownsburg training room").className).toContain("basis-full");
    expect(screen.getByText("Daily Deep Read").className).toContain("hidden sm:inline");
    fireEvent.click(screen.getByRole("button",{name:/Review the revised/}));
    expect(activate).toHaveBeenCalledOnce();
  });
});
