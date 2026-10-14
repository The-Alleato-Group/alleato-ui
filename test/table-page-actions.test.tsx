import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { TablePageActions } from "../src/tables/table-page-actions";

// An href-only create option rendered as a <button> with no onClick: clicking
// "New" on /asrs did nothing (no navigation, no request, no error). These tests
// pin that an href option is a real link in both the single and menu variants.
describe("TablePageActions href options", () => {
  it("renders a single href option as a link to that address", () => {
    render(
      <TablePageActions
        addOptions={[{ label: "New estimate", href: "/asrs/estimates/new" }]}
      />,
    );
    const control = screen.getByRole("link", { name: "New estimate" });
    expect(control.tagName).toBe("A");
    expect(control.getAttribute("href")).toBe("/asrs/estimates/new");
    expect(screen.queryByRole("button", { name: "New estimate" })).toBeNull();
  });

  it("runs an href option's onClick from the link itself", () => {
    const onClick = vi.fn();
    render(
      <TablePageActions
        addOptions={[{ label: "New estimate", href: "/asrs/estimates/new", onClick }]}
      />,
    );
    const link = screen.getByRole("link", { name: "New estimate" });
    const event = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    // The click lands on the anchor, so the option's onClick still runs.
    link.dispatchEvent(event);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps a single onClick option a button", () => {
    const onClick = vi.fn();
    render(<TablePageActions addOptions={[{ label: "New company", onClick }]} />);
    fireEvent.click(screen.getByRole("button", { name: "New company" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("never links a disabled href option", () => {
    render(
      <TablePageActions
        addOptions={[{ label: "New estimate", href: "/asrs/estimates/new", disabled: true }]}
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByRole("button", { name: "New estimate" })).toHaveProperty("disabled", true);
  });

  it("renders href menu items as links", async () => {
    render(
      <TablePageActions
        addLabel="New"
        addOptions={[
          { label: "New estimate", href: "/asrs/estimates/new" },
          { label: "Import", onClick: () => {} },
        ]}
      />,
    );
    const trigger = screen.getByRole("button", { name: "New" });
    fireEvent.keyDown(trigger, { key: "Enter" });
    const item = await screen.findByRole("menuitem", { name: "New estimate" });
    expect(item.tagName).toBe("A");
    expect(item.getAttribute("href")).toBe("/asrs/estimates/new");
    expect(screen.getByRole("menuitem", { name: "Import" }).tagName).not.toBe("A");
  });
});
