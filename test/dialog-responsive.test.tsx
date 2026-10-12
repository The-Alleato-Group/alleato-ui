import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../src/components/dialog";
import { Modal, ModalContent, ModalDescription, ModalTitle, ModalTrigger } from "../src/components/unified-modal";

function viewport(width: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: width < 768,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
}
let modal = false;
function Editor({ showCloseButton = true, onEscapeKeyDown = vi.fn() }) {
  const [open, setOpen] = React.useState(false);
  if (modal) return <Modal open={open} onOpenChange={setOpen}>
    <ModalTrigger>Edit content</ModalTrigger>
    <ModalContent size="2xl" hideCloseButton={!showCloseButton} data-testid="editor" onEscapeKeyDown={onEscapeKeyDown}>
      <ModalTitle>Edit content item</ModalTitle>
      <ModalDescription>Choose fields.</ModalDescription>
      <input aria-label="Owner" />
    </ModalContent>
  </Modal>;
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger>Edit content</DialogTrigger>
    <DialogContent showCloseButton={showCloseButton} data-testid="editor" onEscapeKeyDown={onEscapeKeyDown}>
      <DialogTitle>Edit content item</DialogTitle>
      <DialogDescription>Choose fields.</DialogDescription>
      <input aria-label="Owner" />
    </DialogContent>
  </Dialog>;
}
async function openEditor() {
  fireEvent.click(screen.getByRole("button", { name: "Edit content" }));
  return await screen.findByRole("dialog", { name: "Edit content item" });
}
afterEach(cleanup);
beforeEach(() => viewport(390));

describe.each(["DialogContent", "ModalContent"])("%s presentation and accessibility", (entry) => {
  beforeEach(() => { modal = entry === "ModalContent"; });
  it.each([375, 390, 414])("uses the canonical bottom sheet at %ipx with forwarded content props", async (width) => {
    viewport(width); render(<Editor />);
    const dialog = await openEditor();
    expect(dialog.getAttribute("data-presentation")).toBe("bottom-sheet");
    expect(dialog.className).toContain("slide-in-from-bottom");
    expect(dialog.className).toContain("bottom-0");
    expect(dialog.className).not.toContain("top-[50%]");
    expect(dialog.getAttribute("data-testid")).toBe("editor");
    expect(screen.getByRole("button", { name: "Close" }).className).toContain("size-11");
    expect(screen.getByRole("textbox", { name: "Owner" })).toBeTruthy();
  });
  it.each([768, 1024, 1440])("retains the centered desktop presentation at %ipx", async (width) => {
    viewport(width); render(<Editor />);
    const dialog = await openEditor();
    expect(dialog.getAttribute("data-presentation")).toBeNull();
    expect(dialog.className).toContain("top-[50%]");
    expect(dialog.className).not.toContain("slide-in-from-bottom");
  });
  it("preserves Escape handling, controlled dismissal and trigger focus", async () => {
    const onEscape = vi.fn(); render(<Editor onEscapeKeyDown={onEscape} />);
    const trigger = screen.getByRole("button", { name: "Edit content" });
    await openEditor();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onEscape).toHaveBeenCalledOnce();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
  it("respects hidden close controls on mobile", async () => {
    render(<Editor showCloseButton={false} />); await openEditor();
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  });
});
