import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Stat, StatRow } from "@alleato/ui/ds/stat";

const meta = {
  title: "Patterns/Stat",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <StatRow>
      <Stat
        label="Inspections"
        value="24"
        change={{ value: "+12%", positive: true }}
      />
      <Stat
        label="Open issues"
        value="8"
        change={{ value: "−4%", positive: true }}
      />
    </StatRow>
  ),
};
