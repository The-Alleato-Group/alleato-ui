import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SectionCard } from "@alleato/ui/ds/section-card";

const meta = {
  title: "Patterns/Section card",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <SectionCard title="Drawings" className="max-w-md">
      <SectionCard.Item
        title="Sprinkler layout"
        subtitle="Revision 04"
        status="Approved"
      />
      <SectionCard.Item
        title="Site access plan"
        subtitle="Revision 02"
        status="Draft"
      />
    </SectionCard>
  ),
};
