import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import AnimatedEmptyState from "@alleato/ui/ds/empty-state-motion";
import { ClipboardList } from "lucide-react";

const meta = {
  title: "Patterns/Animated empty state",
  component: AnimatedEmptyState,
  args: {
    title: "No inspections yet",
    description: "The entrance respects the browser’s reduced motion setting.",
    icon: <ClipboardList />,
  },
  argTypes: { icon: { control: false } },
} satisfies Meta<typeof AnimatedEmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Entrance: Story = {};
