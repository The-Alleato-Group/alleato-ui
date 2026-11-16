import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SectionHeader } from "@alleato/ui/ds/section-header";
import { Button } from "@alleato/ui/components/button";

const meta = {
  title: "Patterns/Section header",
  component: SectionHeader,
  args: { title: "Drawings" },
} satisfies Meta<typeof SectionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <SectionHeader
      {...args}
      action={
        <Button variant="outline" size="sm">
          Add drawing
        </Button>
      }
    />
  ),
};
