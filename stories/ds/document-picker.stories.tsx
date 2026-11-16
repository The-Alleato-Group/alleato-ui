import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  DocumentAttachmentsView,
  DocumentLinkView,
  LinkedDocumentsView,
  type AttachmentDocument,
} from "@alleato/ui/ds/document-picker";
import { useState } from "react";

function makeDocument(name: string, size: number | null): AttachmentDocument {
  return {
    document_metadata_id: name,
    title: name,
    file_name: name,
    source_size: size,
    attached_at: "2026-11-16T14:00:00Z",
    document_type: null,
    file_path: null,
    download_url: null,
  };
}

function Example() {
  const [documents, setDocuments] = useState([
    makeDocument("Sprinkler layout.pdf", 18400),
  ]);
  const [linked, setLinked] = useState<AttachmentDocument[]>([]);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  return (
    <div className="grid max-w-xl gap-4">
      <DocumentAttachmentsView
        documents={documents}
        onFiles={(files) =>
          setDocuments([
            ...documents,
            ...files.map((file) => makeDocument(file.name, file.size)),
          ])
        }
        onDelete={(id) =>
          setDocuments(
            documents.filter((item) => item.document_metadata_id !== id),
          )
        }
      />
      <DocumentLinkView
        open={open}
        value={value}
        onOpen={() => setOpen(true)}
        onValueChange={setValue}
        onAttach={(id) => {
          setLinked([makeDocument(id, null)]);
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
      {linked.length > 0 && <LinkedDocumentsView documents={linked} />}
    </div>
  );
}

const meta = {
  title: "Patterns/Document picker",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
