import * as React from "react";
import { createRoot } from "react-dom/client";
import { DocumentAttachmentsView, type AttachmentDocument } from "../../../../src/ds/document-picker";
import { PageShellFrame } from "../../../../src/layout/page-shell-frame";
import { Heading } from "../../../../src/ds/heading";
import { Text } from "../../../../src/ds/text";
import { Button } from "../../../../src/components/button";

const initial: AttachmentDocument[] = [
  { document_metadata_id: "1", title: "Warehouse plan.pdf", file_name: null, file_path: null, source_size: 2048, document_type: "drawing", attached_at: "2026-10-10T12:00:00Z", download_url: "https://example.test/plan.pdf" },
  { document_metadata_id: "2", title: "Insurance certificate.pdf", file_name: null, file_path: null, source_size: 4096, document_type: "insurance", attached_at: "2026-10-10T13:00:00Z", download_url: null },
];
function Consumer() {
 const [documents, setDocuments] = React.useState(initial);
 const [editing, setEditing] = React.useState<string | null>(null);
 const [mode, setMode] = React.useState<"list" | "table">("list");
 const [status, setStatus] = React.useState("Sample records; changes stay in this example.");
 return <PageShellFrame variant="detail" header={<><Heading level={1}>Shared document components</Heading><Text tone="muted">Local package example. Your project owns uploads, persistence and permissions.</Text></>}>
  <DocumentAttachmentsView documents={documents} editingDocumentId={editing} onEditingChange={setEditing}
    documentTypes={[{ type_key: "drawing", display_name: "Drawing", category: "files", sort_order: 1 }, { type_key: "insurance", display_name: "Insurance", category: "files", sort_order: 2 }]}
    heading={<Heading level={2}>Files</Heading>} accept=".pdf" displayMode={mode}
    onFiles={(files) => setStatus(`Host received ${files.map((file) => file.name).join(", ")}`)}
    onDocumentTypeChange={(id, type) => { setDocuments((rows) => rows.map((row) => row.document_metadata_id === id ? { ...row, document_type: type } : row)); setEditing(null); setStatus("Host updated document type."); }}
    onDelete={(id) => { setDocuments((rows) => rows.filter((row) => row.document_metadata_id !== id)); setStatus("Host removed sample attachment."); }}
    onDownload={(doc) => setStatus(`Host requested download: ${doc.title}`)}
    renderAttachedAt={() => "Oct 10, 2026"} />
  <Text>{status}</Text>
  <Button variant="outline" onClick={() => setMode(mode === "list" ? "table" : "list")}>{mode === "list" ? "Show table" : "Show list"}</Button>
 </PageShellFrame>;
}
createRoot(document.getElementById("root")!).render(<Consumer />);
