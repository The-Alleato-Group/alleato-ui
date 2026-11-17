import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Label } from "@alleato/ui/components/label";
import { Input } from "@alleato/ui/components/input";

const meta = {
  title: "Components/Label",
  component: Label,
  args: {},
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="grid max-w-xs gap-2">
      <Label {...args} htmlFor="crew">
        Crew name
      </Label>
      <Input id="crew" />
    </div>
  ),
};
