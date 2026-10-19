import { cleanup, createEvent, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

function EmptySearchFixture() {
  const [value, setValue] = useState("");
  return <ExpandingSearch value={value} onChange={setValue} />;
}

function pointerEnter(element: Element, pointerType: string) {
  const event = createEvent.pointerOver(element, { bubbles: true });
  Object.defineProperty(event, "pointerType", { value: pointerType });
  fireEvent(element, event);
}

it("reveals on mouse hover without taking keyboard focus, then collapses when left empty", () => {
  render(<><button>Other action</button><EmptySearchFixture /></>);
  const other = screen.getByRole("button", { name: "Other action" });
  other.focus();
  pointerEnter(screen.getByRole("button", { name: "Search", exact: true }), "mouse");
  const input = screen.getByRole("textbox", { name: "Search" });
  expect(document.activeElement).toBe(other);
  fireEvent.pointerLeave(input.parentElement!.parentElement!);
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(screen.getByRole("button", { name: "Search", exact: true })).toBeDefined();
});

it("retains a hover-open search while typing and keeps touch and keyboard click activation", async () => {
  render(<EmptySearchFixture />);
  const trigger = screen.getByRole("button", { name: "Search", exact: true });
  pointerEnter(trigger, "touch");
  expect(screen.queryByRole("textbox")).toBeNull();
  fireEvent.click(trigger, { detail: 0 });
  const input = screen.getByRole("textbox", { name: "Search" });
  await waitFor(() => expect(document.activeElement).toBe(input));
  fireEvent.change(input, { target: { value: "shuttle" } });
  fireEvent.pointerLeave(input.parentElement!.parentElement!);
  expect((input as HTMLInputElement).value).toBe("shuttle");
  fireEvent.keyDown(input, { key: "Escape" });
  expect(screen.queryByRole("textbox")).toBeNull();
});
