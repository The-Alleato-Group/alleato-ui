import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LocalDateTime } from "@alleato/ui/ds/local-date-time";

const meta = {
  title: "Patterns/Local date and time",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <LocalDateTime value="2026-11-16T14:30:00Z" format="MMM d, yyyy · h:mm a" />
  ),
};
