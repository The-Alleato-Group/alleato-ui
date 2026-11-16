import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@alleato/ui/components/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

const meta = {
  title: "Components/Chart",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ChartContainer
      className="h-60 w-full max-w-xl"
      config={{
        inspections: { label: "Inspections", color: "hsl(var(--primary))" },
      }}
    >
      <BarChart
        accessibilityLayer
        data={[
          { week: "Oct 26", inspections: 8 },
          { week: "Nov 2", inspections: 13 },
          { week: "Nov 9", inspections: 11 },
        ]}
      >
        <CartesianGrid vertical={false} />
        <XAxis dataKey="week" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          isAnimationActive={false}
          dataKey="inspections"
          fill="var(--color-inspections)"
          radius={4}
        />
      </BarChart>
    </ChartContainer>
  ),
};
