import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DetailField, DetailFieldGrid } from "@alleato/ui/ds/DetailField";

const meta = {
  title: "Patterns/Detail field",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DetailFieldGrid columns={2}>
      <DetailField label="Project">North Warehouse</DetailField>
      <DetailField label="Budget" value={48000} currency />
      <DetailField label="Target date" value="2026-11-24" date />
      <DetailField
        label="Coordinator"
        keepWhenEmpty
        emptyPlaceholder="Unassigned"
      />
    </DetailFieldGrid>
  ),
};
