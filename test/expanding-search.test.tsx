import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { ExpandingSearch } from "../src/ds/expanding-search";

function SearchFixture() {
  const [value, setValue] = useState("Unmask");
  return <ExpandingSearch value={value} onChange={setValue} />;
}

afterEach(cleanup);

describe("ExpandingSearch", () => {
  it("clears through keyboard-generated click activation and restores input focus", () => {
    render(<SearchFixture />);
    const button = screen.getByRole("button", { name: "Clear search" });
    button.focus();
    // Native Enter/Space activation emits a click without a mouse-down event.
    fireEvent.click(button, { detail: 0 });
    const input = screen.getByRole("textbox", { name: "Search" }) as HTMLInputElement;
    expect(input.value).toBe("");
    expect(document.activeElement).toBe(input);
  });
});
