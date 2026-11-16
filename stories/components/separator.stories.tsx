import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Separator } from "@alleato/ui/components/separator";

const meta = {
  title: "Components/Separator",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="grid max-w-sm gap-3">
      <span>Project settings</span>
      <Separator />
      <span className="text-muted-foreground">Notifications</span>
    </div>
  ),
};
