import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@alleato/ui/components/button";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    controls: { include: ["children", "disabled", "size", "variant"] },
  },
  args: {
    children: "Save changes",
    variant: "default",
    size: "default",
    disabled: false,
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "brand",
        "action",
        "inverse",
        "control",
        "secondary",
        "outline",
        "ghost",
        "destructive",
        "link",
      ],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "default", "lg", "summary"],
    },
    children: { control: "text" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button>Save changes</Button>
      <Button variant="secondary">Preview</Button>
      <Button variant="outline">Duplicate</Button>
      <Button variant="ghost">Cancel</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="link">Learn more</Button>
      <Button disabled>Unavailable</Button>
    </div>
  ),
};
