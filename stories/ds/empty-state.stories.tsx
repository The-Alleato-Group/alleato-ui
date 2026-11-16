import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EmptyState } from "@alleato/ui/ds/empty-state";
import { ClipboardList } from "lucide-react";

const meta = {
  title: "Patterns/Empty state",
  component: EmptyState,
  args: {
    title: "No inspections scheduled",
    description: "Schedule an inspection to start tracking field work.",
    density: "default",
    motion: "none",
    icon: <ClipboardList />,
  },
  argTypes: {
    icon: { control: false },
    density: { control: "select", options: ["default", "compact"] },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Compact: Story = {
  args: { density: "compact", title: "No matching inspections" },
};
export const Entrance: Story = { args: { motion: "entrance" } };
