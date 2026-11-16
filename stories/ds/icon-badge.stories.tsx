import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { IconBadge } from "@alleato/ui/ds/icon-badge";
import { ClipboardCheck } from "lucide-react";

const meta = {
  title: "Patterns/Icon badge",
  component: IconBadge,
  args: { size: "md", children: <ClipboardCheck /> },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg", "xl"] },
    children: { control: false },
  },
} satisfies Meta<typeof IconBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
