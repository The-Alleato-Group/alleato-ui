import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Toggle } from "@alleato/ui/components/toggle";

const meta = {
  title: "Components/Toggle",
  component: Toggle,
  args: { variant: "outline", disabled: false, defaultPressed: false },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <Toggle {...args}>Show closed items</Toggle>,
};
