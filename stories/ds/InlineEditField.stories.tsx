import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InlineEditField } from "@alleato/ui/ds/InlineEditField";
import { useState } from "react";

function Example() {
  const [value, setValue] = useState("Riser room");
  return (
    <div className="max-w-sm">
      <InlineEditField
        label="Inspection area"
        type="text"
        value={value}
        onSave={async (next) => setValue(next)}
      />
    </div>
  );
}

const meta = {
  title: "Patterns/Inline edit field",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
