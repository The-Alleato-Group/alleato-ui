import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { KpiRow, KpiStrip } from "@alleato/ui/ds/kpi";

const meta = {
  title: "Patterns/KPI",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const metrics = [
  {
    label: "Inspections",
    value: "24",
    context: "This month",
    trend: [4, 7, 5, 8],
    delta: { value: "+12%", positive: true },
  },
  { label: "Punch list", value: "68%", progress: { value: 68 } },
];

export const Default: Story = { render: () => <KpiRow metrics={metrics} /> };
export const CompactStrip: Story = {
  render: () => <KpiStrip metrics={metrics} density="compact" />,
};
