import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Textarea } from "@alleato/ui/components/textarea";

const meta = {
  title: "Components/Textarea",
  component: Textarea,
  args: {
    "aria-label": "Field notes",
    placeholder: "Add field notes",
    disabled: false,
    "aria-invalid": false,
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <Textarea {...args} className="max-w-sm" />,
};
export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: "Inspection confirmed for Thursday." },
};
