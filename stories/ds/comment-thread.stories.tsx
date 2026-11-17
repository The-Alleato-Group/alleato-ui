import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  CommentThread,
  CommentReplyGroup,
} from "@alleato/ui/ds/comment-thread";
import { useState } from "react";
import { CommentComposer } from "@alleato/ui/ds/comment-composer";
import { CommentRow } from "@alleato/ui/ds/comment-row";
import { samplePeople } from "../sample-data";

function Example() {
  const [value, setValue] = useState("");
  const [comments, setComments] = useState<string[]>([]);
  return (
    <CommentThread
      className="max-w-lg"
      count={comments.length}
      composer={
        <CommentComposer
          author={{ name: "Jordan Smith" }}
          users={samplePeople}
          value={value}
          onChange={setValue}
          onSubmit={() => {
            setComments([...comments, value]);
            setValue("");
          }}
        />
      }
    >
      <CommentRow
        authorName="Morgan Lee"
        timestamp="Nov 16"
        body="The sprinkler drawing is ready for review."
      />
      <CommentReplyGroup count={1}>
        <CommentRow
          authorName="Taylor Reed"
          timestamp="Nov 16"
          body="I'll review it this afternoon."
        />
      </CommentReplyGroup>
      {comments.map((comment, index) => (
        <CommentRow
          key={index}
          authorName="Jordan Smith"
          timestamp="Just now"
          body={comment}
        />
      ))}
    </CommentThread>
  );
}

const meta = {
  title: "Patterns/Comment thread",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
