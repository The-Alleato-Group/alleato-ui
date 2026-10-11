import * as React from "react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { DocumentAttachmentsView, DocumentLinkView, LinkedDocumentsView, type AttachmentDocument } from "../src/ds/document-picker";

const document: AttachmentDocument = {
  document_metadata_id: "doc-1", title: "Warehouse plan.pdf", file_name: null,
  file_path: null, download_url: "https://example.test/plan.pdf",
  document_type: "drawing", source_size: 2048, attached_at: "2026-10-10T12:00:00Z",
};
const types = [{ type_key: "drawing", display_name: "Drawing", category: "files", sort_order: 1 }];
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("attachment presentation with host-owned operations", () => {
  it("passes chosen and dropped files to the host without making requests", () => {
    const files = vi.fn();
    const { container } = render(<DocumentAttachmentsView documents={[]} onFiles={files} accept=".pdf" />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = new File(["plan"], "plan.pdf", { type: "application/pdf" });
    expect(input.accept).toBe(".pdf");
    fireEvent.change(input, { target: { files: [file] } });
    expect(files).toHaveBeenLastCalledWith([file]);
    fireEvent.drop(input.closest("label")!, { dataTransfer: { files: [file] } });
    expect(files).toHaveBeenCalledTimes(2);
    expect(files).toHaveBeenLastCalledWith([file]);
  });

  it("keeps type editing behind the menu and calls only the selected host operation", async () => {
    const edit = vi.fn(); const download = vi.fn(); const remove = vi.fn();
    const { rerender } = render(<DocumentAttachmentsView documents={[document]} documentTypes={types}
      onFiles={vi.fn()} onEditingChange={edit} onDocumentTypeChange={vi.fn()}
      onDownload={download} onDelete={remove} />);
    expect(screen.queryByRole("combobox")).toBeNull();
    fireEvent.keyDown(screen.getByRole("button", { name: /Attachment actions/ }), { key: "Enter" });
    fireEvent.click(await screen.findByRole("menuitem", { name: "Edit" }));
    expect(edit).toHaveBeenCalledWith("doc-1");
    expect(download).not.toHaveBeenCalled(); expect(remove).not.toHaveBeenCalled();
    rerender(<DocumentAttachmentsView documents={[document]} documentTypes={types}
      editingDocumentId="doc-1" onFiles={vi.fn()} onEditingChange={edit} onDocumentTypeChange={vi.fn()}
      onDownload={download} onDelete={remove} />);
    expect(screen.getByRole("combobox", { name: /Document type for/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(edit).toHaveBeenLastCalledWith(null);
    fireEvent.keyDown(screen.getByRole("button", { name: /Attachment actions/ }), { key: "Enter" });
    fireEvent.click(await screen.findByRole("menuitem", { name: "Download" }));
    expect(download).toHaveBeenCalledWith(document);
    fireEvent.keyDown(screen.getByRole("button", { name: /Attachment actions/ }), { key: "Enter" });
    fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
    expect(remove).toHaveBeenCalledWith("doc-1");
  });

  it("shows upload/loading state, disables the input and honors empty visibility", () => {
    const { container, rerender } = render(<DocumentAttachmentsView documents={[]} uploading={["plan.pdf"]} onFiles={vi.fn()} />);
    expect(screen.getByText("Uploading plan.pdf…")).toBeTruthy();
    expect(container.querySelector<HTMLInputElement>("input")!.disabled).toBe(true);
    rerender(<DocumentAttachmentsView documents={[]} isLoading hideIfEmpty onFiles={vi.fn()} />);
    expect(screen.getByText("Loading…")).toBeTruthy();
    rerender(<DocumentAttachmentsView documents={[]} hideIfEmpty onFiles={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders table metadata through the host formatter without exposing absent operations", () => {
    render(<DocumentAttachmentsView documents={[document]} documentTypes={types} displayMode="table"
      onFiles={vi.fn()} renderAttachedAt={(value) => `Host date: ${value}`} />);
    expect(screen.getByText("2 KB")).toBeTruthy();
    expect(screen.getByText(`Host date: ${document.attached_at}`)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Attachment actions/ })).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("passes uncategorizing to the host and disables only the pending document type", async () => {
    const change = vi.fn();
    const { rerender } = render(<DocumentAttachmentsView documents={[document]} documentTypes={types}
      displayMode="table" onFiles={vi.fn()} onDocumentTypeChange={change} />);
    fireEvent.keyDown(screen.getByRole("combobox"), { key: " " });
    fireEvent.click(await screen.findByRole("option", { name: "Uncategorized" }));
    expect(change).toHaveBeenCalledWith("doc-1", null);
    rerender(<DocumentAttachmentsView documents={[document]} documentTypes={types}
      displayMode="table" updatingDocumentId="doc-1" onFiles={vi.fn()} onDocumentTypeChange={change} />);
    expect((screen.getByRole("combobox") as HTMLButtonElement).disabled).toBe(true);
  });

  it("renders legacy linked documents and delegates linking and cancellation", () => {
    render(<LinkedDocumentsView documents={[document]} />);
    const link = screen.getByRole("link", { name: "Download" });
    expect(link.getAttribute("href")).toBe(document.download_url);
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    cleanup();
    const attach = vi.fn(); const change = vi.fn(); const cancel = vi.fn();
    render(<DocumentLinkView open value="doc-1" onOpen={vi.fn()} onAttach={attach} onValueChange={change} onCancel={cancel} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "doc-2" } });
    expect(change).toHaveBeenCalledWith("doc-2");
    fireEvent.click(screen.getByRole("button", { name: "Link" }));
    expect(attach).toHaveBeenCalledWith("doc-1");
    fireEvent.click(screen.getAllByRole("button")[1]);
    expect(cancel).toHaveBeenCalled();
  });

  it("contains no host aliases, HTTP requests, query cache, upload or entity policy", () => {
    const source = readFileSync(path.resolve(__dirname, "../src/ds/document-picker.tsx"), "utf8");
    expect(source).not.toMatch(/@\/|apiFetch|fetch\(|useQuery|useMutation|uploadEntityAttachment|DOCUMENT_PICKER_ENTITY_TYPES|\/api\//);
  });
});
