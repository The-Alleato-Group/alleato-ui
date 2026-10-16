import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../src/components/sheet";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "../src/components/drawer";
import { useSheetOpening } from "../src/hooks/use-sheet-opening";

function viewport(width: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  window.matchMedia = vi.fn().mockImplementation(() => ({ matches: width < 768, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
}
afterEach(cleanup);
beforeEach(() => viewport(390));

describe.each(["sheet", "drawer"])("%s shared opening", (kind) => {
  function Editor() {
    const [open, setOpen] = React.useState(false);
    const Root = kind === "sheet" ? Sheet : Drawer;
    const Content = kind === "sheet" ? SheetContent : DrawerContent;
    const Title = kind === "sheet" ? SheetTitle : DrawerTitle;
    const Trigger = kind === "sheet" ? SheetTrigger : DrawerTrigger;
    return <Root open={open} onOpenChange={setOpen}>
      <Trigger>Open editor</Trigger>
      <Content aria-describedby={undefined}><Title>Company</Title><input aria-label="Name" autoFocus /><div data-testid="body"><input aria-label="Last field" /></div><button onClick={() => setOpen(false)}>Cancel</button></Content>
    </Root>;
  }
  it("starts each phone open on the content container without keeping field focus", async () => {
    render(<Editor />);
    for (let i = 0; i < 2; i++) {
      fireEvent.click(screen.getByText("Open editor"));
      const content = await screen.findByRole("dialog", { name: "Company" });
      await waitFor(() => expect(document.activeElement).toBe(content));
      fireEvent.focus(screen.getByLabelText("Last field"));
      fireEvent.click(screen.getByText("Cancel"));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    }
  });
  it("retains desktop field autofocus", async () => {
    viewport(1440); render(<Editor />);
    fireEvent.click(screen.getByText("Open editor"));
    await screen.findByRole("dialog");
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("Name")));
  });
});

it("resets retained nested scroll offsets on every opening, including caller-controlled focus", async () => {
  const targets: Array<EventTarget | null> = [];
  const override = vi.fn((event: Event) => { targets.push(event.currentTarget); event.preventDefault(); });
  function RetainedContent() {
    const opening = useSheetOpening(override);
    return <div ref={opening.ref} data-state="closed" data-testid="content" tabIndex={-1}><div data-testid="body" /></div>;
  }
  render(<RetainedContent />);
  const content = screen.getByTestId("content"), body = screen.getByTestId("body");
  for (let i = 0; i < 2; i++) {
    content.scrollTop = 300; body.scrollTop = 800; body.scrollLeft = 20;
    content.dataset.state = "open";
    await waitFor(() => expect([content.scrollTop, body.scrollTop, body.scrollLeft]).toEqual([0, 0, 0]));
    content.dataset.state = "closed";
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  expect(override).toHaveBeenCalledTimes(2);
  expect(targets).toEqual([content, content]);
  expect(override.mock.calls[0][0].type).toBe("focusScope.autoFocusOnMount");
  expect(document.activeElement).not.toBe(content);
});

it("chains React 19 callback-ref cleanup on detach", () => {
  const detached = vi.fn();
  const forwarded = vi.fn(() => detached);
  function Content() { const opening = useSheetOpening(undefined, forwarded); return <div ref={opening.ref} />; }
  const mounted = render(<Content />);
  expect(forwarded).toHaveBeenCalledTimes(1);
  mounted.unmount();
  expect(detached).toHaveBeenCalledTimes(1);
});

it("tracks the visible keyboard viewport and removes listeners on unmount", () => {
  const vv = new EventTarget() as VisualViewport;
  Object.defineProperties(vv, { height: { configurable: true, value: 500 }, offsetTop: { configurable: true, value: 40 } });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 844 });
  Object.defineProperty(window, "visualViewport", { configurable: true, value: vv });
  const remove = vi.spyOn(vv, "removeEventListener");
  function Content() { const opening = useSheetOpening(); return <div ref={opening.ref} data-testid="content" />; }
  const mounted = render(<Content />);
  const content = screen.getByTestId("content");
  expect(content.style.getPropertyValue("--sheet-viewport-height")).toBe("500px");
  expect(content.style.getPropertyValue("--sheet-viewport-bottom")).toBe("304px");
  Object.defineProperty(vv, "height", { value: 844 });
  Object.defineProperty(vv, "offsetTop", { value: 0 });
  vv.dispatchEvent(new Event("resize"));
  expect(content.style.getPropertyValue("--sheet-viewport-height")).toBe("844px");
  expect(content.style.getPropertyValue("--sheet-viewport-bottom")).toBe("0px");
  mounted.unmount();
  expect(remove.mock.calls.map(([type]) => type)).toEqual(["resize", "scroll"]);
});
