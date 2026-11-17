import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Heading } from "@alleato/ui/ds/heading";

const meta = {
  title: "Patterns/Heading",
  component: Heading,
  args: { children: "Project overview", level: 2, as: "h2" },
  argTypes: { level: { control: "select", options: [1, 2, 3, 4, 5, 6] } },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Scale: Story = {
  render: () => (
    <div className="grid gap-4">
      <Heading level={1}>Page overview</Heading>
      <Heading level={2}>Section heading</Heading>
      <Heading level={3}>Subsection</Heading>
      <Heading level={4}>Small heading</Heading>
      <Heading level={5}>Label heading</Heading>
      <Heading level={6}>Compact heading</Heading>
    </div>
  ),
};
