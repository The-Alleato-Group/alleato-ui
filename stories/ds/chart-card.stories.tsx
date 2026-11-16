import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChartCard } from "@alleato/ui/ds/chart-card";

const meta = {
  title: "Patterns/Chart card",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ChartCard className="max-w-sm p-5">
      <h2 className="font-semibold">Upcoming inspections</h2>
      <p className="text-3xl tabular-nums">12</p>
      <p className="text-sm text-muted-foreground">Across 3 active projects</p>
    </ChartCard>
  ),
};
