import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  StatusBadge,
  StatusDot,
  StatusText,
} from "@alleato/ui/ds/status-badge";

const meta = {
  title: "Patterns/Status badge",
  component: StatusBadge,
  args: { status: "In review", presentation: "pill" },
  argTypes: {
    presentation: { control: "inline-radio", options: ["dot", "pill"] },
  },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Statuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {["Draft", "In review", "Approved", "Overdue", "Closed"].map((status) => (
        <StatusBadge key={status} status={status} presentation="pill" />
      ))}
    </div>
  ),
};
export const DotAndText: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <StatusDot status="Approved" />
      <StatusText status="Approved" />
    </div>
  ),
};
