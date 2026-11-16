import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Switch } from "@alleato/ui/components/switch";

const meta = {
  title: "Components/Switch",
  component: Switch,
  args: { defaultChecked: true, disabled: false },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Switch {...args} key={String(args.defaultChecked)} id="reminders" />
      <label htmlFor="reminders">Weekly reminders</label>
    </div>
  ),
};
