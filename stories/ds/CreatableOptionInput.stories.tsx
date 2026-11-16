import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CreatableOptionInput } from "@alleato/ui/ds/CreatableOptionInput";
import { useState } from "react";

const areas = [
  { label: "Riser room", value: "riser" },
  { label: "Loading dock", value: "dock" },
];

function Example() {
  const [value, setValue] = useState("riser");
  const [reset, setReset] = useState(0);
  return (
    <div className="grid max-w-sm gap-2">
      <CreatableOptionInput
        value={value}
        placeholder="Inspection area"
        options={areas}
        onCommit={setValue}
        onCancel={() => setReset(reset + 1)}
        key={reset}
      />
      <p role="status">Saved area: {value}</p>
    </div>
  );
}

const meta = {
  title: "Patterns/Creatable option input",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
