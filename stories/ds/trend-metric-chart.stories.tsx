import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TrendChart } from "@alleato/ui/ds/trend-metric-chart";
import { inspectionTrend } from "../sample-data";

const meta = {
  title: "Patterns/Trend metric chart",
  component: TrendChart,
  args: {
    view: "line",
    format: "number",
    gradientId: "inspection-trend",
    peakIndex: 3,
    unit: "inspections",
    series: [
      {
        name: "Completed",
        color: "hsl(var(--primary))",
        data: inspectionTrend,
      },
    ],
  },
} satisfies Meta<typeof TrendChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="h-64 max-w-xl">
      <TrendChart {...args} />
    </div>
  ),
};
export const BarView: Story = { args: { view: "bar" } };
