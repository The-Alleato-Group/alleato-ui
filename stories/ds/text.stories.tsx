import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Text } from "@alleato/ui/ds/text";

const meta = {
  title: "Patterns/Text",
  component: Text,
  args: {
    children: "Inspection reports are ready to share.",
    size: "sm",
    tone: "default",
    weight: "normal",
  },
  argTypes: {
    tone: {
      control: "select",
      options: ["default", "muted", "destructive", "success", "warning"],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "base", "lg", "xl", "2xl"],
    },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
