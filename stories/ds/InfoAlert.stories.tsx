import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InfoAlert } from "@alleato/ui/ds/InfoAlert";

const meta = {
  title: "Patterns/Info alert",
  component: InfoAlert,
  args: {
    variant: "info",
    children: "Changes apply to future inspection reports.",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["info", "warning", "success", "error"],
    },
  },
} satisfies Meta<typeof InfoAlert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Warning: Story = {
  args: {
    variant: "warning",
    children: "A new drawing revision is available.",
  },
};
export const Error: Story = {
  args: { variant: "error", children: "The inspection could not be saved." },
};
