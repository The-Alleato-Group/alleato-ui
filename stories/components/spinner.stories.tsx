import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Spinner } from "@alleato/ui/components/spinner";

const meta = {
  title: "Components/Spinner",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Spinner /> Loading project…
    </div>
  ),
};
