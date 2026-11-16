import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@alleato/ui/components/toggle-group";

const meta = {
  title: "Components/Toggle group",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ToggleGroup
      type="single"
      defaultValue="all"
      variant="outline"
      aria-label="Record filter"
    >
      <ToggleGroupItem value="all">All</ToggleGroupItem>
      <ToggleGroupItem value="open">Open</ToggleGroupItem>
      <ToggleGroupItem value="closed">Closed</ToggleGroupItem>
    </ToggleGroup>
  ),
};
