import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Progress } from "@alleato/ui/components/progress";

const meta = {
  title: "Components/Progress",
  component: Progress,
  args: { value: 64, "aria-label": "Punch list completion" },
  argTypes: { value: { control: { type: "range", min: 0, max: 100 } } },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="max-w-sm">
      <Progress {...args} />
    </div>
  ),
};
export const Complete: Story = { args: { value: 100 } };
