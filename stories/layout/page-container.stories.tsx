import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageContainer } from "@alleato/ui/layout/page-container";

const meta = {
  title: "Layouts/Page container",
  component: PageContainer,
  args: { maxWidth: "md", padding: true, children: null },
  argTypes: {
    maxWidth: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "2xl", "full"],
    },
    children: { control: false },
  },
} satisfies Meta<typeof PageContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <PageContainer {...args}>
      <div className="rounded-md border p-4">
        Content follows the shared page width and gutter.
      </div>
    </PageContainer>
  ),
};
