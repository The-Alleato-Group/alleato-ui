import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InlineAddButton } from "@alleato/ui/ds/inline-add-button";

const meta = {
  title: "Patterns/Inline add button",
  component: InlineAddButton,
  args: { children: "Add checkpoint", disabled: false },
} satisfies Meta<typeof InlineAddButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
