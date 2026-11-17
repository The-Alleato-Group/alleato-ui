import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InlineSelectEditor } from "@alleato/ui/tables/inline-select-editor";
import { useState } from "react";
import { Button } from "@alleato/ui/components/button";
import { statuses } from "../sample-data";

function Example() {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState("active");
  const [draft, setDraft] = useState(status);
  return (
    <div className="grid justify-items-start gap-3">
      {editing ? (
        <InlineSelectEditor
          value={draft}
          options={statuses}
          onChange={setDraft}
          onCommit={(next) => {
            setStatus(next ?? draft);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
          searchable
        />
      ) : (
        <Button
          variant="outline"
          onClick={() => {
            setDraft(status);
            setEditing(true);
          }}
        >
          Edit status
        </Button>
      )}
      <p role="status">
        Status: {statuses.find(({ value }) => value === status)?.label}
      </p>
    </div>
  );
}

const meta = {
  title: "Tables/Inline select editor",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
