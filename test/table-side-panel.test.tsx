import { fireEvent, render, screen } from "@testing-library/react";
import { TableSidePanel } from "../src/tables/table-side-panel";

describe("TableSidePanel viewport height", () => {
  it("keeps a reading workspace open when the user interacts with the file list", () => {
    const close = vi.fn();
    render(<><button>File list</button><TableSidePanel title="Preview" onClose={close} dismissOnOutsideClick={false}>Document content</TableSidePanel></>);
    fireEvent.pointerDown(screen.getByRole("button", { name: "File list" }));
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Close details" }));
    expect(close).toHaveBeenCalledOnce();
  });
  it("fills the viewport for a desktop overlay", () => {
    render(<TableSidePanel title="Record details">Details</TableSidePanel>);

    const panel = screen.getByRole("complementary", { name: "Record details" });
    expect(panel.classList.contains("fixed")).toBe(true);
    expect(panel.classList.contains("top-12")).toBe(true);
    expect(panel.classList.contains("bottom-0")).toBe(true);
    expect(panel.classList.contains("right-0")).toBe(true);
    expect(panel.classList.contains("left-0")).toBe(false);
    expect(panel.classList.contains("top-0")).toBe(false);
  });

  it("keeps the inline panel sized to its split-view container", () => {
    render(
      <TableSidePanel mode="inline" title="Split details">
        Details
      </TableSidePanel>,
    );

    const panel = screen.getByRole("complementary", { name: "Split details" });
    expect(panel.classList.contains("relative")).toBe(true);
    expect(panel.classList.contains("h-full")).toBe(true);
  });
});
