import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EditableDetailField } from "@alleato/ui/ds/EditableDetailField";
import { useState } from "react";

function Example() {
  const [value, setValue] = useState("Jordan Smith");
  return (
    <EditableDetailField
      label="Field coordinator"
      value={value}
      emptyPlaceholder="Assign a coordinator"
      onSave={async (next) => setValue(next)}
    />
  );
}

const meta = {
  title: "Patterns/Editable detail field",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
