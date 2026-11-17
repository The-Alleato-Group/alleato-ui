import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TrendMetricCard } from "@alleato/ui/ds/trend-metric-card";
import { inspectionTrend } from "../sample-data";

const meta = {
  title: "Patterns/Trend metric card",
  component: TrendMetricCard,
  args: {
    label: "Inspections completed",
    value: "32",
    unit: "inspections",
    data: inspectionTrend,
    changeLabel: "this week",
  },
} satisfies Meta<typeof TrendMetricCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="max-w-xl">
      <TrendMetricCard {...args} />
    </div>
  ),
};
export const TableView: Story = { args: { view: "table" } };
