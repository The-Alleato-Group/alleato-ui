import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SplitButton } from "@alleato/ui/ds/SplitButton";
import { useState } from "react";

function Example() {
  const [message, setMessage] = useState("");
  return (
    <div className="grid justify-items-start gap-2">
      <SplitButton
        label="Save report"
        onClick={() => setMessage("Report saved")}
        actions={[
          {
            label: "Save and close",
            onClick: () => setMessage("Report saved and closed"),
          },
          { label: "Save draft", onClick: () => setMessage("Draft saved") },
        ]}
      />
      <p role="status">{message}</p>
    </div>
  );
}

const meta = {
  title: "Patterns/Split button",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
