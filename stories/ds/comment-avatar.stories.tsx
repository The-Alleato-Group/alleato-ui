import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CommentAvatar } from "@alleato/ui/ds/comment-avatar";

const meta = {
  title: "Patterns/Comment avatar",
  component: CommentAvatar,
  args: { name: "Jordan Smith", size: 28 },
} satisfies Meta<typeof CommentAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
