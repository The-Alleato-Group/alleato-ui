import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useArgs } from "storybook/preview-api";
import { NumberInput } from "@alleato/ui/components/number-input";

const meta = {
  title: "Components/Number input",
  component: NumberInput,
  parameters: {
    controls: {
      include: [
        "value",
        "decimals",
        "formatOnBlur",
        "autoSelectOnFocus",
        "disabled",
      ],
    },
  },
  argTypes: { value: { control: "text" } },
  args: {
    "aria-label": "Quantity",
    value: "1234.5",
    decimals: 2,
    formatOnBlur: true,
    autoSelectOnFocus: true,
    disabled: false,
  },
} satisfies Meta<typeof NumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: function Quantity(args) {
    const [, updateArgs] = useArgs();
    return (
      <NumberInput
        {...args}
        className="max-w-xs"
        onChange={(event) => updateArgs({ value: event.target.value })}
      />
    );
  },
};
