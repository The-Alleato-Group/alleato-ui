import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ConfirmDeleteDialog } from "@alleato/ui/ds/ConfirmDeleteDialog";
import { useState } from "react";
import { Button } from "@alleato/ui/components/button";

function Example() {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete report
      </Button>
      <ConfirmDeleteDialog
        open={open}
        onOpenChange={setOpen}
        itemName="draft report"
        onConfirm={() => {
          setOpen(false);
          setDeleted(true);
        }}
      />
      {deleted && <p role="status">Draft report deleted</p>}
    </>
  );
}

const meta = {
  title: "Patterns/Confirm delete dialog",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
