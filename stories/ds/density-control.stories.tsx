import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DensityControl } from "@alleato/ui/ds/density-control";
import { useState } from "react";

function Example() {
  const [density, setDensity] = useState("compact");
  return (
    <DensityControl
      className="max-w-xs"
      value={density}
      onChange={setDensity}
      options={[
        { value: "compact", label: "Compact" },
        { value: "comfortable", label: "Comfortable" },
      ]}
    />
  );
}

const meta = {
  title: "Patterns/Density control",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
