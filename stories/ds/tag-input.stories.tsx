import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TagInput } from "@alleato/ui/ds/tag-input";
import { useState } from "react";

function Example() {
  const [value, setValue] = useState(["Sprinklers", "Riser room"]);
  return (
    <div className="grid max-w-sm gap-2">
      <label htmlFor="report-tags">Inspection tags</label>
      <TagInput
        inputId="report-tags"
        value={value}
        onChange={setValue}
        placeholder="Type a tag and press Enter"
        maxTags={5}
      />
    </div>
  );
}

const meta = {
  title: "Patterns/Tag input",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
