import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EditModeActions } from "@alleato/ui/ds/EditModeActions";
import { useState } from "react";

function Example() {
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <>
      <EditModeActions
        isEditing={editing}
        onEdit={() => setEditing(true)}
        onSave={() => {
          setEditing(false);
          setMessage("Changes saved.");
        }}
        onCancel={() => {
          setEditing(false);
          setMessage("Editing canceled.");
        }}
      />
      <p role="status">{message}</p>
    </>
  );
}

const meta = {
  title: "Patterns/Edit mode actions",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
