import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CommentRow } from "@alleato/ui/ds/comment-row";

const meta = {
  title: "Patterns/Comment row",
  component: CommentRow,
  args: {
    authorName: "Jordan Smith",
    timestamp: "Nov 16, 9:30 AM",
    body: "The west loading gate is open for the morning inspection.",
  },
} satisfies Meta<typeof CommentRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
