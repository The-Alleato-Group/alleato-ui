import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getSidePanelWidth,
  SidePanel,
  SidePanelBody,
  SidePanelContent,
  SidePanelHeader,
  SidePanelTitle,
} from "../src/components/side-panel";

function Panel(props: React.ComponentProps<typeof SidePanelContent>) {
  return (
    <SidePanel open>
      <SidePanelContent {...props}>
        <SidePanelHeader>
          <SidePanelTitle>Edit Project</SidePanelTitle>
        </SidePanelHeader>
        <SidePanelBody>Fields</SidePanelBody>
      </SidePanelContent>
    </SidePanel>
  );
}

const panelWidth = () => screen.getByRole("dialog").style.width;

/** jsdom has no layout: give the panel the width a browser would report. */
function stubPanelWidth(width: number) {
  const panel = screen.getByRole("dialog");
  panel.getBoundingClientRect = () =>
    ({ width, height: 800, top: 0, left: 0, right: width, bottom: 800 }) as DOMRect;
}

// jsdom ships neither PointerEvent (so fireEvent.pointer* would drop clientX)
// nor the pointer-capture calls.
if (typeof window.PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
    }
  }
  window.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
}

beforeEach(() => {
  window.localStorage.clear();
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1600 });
  HTMLElement.prototype.setPointerCapture = () => undefined;
  HTMLElement.prototype.releasePointerCapture = () => undefined;
});
afterEach(() => cleanup());

describe("SidePanelContent width", () => {
  it("opens form sheets wider than the old 34rem md rung", () => {
    render(<Panel size="md" />);
    expect(panelWidth()).toBe("min(100vw, 44rem)");
    expect(getSidePanelWidth("md")).toBe("min(100vw, 44rem)");
  });

  it("drags wider from the inner edge and remembers the width for that rung", () => {
    render(<Panel size="md" />);
    stubPanelWidth(704);
    const handle = screen.getByRole("separator", { name: "Resize panel" });

    // A right-side panel grows as the inner (left) edge moves left.
    fireEvent.pointerDown(handle, { button: 0, clientX: 896, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 696, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientX: 696, pointerId: 1 });

    expect(panelWidth()).toBe("min(100vw, 904px)");
    expect(window.localStorage.getItem("alleato-ui.side-panel-width.md")).toBe("904");

    cleanup();
    render(<Panel size="md" />);
    expect(panelWidth()).toBe("min(100vw, 904px)");
  });

  it("never drags past the viewport gutter or below the minimum", () => {
    render(<Panel size="md" />);
    stubPanelWidth(704);
    const handle = screen.getByRole("separator", { name: "Resize panel" });

    fireEvent.pointerDown(handle, { button: 0, clientX: 896, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: -5000, pointerId: 1 });
    expect(panelWidth()).toBe("min(100vw, 1552px)");
    fireEvent.pointerMove(handle, { clientX: 5000, pointerId: 1 });
    expect(panelWidth()).toBe("min(100vw, 320px)");
    fireEvent.pointerUp(handle, { pointerId: 1 });
  });

  it("resizes from the keyboard and double-click restores the default", () => {
    render(<Panel size="md" />);
    stubPanelWidth(704);
    const handle = screen.getByRole("separator", { name: "Resize panel" });

    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    expect(panelWidth()).toBe("min(100vw, 736px)");

    fireEvent.doubleClick(handle);
    expect(panelWidth()).toBe("min(100vw, 44rem)");
    expect(window.localStorage.getItem("alleato-ui.side-panel-width.md")).toBeNull();
  });

  it("keeps separate widths for separate keys", () => {
    window.localStorage.setItem("alleato-ui.side-panel-width.md", "900");
    render(<Panel size="md" widthKey="feedback" />);
    expect(panelWidth()).toBe("min(100vw, 44rem)");
  });

  it("has no handle when the host opts out or the panel is full width", () => {
    render(<Panel size="md" resizable={false} />);
    expect(screen.queryByRole("separator")).toBeNull();
    cleanup();
    render(<Panel size="full" />);
    expect(screen.queryByRole("separator")).toBeNull();
  });
});
