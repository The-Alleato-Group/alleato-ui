import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CommentComposer } from "@alleato/ui/ds/comment-composer";
import { useState } from "react";
import { samplePeople } from "../sample-data";

function Example() {
  const [value, setValue] = useState("");
  const [posted, setPosted] = useState("");
  return (
    <div className="grid max-w-lg gap-3">
      <CommentComposer
        author={{ name: "Jordan Smith" }}
        users={samplePeople}
        value={value}
        onChange={setValue}
        placeholder="Write a comment. Type @ to mention someone."
        onSubmit={() => {
          setPosted(value);
          setValue("");
        }}
      />
      {posted && <p role="status">Posted: {posted}</p>}
    </div>
  );
}

const meta = {
  title: "Patterns/Comment composer",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
