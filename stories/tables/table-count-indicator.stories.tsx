import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TableCountIndicator } from "@alleato/ui/tables/table-count-indicator";

const meta = {
  title: "Tables/Table count indicator",
  component: TableCountIndicator,
  args: { count: 3 },
} satisfies Meta<typeof TableCountIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { count: 0 } };
