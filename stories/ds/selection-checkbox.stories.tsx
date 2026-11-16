import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SelectionCheckbox } from "@alleato/ui/ds/selection-checkbox";
import { useState } from "react";

function Example() {
  const [checked, setChecked] = useState<boolean | "indeterminate">(
    "indeterminate",
  );
  return (
    <div className="flex items-center gap-2">
      <SelectionCheckbox
        checked={checked}
        onCheckedChange={setChecked}
        aria-label="Select all inspections"
      />
      <span>Select all inspections</span>
    </div>
  );
}

const meta = {
  title: "Patterns/Selection checkbox",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
