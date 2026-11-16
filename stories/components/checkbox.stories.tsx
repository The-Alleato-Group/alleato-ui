import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Checkbox } from "@alleato/ui/components/checkbox";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  args: { defaultChecked: false, disabled: false },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox {...args} key={String(args.defaultChecked)} id="inspected" />
      <label htmlFor="inspected">Area inspected</label>
    </div>
  ),
};
export const Mixed: Story = { args: { defaultChecked: "indeterminate" } };
