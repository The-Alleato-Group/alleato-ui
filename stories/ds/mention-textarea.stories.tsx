import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MentionTextarea } from "@alleato/ui/ds/mention-textarea";
import { useState } from "react";
import { samplePeople } from "../sample-data";

function Example() {
  const [value, setValue] = useState("");
  return (
    <div className="max-w-md">
      <MentionTextarea
        aria-label="Field note"
        placeholder="Type @ to mention a teammate"
        value={value}
        onChange={setValue}
        users={samplePeople}
      />
    </div>
  );
}

const meta = {
  title: "Patterns/Mention textarea",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
