import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "@alleato/ui/components/input";
import { Label } from "@alleato/ui/components/label";

const meta = {
  title: "Components/Input",
  component: Input,
  args: {
    placeholder: "e.g. North Warehouse",
    disabled: false,
    "aria-invalid": false,
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor="project-name">Project name</Label>
      <Input {...args} id="project-name" />
    </div>
  ),
};
export const Invalid: Story = {
  args: { "aria-invalid": true, defaultValue: "?" },
};
