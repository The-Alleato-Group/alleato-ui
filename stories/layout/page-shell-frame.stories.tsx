import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageShellFrame } from "@alleato/ui/layout/page-shell-frame";
import { PageTitle } from "@alleato/ui/layout/headings";

const meta = {
  title: "Layouts/Page shell frame",
  component: PageShellFrame,
  args: { variant: "detail", children: null },
  argTypes: {
    variant: {
      control: "select",
      options: ["dashboard", "table", "form", "detail", "content", "workspace"],
    },
    children: { control: false },
  },
} satisfies Meta<typeof PageShellFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <PageShellFrame {...args} header={<PageTitle>Inspection report</PageTitle>}>
      <div className="rounded-md border p-4">
        Rendered in the shared {args.variant} frame.
      </div>
    </PageShellFrame>
  ),
};
