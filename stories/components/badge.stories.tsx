import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "@alleato/ui/components/badge";

const meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: { controls: { include: ["children", "variant"] } },
  args: { children: "In review", variant: "default" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Assigned</Badge>
      <Badge variant="secondary">Draft</Badge>
      <Badge variant="outline">In review</Badge>
      <Badge variant="destructive">Overdue</Badge>
    </div>
  ),
};
