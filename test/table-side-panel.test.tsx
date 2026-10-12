import { render, screen } from "@testing-library/react";
import { TableSidePanel } from "../src/tables/table-side-panel";

describe("TableSidePanel viewport height", () => {
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
