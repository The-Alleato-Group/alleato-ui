import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TableSidePanel } from "@alleato/ui/tables/table-side-panel";
import { useState } from "react";
import { Button } from "@alleato/ui/components/button";

function Example() {
  const [open, setOpen] = useState(true);
  return (
    <div className="relative min-h-80">
      <Button variant="outline" onClick={() => setOpen(!open)}>
        {open ? "Hide" : "Show"} detail
      </Button>
      {open && (
        <TableSidePanel
          title="North Warehouse"
          width={320}
          showCloseButton
          onClose={() => setOpen(false)}
        >
          <div className="p-4">Inspection is scheduled for Nov 16.</div>
        </TableSidePanel>
      )}
    </div>
  );
}

const meta = {
  title: "Tables/Table side panel",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
