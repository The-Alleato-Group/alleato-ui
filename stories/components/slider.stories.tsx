import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Slider } from "@alleato/ui/components/slider";

const meta = {
  title: "Components/Slider",
  component: Slider,
  args: {
    defaultValue: [40],
    max: 100,
    step: 5,
    disabled: false,
    "aria-label": "Completion percentage",
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <Slider {...args} className="max-w-sm" />,
};
export const Range: Story = {
  args: { defaultValue: [25, 75], "aria-label": "Allowed completion range" },
};
