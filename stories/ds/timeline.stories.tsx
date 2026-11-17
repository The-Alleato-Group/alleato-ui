import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Timeline } from "@alleato/ui/ds/timeline";

const meta = {
  title: "Patterns/Timeline",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Timeline
      className="max-w-md"
      items={[
        {
          id: "1",
          title: "Inspection complete",
          description: "All checkpoints passed.",
          timestamp: "Nov 16, 10:30 AM",
          variant: "success",
        },
        {
          id: "2",
          title: "Revision received",
          description: "Review drawing 04.",
          timestamp: "Nov 15, 2:15 PM",
          variant: "warning",
        },
        {
          id: "3",
          title: "Inspection scheduled",
          timestamp: "Nov 12, 9:00 AM",
        },
      ]}
    />
  ),
};
