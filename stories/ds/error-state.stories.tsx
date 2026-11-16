import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ErrorState } from "@alleato/ui/ds/error-state";

const meta = {
  title: "Patterns/Error state",
  component: ErrorState,
  args: {
    title: "Inspections unavailable",
    description: "The records could not be loaded. Try again in a moment.",
  },
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
