import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TablePageActions } from "@alleato/ui/tables/table-page-actions";
import { useState } from "react";

function Example() {
  const [choice, setChoice] = useState("");
  return (
    <div className="grid justify-items-start gap-2">
      <TablePageActions
        addOptions={[
          { label: "Inspection", onClick: () => setChoice("New inspection") },
          { label: "Project", onClick: () => setChoice("New project") },
        ]}
        moreOptions={[
          {
            label: "Export reports",
            onClick: () => setChoice("Export reports"),
          },
        ]}
      />
      <p role="status">{choice}</p>
    </div>
  );
}

const meta = {
  title: "Tables/Table page actions",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
